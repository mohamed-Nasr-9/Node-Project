import Book from "../models/Book.js";
import Author from "../models/Author.js";
import Category from "../models/Category.js";

/**
 * Build query filters for books (by name instead of ID)
 */
const buildFilter = async (query) => {
  const filter = {};

  // 🔹 Filter by author name (case-insensitive)
  if (query.author) {
    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(query.author);

    let authorDoc;
    if (isValidObjectId) {
      // If it's a valid ObjectId, search by ID
      authorDoc = await Author.findById(query.author);
    } else {
      // Otherwise, search by name (case-insensitive) for backward compatibility
      authorDoc = await Author.findOne({
        name: { $regex: new RegExp(query.author, "i") }
      });
    }

    if (authorDoc) {
      // Use $in operator because authors is an array
      filter.authors = { $in: [authorDoc._id] };
    } else {
      // No author found - set filter to return no results
      filter.authors = { $in: [] };
    }
  }

  // 🔹 Filter by category (accepts both ID and name)
  if (query.category) {
    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(query.category);

    let categoryDoc;
    if (isValidObjectId) {
      // If it's a valid ObjectId, search by ID
      categoryDoc = await Category.findById(query.category);
    } else {
      // Otherwise, search by name (case-insensitive)
      categoryDoc = await Category.findOne({
        name: { $regex: new RegExp(query.category, "i") }
      });
    }

    if (categoryDoc) filter.categories = categoryDoc._id;
    else filter.categories = null;
  }

  // 🔹 Price range filtering
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) {
      filter.price.$gte = parseFloat(query.minPrice);
    }
    if (query.maxPrice !== undefined) {
      filter.price.$lte = parseFloat(query.maxPrice);
    }
  }

  // 🔹 Active status filter
  if (query.isActive !== undefined) filter.isActive = query.isActive;

  return filter;
};

/**
 * GET /api/books
 * List books with optional search and filters
 */
export const listBooks = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);
    const skip = (page - 1) * limit;

    // ✅ buildFilter is now async
    const filter = await buildFilter(req.query);
    let sort = { createdAt: -1 }; // default
    if (req.query.sort) {
      const sortStr = req.query.sort;
      if (sortStr.startsWith('-')) {
        // Descending: "-price" -> { price: -1 }
        const field = sortStr.substring(1);
        sort = { [field]: -1 };
      } else {
        // Ascending: "price" -> { price: 1 }
        sort = { [sortStr]: 1 };
      }
    }
    const searchTerm = req.query.q;

    let books = [];
    let total = 0;

    // ✅ Use Atlas Search if query.q exists
    if (searchTerm) {
      const pipeline = [
        {
          $search: {
            index: "bookSearch", // Atlas Search index name
            text: {
              query: searchTerm,
              path: ["title", "description"]
            }
          }
        },
        { $match: filter },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            meta: [{ $count: "total" }],
            items: [{ $skip: skip }, { $limit: limit }]
          }
        }
      ];

      const result = await Book.aggregate(pipeline);
      books = result[0]?.items || [];
      total = result[0]?.meta?.[0]?.total || 0;
    } else {
      // fallback to normal find if no search query
      const [items, count] = await Promise.all([
        Book.find(filter)
          .populate("authors categories")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Book.countDocuments(filter)
      ]);

      books = items;
      total = count;
    }

    res.json({
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      items: books
    });
  } catch (err) {
    console.error("❌ Book list error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/books/:id
 * Get single book details
 */
export const getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("authors categories");
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/books
 * Create new book (Author only)
 */
export const createBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({ message: "Book created successfully", book });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * PATCH /api/books/:id
 * Update existing book
 */
export const updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book updated successfully", book });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * DELETE /api/books/:id
 * Delete book
 */
export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
