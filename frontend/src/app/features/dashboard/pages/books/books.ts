import { Component, OnInit } from '@angular/core';
import { BookService, BookFilters } from '../../../../core/services/book';
import { CategoryService } from '../../../../core/services/category';
import { AuthorService } from '../../../../core/services/author';
import { AuthService } from '../../../../core/services/auth';
import { UploadService } from '../../../../core/services/upload.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-books',
  standalone: false,
  templateUrl: './books.html',
  styleUrls: ['./books.css'],
})
export class Books implements OnInit {
  books: any[] = [];
  categories: any[] = [];
  authors: any[] = [];
  
  loading = true;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalBooks = 0;
  totalPages = 0;

  // Filters
  filters: BookFilters = {
    page: 1,
    limit: 12,
    sort: 'createdAt',
    isActive: undefined
  };

  // Filter UI state
  searchQuery = '';
  selectedCategory = '';
  selectedAuthor = '';
  minPrice: number | string | null = null;
  maxPrice: number | string | null = null;
  sortBy = 'createdAt';
  statusFilter = 'all'; // all, active, inactive

  // Form state
  showBookForm = false;
  showDetailsForm = false;
  editingBook: any = null;
  newlyCreatedBook: any = null; // Store the newly created book for step 2
  bookForm: any = {
    title: '',
    description: '',
    price: 0,
    stock: 0,
    pdfUrl: '',
    image: { url: '' },
    isbn: '',
    sku: '',
    publisher: '',
    language: '',
    publishedAt: '',
    authors: [],
    categories: [],
    isActive: true
  };
  // Step 1 form (required fields only)
  requiredForm: any = {
    title: '',
    price: 0,
    stock: 0,
    authors: []
  };
  // Step 2 form (optional details)
  detailsForm: any = {
    description: '',
    pdfUrl: '',
    image: { url: '' },
    isbn: '',
    sku: '',
    publisher: '',
    language: '',
    publishedAt: '',
    categories: [],
    isActive: true
  };

  // File uploads
  selectedImageFile: File | null = null;
  selectedPdfFile: File | null = null;
  selectedEditImageFile: File | null = null;
  selectedEditPdfFile: File | null = null;

  constructor(
    private bookService: BookService,
    private categoryService: CategoryService,
    private authorService: AuthorService,
    private authService: AuthService,
    private uploadService: UploadService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadAuthors();
    this.loadBooks();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories || [];
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadAuthors() {
    this.authorService.getAuthors().subscribe({
      next: (response: any) => {
        // Handle both array and object with items
        if (Array.isArray(response)) {
          this.authors = response.filter((a: any) => a.status === 'approved');
        } else if (response.items) {
          this.authors = response.items.filter((a: any) => a.status === 'approved');
        } else {
          this.authors = [];
        }
      },
      error: (err) => {
        console.error('Error loading authors:', err);
        this.authors = [];
      }
    });
  }

  loadBooks() {
    this.loading = true;
    this.error = null;

    const filters: BookFilters = {
      page: this.currentPage,
      limit: this.pageSize,
      sort: this.sortBy
    };

    if (this.searchQuery && this.searchQuery.trim()) {
      filters.q = this.searchQuery.trim();
    }

    if (this.selectedCategory) {
      filters.category = this.selectedCategory;
    }

    if (this.selectedAuthor) {
      filters.author = this.selectedAuthor;
    }

    if (this.minPrice !== null && this.minPrice !== '') {
      filters.minPrice = typeof this.minPrice === 'string' ? parseFloat(this.minPrice) : this.minPrice;
    }

    if (this.maxPrice !== null && this.maxPrice !== '') {
      filters.maxPrice = typeof this.maxPrice === 'string' ? parseFloat(this.maxPrice) : this.maxPrice;
    }

    if (this.statusFilter === 'active') {
      filters.isActive = true;
    } else if (this.statusFilter === 'inactive') {
      filters.isActive = false;
    }

    this.bookService.getAllBooks(filters).subscribe({
      next: (response) => {
        this.books = response.items || response.books || [];
        this.totalBooks = response.meta?.total || 0;
        this.totalPages = response.meta?.pages || 0;
        this.currentPage = response.meta?.page || 1;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load books';
        this.loading = false;
        console.error('Error loading books:', err);
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadBooks();
  }

  onCategoryChange() {
    this.currentPage = 1;
    this.loadBooks();
  }

  onAuthorChange() {
    this.currentPage = 1;
    this.loadBooks();
  }

  onPriceFilterChange() {
    this.currentPage = 1;
    this.loadBooks();
  }

  onSortChange() {
    this.currentPage = 1;
    this.loadBooks();
  }

  onStatusFilterChange() {
    this.currentPage = 1;
    this.loadBooks();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadBooks();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedAuthor = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'createdAt';
    this.statusFilter = 'all';
    this.currentPage = 1;
    this.loadBooks();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(this.totalPages, 10);
    const startPage = Math.max(1, this.currentPage - 4);
    const endPage = Math.min(this.totalPages, startPage + 9);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  openCreateBookForm() {
    this.editingBook = null;
    this.newlyCreatedBook = null;
    this.requiredForm = {
      title: '',
      price: 0,
      stock: 0,
      authors: []
    };
    this.detailsForm = {
      description: '',
      pdfUrl: '',
      image: { url: '' },
      isbn: '',
      sku: '',
      publisher: '',
      language: '',
      publishedAt: '',
      categories: [],
      isActive: true
    };
    this.selectedImageFile = null;
    this.selectedPdfFile = null;
    this.showBookForm = true;
    this.showDetailsForm = false;
  }

  openEditBookForm(book: any) {
    this.editingBook = book;
    this.bookForm = {
      title: book.title || '',
      description: book.description || '',
      price: book.price || 0,
      stock: book.stock || 0,
      pdfUrl: book.pdfUrl || '',
      image: book.image || { url: '' },
      isbn: book.isbn || '',
      sku: book.sku || '',
      publisher: book.publisher || '',
      language: book.language || '',
      publishedAt: book.publishedAt ? new Date(book.publishedAt).toISOString().split('T')[0] : '',
      authors: book.authors ? (Array.isArray(book.authors) ? book.authors.map((a: any) => a._id || a.id || a) : []) : [],
      categories: book.categories ? (Array.isArray(book.categories) ? book.categories.map((c: any) => c._id || c.id || c) : []) : [],
      isActive: book.isActive !== undefined ? book.isActive : true
    };
    this.selectedEditImageFile = null;
    this.selectedEditPdfFile = null;
    this.showBookForm = true;
  }

  closeBookForm() {
    this.showBookForm = false;
    this.showDetailsForm = false;
    this.editingBook = null;
    this.newlyCreatedBook = null;
    this.selectedImageFile = null;
    this.selectedPdfFile = null;
    this.selectedEditImageFile = null;
    this.selectedEditPdfFile = null;
  }

  onImageFileSelected(event: any, isEdit: boolean = false) {
    const file = event.target.files[0];
    if (file) {
      if (isEdit) {
        this.selectedEditImageFile = file;
      } else {
        this.selectedImageFile = file;
      }
    }
  }

  onPdfFileSelected(event: any, isEdit: boolean = false) {
    const file = event.target.files[0];
    if (file) {
      if (isEdit) {
        this.selectedEditPdfFile = file;
      } else {
        this.selectedPdfFile = file;
      }
    }
  }

  closeDetailsForm() {
    this.showDetailsForm = false;
    this.newlyCreatedBook = null;
    this.loadBooks(); // Refresh the book list
  }

  onCategorySelect(categoryId: string) {
    if (!this.bookForm.categories) {
      this.bookForm.categories = [];
    }
    const index = this.bookForm.categories.indexOf(categoryId);
    if (index > -1) {
      this.bookForm.categories.splice(index, 1);
    } else {
      this.bookForm.categories.push(categoryId);
    }
  }

  isCategorySelected(categoryId: string): boolean {
    return this.bookForm.categories && this.bookForm.categories.includes(categoryId);
  }

  onAuthorSelect(authorId: string) {
    if (!this.bookForm.authors) {
      this.bookForm.authors = [];
    }
    const index = this.bookForm.authors.indexOf(authorId);
    if (index > -1) {
      this.bookForm.authors.splice(index, 1);
    } else {
      this.bookForm.authors.push(authorId);
    }
  }

  isAuthorSelected(authorId: string): boolean {
    return this.bookForm.authors && this.bookForm.authors.includes(authorId);
  }

  // For required form (step 1)
  onRequiredAuthorSelect(authorId: string) {
    if (!this.requiredForm.authors) {
      this.requiredForm.authors = [];
    }
    const index = this.requiredForm.authors.indexOf(authorId);
    if (index > -1) {
      this.requiredForm.authors.splice(index, 1);
    } else {
      this.requiredForm.authors.push(authorId);
    }
  }

  isRequiredAuthorSelected(authorId: string): boolean {
    return this.requiredForm.authors && this.requiredForm.authors.includes(authorId);
  }

  // For details form (step 2)
  onDetailsCategorySelect(categoryId: string) {
    if (!this.detailsForm.categories) {
      this.detailsForm.categories = [];
    }
    const index = this.detailsForm.categories.indexOf(categoryId);
    if (index > -1) {
      this.detailsForm.categories.splice(index, 1);
    } else {
      this.detailsForm.categories.push(categoryId);
    }
  }

  isDetailsCategorySelected(categoryId: string): boolean {
    return this.detailsForm.categories && this.detailsForm.categories.includes(categoryId);
  }

  // Step 1: Submit required fields to create book
  submitRequiredForm() {
    // Validation
    if (!this.requiredForm.title || !this.requiredForm.title.trim()) {
      alert('Title is required');
      return;
    }

    if (this.requiredForm.price < 0) {
      alert('Price must be 0 or greater');
      return;
    }

    if (this.requiredForm.stock < 0) {
      alert('Stock must be 0 or greater');
      return;
    }

    if (!this.requiredForm.authors || this.requiredForm.authors.length === 0) {
      alert('At least one author is required');
      return;
    }

    // Prepare required data only
    const requiredData: any = {
      title: this.requiredForm.title.trim(),
      price: parseFloat(this.requiredForm.price),
      stock: parseInt(this.requiredForm.stock),
      authors: this.requiredForm.authors
    };

    // Create book with required fields only
    this.bookService.createBook(requiredData).subscribe({
      next: (response) => {
        // Store the newly created book
        this.newlyCreatedBook = response.book || response;
        // Close the required form and show details form
        this.showBookForm = false;
        this.showDetailsForm = true;
        alert('Book created successfully! Now fill in the details.');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to create book');
        console.error('Error creating book:', err);
      }
    });
  }

  // Step 2: Submit optional details to update the book
  submitDetailsForm() {
    if (!this.newlyCreatedBook) {
      alert('Error: Book not found. Please try again.');
      this.closeDetailsForm();
      return;
    }

    // Prepare details data
    const detailsData: any = {};

    if (this.detailsForm.description) detailsData.description = this.detailsForm.description.trim();
    if (this.detailsForm.isbn) detailsData.isbn = this.detailsForm.isbn.trim();
    if (this.detailsForm.sku) detailsData.sku = this.detailsForm.sku.trim();
    if (this.detailsForm.publisher) detailsData.publisher = this.detailsForm.publisher.trim();
    if (this.detailsForm.language) detailsData.language = this.detailsForm.language.trim();
    if (this.detailsForm.publishedAt) detailsData.publishedAt = new Date(this.detailsForm.publishedAt).toISOString();
    if (this.detailsForm.categories && this.detailsForm.categories.length > 0) detailsData.categories = this.detailsForm.categories;
    if (this.detailsForm.isActive !== undefined) detailsData.isActive = this.detailsForm.isActive;

    // Initialize image object if image file is selected (prevents backend error)
    if (this.selectedImageFile && !detailsData.image) {
      detailsData.image = {};
    }

    // Update the book with details
    const bookId = this.newlyCreatedBook._id || this.newlyCreatedBook.id;
    if (!bookId) {
      alert('Error: Book ID not found. Please try again.');
      return;
    }

    this.bookService.updateBook(bookId, detailsData).subscribe({
      next: (response) => {
        let uploadPromises: Promise<any>[] = [];

        // Upload image if selected
        if (this.selectedImageFile) {
          const imageUpload = firstValueFrom(this.uploadService.uploadImage(bookId, this.selectedImageFile))
            .then(() => {
              console.log('Image uploaded successfully');
              alert('Image uploaded successfully!');
            })
            .catch((err) => {
              console.error('Error uploading image:', err);
              const errorMsg = err.error?.error || err.error?.message || err.message || 'Failed to upload image';
              alert(`Image upload failed: ${errorMsg}`);
            });
          uploadPromises.push(imageUpload);
        }

        // Upload PDF if selected
        if (this.selectedPdfFile) {
          const pdfUpload = firstValueFrom(this.uploadService.uploadPdf(bookId, this.selectedPdfFile))
            .then(() => {
              console.log('PDF uploaded successfully');
              alert('PDF uploaded successfully!');
            })
            .catch((err) => {
              console.error('Error uploading PDF:', err);
              const errorMsg = err.error?.error || err.error?.message || err.message || 'Failed to upload PDF';
              alert(`PDF upload failed: ${errorMsg}`);
            });
          uploadPromises.push(pdfUpload);
        }

        // Wait for all uploads to complete
        Promise.all(uploadPromises).finally(() => {
          alert('Book details updated successfully!');
          this.closeDetailsForm();
          this.loadBooks();
        });
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update book details');
        console.error('Error updating book details:', err);
      }
    });
  }

  // For editing existing books (keep the old form)
  submitBookForm() {
    if (!this.bookForm.title || !this.bookForm.title.trim()) {
      alert('Title is required');
      return;
    }

    if (this.bookForm.price < 0) {
      alert('Price must be 0 or greater');
      return;
    }

    if (this.bookForm.stock < 0) {
      alert('Stock must be 0 or greater');
      return;
    }

    // Prepare form data
    const formData: any = {
      title: this.bookForm.title.trim(),
      description: this.bookForm.description || '',
      price: parseFloat(this.bookForm.price),
      stock: parseInt(this.bookForm.stock),
      isActive: this.bookForm.isActive
    };

    if (this.bookForm.isbn) formData.isbn = this.bookForm.isbn.trim();
    if (this.bookForm.sku) formData.sku = this.bookForm.sku.trim();
    if (this.bookForm.publisher) formData.publisher = this.bookForm.publisher.trim();
    if (this.bookForm.language) formData.language = this.bookForm.language.trim();
    if (this.bookForm.publishedAt) formData.publishedAt = new Date(this.bookForm.publishedAt).toISOString();
    if (this.bookForm.authors && this.bookForm.authors.length > 0) formData.authors = this.bookForm.authors;
    if (this.bookForm.categories && this.bookForm.categories.length > 0) formData.categories = this.bookForm.categories;

    // Initialize image object if image file is selected (prevents backend error)
    if (this.selectedEditImageFile && !formData.image) {
      formData.image = {};
    }

    const bookId = this.editingBook._id || this.editingBook.id;
    if (!bookId) {
      alert('Error: Book ID not found. Please try again.');
      return;
    }

    // Update existing book
    this.bookService.updateBook(bookId, formData).subscribe({
      next: (response) => {
        let uploadPromises: Promise<any>[] = [];

        // Upload image if selected
        if (this.selectedEditImageFile) {
          const imageUpload = firstValueFrom(this.uploadService.uploadImage(bookId, this.selectedEditImageFile))
            .then(() => {
              console.log('Image uploaded successfully');
              alert('Image uploaded successfully!');
            })
            .catch((err) => {
              console.error('Error uploading image:', err);
              const errorMsg = err.error?.error || err.error?.message || err.message || 'Failed to upload image';
              alert(`Image upload failed: ${errorMsg}`);
            });
          uploadPromises.push(imageUpload);
        }

        // Upload PDF if selected
        if (this.selectedEditPdfFile) {
          const pdfUpload = firstValueFrom(this.uploadService.uploadPdf(bookId, this.selectedEditPdfFile))
            .then(() => {
              console.log('PDF uploaded successfully');
              alert('PDF uploaded successfully!');
            })
            .catch((err) => {
              console.error('Error uploading PDF:', err);
              const errorMsg = err.error?.error || err.error?.message || err.message || 'Failed to upload PDF';
              alert(`PDF upload failed: ${errorMsg}`);
            });
          uploadPromises.push(pdfUpload);
        }

        // Wait for all uploads to complete
        Promise.all(uploadPromises).finally(() => {
          alert('Book updated successfully!');
          this.closeBookForm();
          this.loadBooks();
        });
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update book');
        console.error('Error updating book:', err);
      }
    });
  }

  deleteBook(book: any) {
    if (!confirm(`Are you sure you want to delete "${book.title}"?`)) {
      return;
    }

    this.bookService.deleteBook(book._id || book.id).subscribe({
      next: (response) => {
        alert('Book deleted successfully!');
        this.loadBooks();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete book');
        console.error('Error deleting book:', err);
      }
    });
  }
}

