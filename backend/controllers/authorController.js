// controllers/authorController.js
import Author from "../models/Author.js";
import User from "../models/User.js"; // Added import to update user roles

/** 
 * Helper to build filters for admin list
 */
const buildFilter = (q = {}) => {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.q) filter.name = { $regex: String(q.q), $options: "i" };
  return filter;
};

/**
 * GET /api/authors
 * Admin list (optional filters)
 */
export const listAuthors = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "name";

    const filter = buildFilter(req.query);

    const [items, total] = await Promise.all([
      Author.find(filter)
        .populate("userId", "email username role")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Author.countDocuments(filter)
    ]);

    res.json({
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      items
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/authors/:id
 * Get single author profile
 */
export const getAuthor = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id)
      .populate("userId", "email username role");
    if (!author) return res.status(404).json({ message: "Author not found" });
    res.json(author);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/authors/apply
 * User applies to become an author
 */
export const applyAsAuthor = async (req, res) => {
  try {
    const { name, bio } = req.body;

    const existing = await Author.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({
        message: "You have already applied or are an author",
        author: existing
      });
    }

    const author = await Author.create({
      userId: req.user._id,
      name,
      bio,
      status: "pending",
      appliedAt: new Date()
    });

    res.status(201).json({ message: "Application submitted", author });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * GET /api/authors/me
 * Get my own author profile/application
 */
export const getMyAuthor = async (req, res) => {
  try {
    const author = await Author.findOne({ userId: req.user._id });
    if (!author) return res.status(404).json({ message: "No author record found" });
    res.json(author);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PATCH /api/authors/:id/approve
 * Admin approves an author and updates user's role
 */
export const approveAuthor = async (req, res) => {
  try {
    const update = {
      status: "approved",
      approvedAt: new Date(),
      rejectedAt: undefined,
      reason: undefined
    };

    if (req.body.name) update.name = req.body.name;
    if (req.body.bio !== undefined) update.bio = req.body.bio;

    const author = await Author.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!author) return res.status(404).json({ message: "Author not found" });

    // Promote user to author role
    await User.findByIdAndUpdate(author.userId, { role: "author" });

    res.json({ message: "Author approved and user role updated", author });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * PATCH /api/authors/:id/reject
 * Admin rejects an author and optionally reverts their role to 'user'
 */
export const rejectAuthor = async (req, res) => {
  try {
    const { reason } = req.body;

    const author = await Author.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectedAt: new Date(),
        reason
      },
      { new: true, runValidators: true }
    );

    if (!author) return res.status(404).json({ message: "Author not found" });

    // If the user was previously approved, revert their role back to user
    const user = await User.findById(author.userId);
    if (user && user.role === "author") {
      await User.findByIdAndUpdate(author.userId, { role: "user" });
    }

    res.json({ message: "Author rejected and user role updated if applicable", author });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
/**
 * PATCH /api/authors/:id/revoke
 * Admin revokes an approved author's status (demotes them)
 */
export const revokeAuthor = async (req, res) => {
  try {
    // Find the author first
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: "Author not found" });

    // Only approved authors can be revoked
    if (author.status !== "approved") {
      return res.status(400).json({ message: "Only approved authors can be revoked" });
    }

    // Update author record
    author.status = "revoked";
    author.rejectedAt = new Date();
    author.reason = req.body.reason || "Revoked by admin";
    await author.save();

    // Downgrade user back to 'user' role
    await User.findByIdAndUpdate(author.userId, { role: "user" });

    res.json({ message: "Author privileges revoked and user role downgraded", author });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


/**
 * DELETE /api/authors/:id
 * Admin hard deletes author record
 */
export const deleteAuthor = async (req, res) => {
  try {
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) return res.status(404).json({ message: "Author not found" });
    res.json({ message: "Author deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
