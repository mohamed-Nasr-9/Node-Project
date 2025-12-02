import { Component, OnInit } from '@angular/core';
import { AuthorService } from '../../core/services/author';
import { BookService } from '../../core/services/book';
import { CategoryService } from '../../core/services/category';
import { AuthService } from '../../core/services/auth';
import { UploadService } from '../../core/services/upload.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-author-profile',
  standalone: false,
  templateUrl: './author-profile.html',
  styleUrls: ['./author-profile.css'],
})
export class AuthorProfileComponent implements OnInit {
  author: any = null;
  books: any[] = [];
  categories: any[] = [];
  loading = true;
  error: string | null = null;

  // Book form state
  showBookForm = false;
  showDetailsForm = false;
  editingBook: any = null;
  newlyCreatedBook: any = null; // Store the newly created book for step 2
  bookForm: any = {
    title: '',
    description: '',
    price: 0,
    stock: 0,
    isbn: '',
    sku: '',
    publisher: '',
    language: '',
    publishedAt: new Date().toISOString().split('T')[0],
    authors: [],
    categories: [],
    isActive: true,
    image: { url: '' },
    pdfUrl: ''
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

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalBooks = 0;
  totalPages = 0;

  constructor(
    private authorService: AuthorService,
    private bookService: BookService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private uploadService: UploadService
  ) {}

  ngOnInit() {
    this.loadAuthorProfile();
    this.loadCategories();
  }

  loadAuthorProfile() {
    this.loading = true;
    this.error = null;

    this.authorService.getMyAuthorProfile().subscribe({
      next: (author) => {
        // Normalize author object: ensure _id exists (backend might return id instead of _id)
        if (author) {
          // If _id is missing but id exists, set _id to id value
          if (!author._id && author.id) {
            author._id = author.id;
          }
          // Also ensure id exists if _id exists (for consistency)
          if (author._id && !author.id) {
            author.id = author._id;
          }
        }
        this.author = author;
        console.log('Author profile loaded:', author);
        console.log('Author ID (_id):', author?._id);
        console.log('Author ID (id):', author?.id);
        this.loadMyBooks();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load author profile';
        this.loading = false;
        console.error('Error loading author profile:', err);
      }
    });
  }

  loadMyBooks() {
    if (!this.author) {
      this.loading = false;
      return;
    }

    // Get author ID (API expects author ID, not name)
    const authorId = this.author._id || this.author.id;
    if (!authorId) {
      this.loading = false;
      this.error = 'Author ID not found';
      return;
    }

    // Filter books by author ID (backend filters by author ID)
    const filters = {
      page: this.currentPage,
      limit: this.pageSize,
      author: authorId
    };

    console.log('Loading books for author ID:', authorId);
    console.log('Author ID type:', typeof authorId);
    console.log('Author ID length:', authorId?.length);
    
    // Debug: Also try fetching all books to see if any exist
    this.bookService.getAllBooks({ page: 1, limit: 100 }).subscribe({
      next: (allBooksResponse) => {
        console.log('=== DEBUG: ALL BOOKS IN DATABASE ===');
        console.log('Total books found:', allBooksResponse.items?.length || 0);
        
        if (allBooksResponse.items && allBooksResponse.items.length > 0) {
          console.log('Current author ID for comparison:', authorId);
          console.log('Current author ID type:', typeof authorId);
          
          // Check author IDs in all books
          let foundMatchingBook = false;
          allBooksResponse.items.forEach((book: any, index: number) => {
            if (book.authors && book.authors.length > 0) {
              const bookAuthorIds = book.authors.map((a: any) => {
                if (typeof a === 'object') {
                  const objId = a._id || a.id || String(a);
                  return String(objId);
                }
                return String(a);
              });
              
              const matches = bookAuthorIds.some((id: string) => String(id) === String(authorId));
              
              console.log(`\nBook ${index + 1}: "${book.title}"`);
              console.log(`  - Book ID: ${book._id || book.id}`);
              console.log(`  - Author IDs in book:`, bookAuthorIds);
              console.log(`  - Author IDs types:`, bookAuthorIds.map((id: string) => typeof id));
              console.log(`  - Current author ID: ${authorId} (type: ${typeof authorId})`);
              console.log(`  - MATCHES? ${matches ? '✅ YES' : '❌ NO'}`);
              
              if (matches) {
                foundMatchingBook = true;
                console.log(`  ⚠️ This book SHOULD appear but doesn't! Backend filter issue.`);
              }
            } else {
              console.log(`\nBook ${index + 1}: "${book.title}" - NO AUTHORS`);
            }
          });
          
          if (!foundMatchingBook && allBooksResponse.items.length > 0) {
            console.warn('\n⚠️ NO BOOKS FOUND WITH MATCHING AUTHOR ID!');
            console.warn('This means books exist but were created with different author IDs.');
            console.warn('Possible causes:');
            console.warn('1. Books were created before author ID normalization');
            console.warn('2. Backend stored author IDs in different format');
            console.warn('3. Author ID format mismatch (string vs ObjectId)');
          }
        } else {
          console.log('No books found in database at all.');
        }
        console.log('=== END DEBUG ===\n');
      },
      error: (err) => {
        console.error('Error fetching all books:', err);
      }
    });
    
    this.bookService.getAllBooks(filters).subscribe({
      next: (response) => {
        console.log('Books response (with author filter):', response);
        this.books = response.items || [];
        this.totalBooks = response.meta?.total || 0;
        this.totalPages = response.meta?.pages || 0;
        
        // WORKAROUND: If backend filter returns 0 books but we know books exist,
        // fetch all books and filter on frontend
        if (this.books.length === 0 && this.totalBooks === 0) {
          console.warn('Backend filter returned 0 books. Applying frontend filter workaround...');
          
          // Fetch all books and filter client-side
          this.bookService.getAllBooks({ page: 1, limit: 1000 }).subscribe({
            next: (allBooksResponse) => {
              if (allBooksResponse.items && allBooksResponse.items.length > 0) {
                // Filter books by author ID on frontend
                const filteredBooks = allBooksResponse.items.filter((book: any) => {
                  if (!book.authors || book.authors.length === 0) return false;
                  
                  const bookAuthorIds = book.authors.map((a: any) => {
                    if (typeof a === 'object') {
                      return String(a._id || a.id || a);
                    }
                    return String(a);
                  });
                  
                  return bookAuthorIds.some((id: string) => String(id) === String(authorId));
                });
                
                console.log(`Frontend filter found ${filteredBooks.length} books for author`);
                this.books = filteredBooks;
                this.totalBooks = filteredBooks.length;
                this.totalPages = Math.ceil(filteredBooks.length / this.pageSize);
                this.loading = false;
                this.error = null;
              } else {
                this.loading = false;
                this.error = null;
              }
            },
            error: (err) => {
              console.error('Error in frontend filter workaround:', err);
              this.loading = false;
              this.error = null;
            }
          });
        } else {
          this.loading = false;
          this.error = null; // Clear any previous errors
          console.log(`Loaded ${this.books.length} books for author`);
        }
      },
      error: (err) => {
        console.error('Error loading books:', err);
        // Extract more specific error message
        const errorMsg = err.error?.error || err.error?.message || err.message || 'Failed to load books';
        this.error = errorMsg;
        this.loading = false;
        // If it's a 400 error, it might be due to invalid author ID
        if (err.status === 400) {
          this.error = 'Invalid request. Please ensure you are logged in and have author privileges.';
        }
      }
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  openCreateBookForm() {
    if (!this.author) {
      alert('Author profile not loaded. Please wait...');
      return;
    }

    // Get author ID - prefer _id since that's what MongoDB uses internally
    // After normalization, _id should always exist
    const authorId = this.author._id || this.author.id;
    if (!authorId) {
      alert('Author ID not found. Please refresh the page.');
      return;
    }

    console.log('Opening create book form with author ID:', authorId);
    console.log('Author object:', this.author);
    console.log('Using _id for book creation:', this.author._id);

    this.editingBook = null;
    this.newlyCreatedBook = null;
    this.requiredForm = {
      title: '',
      price: 0,
      stock: 0,
      authors: [authorId] // Pre-fill with current author ID
    };
    console.log('Required form authors:', this.requiredForm.authors);
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
      isbn: book.isbn || '',
      sku: book.sku || '',
      publisher: book.publisher || '',
      language: book.language || '',
      publishedAt: book.publishedAt ? new Date(book.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      authors: book.authors?.map((a: any) => a._id || a) || [this.author._id],
      categories: book.categories?.map((c: any) => c._id || c) || [],
      isActive: book.isActive !== undefined ? book.isActive : true,
      image: book.image || { url: '' },
      pdfUrl: book.pdfUrl || ''
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
    // Reset to first page and refresh the book list
    this.currentPage = 1;
    this.loadMyBooks(); // Refresh the book list
  }

  onCategoryChange(event: any, categoryId: string) {
    const checked = event.target.checked;
    // Handle both edit form and details form
    if (this.showDetailsForm) {
      // For details form (step 2)
      if (checked) {
        if (!this.detailsForm.categories.includes(categoryId)) {
          this.detailsForm.categories.push(categoryId);
        }
      } else {
        this.detailsForm.categories = this.detailsForm.categories.filter((id: string) => id !== categoryId);
      }
    } else {
      // For edit form
      if (checked) {
        if (!this.bookForm.categories.includes(categoryId)) {
          this.bookForm.categories.push(categoryId);
        }
      } else {
        this.bookForm.categories = this.bookForm.categories.filter((id: string) => id !== categoryId);
      }
    }
  }

  isCategorySelected(categoryId: string): boolean {
    return this.bookForm.categories.includes(categoryId);
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

    // Validate author IDs are valid
    const authorIds = this.requiredForm.authors.filter((id: any) => id && (typeof id === 'string' || typeof id === 'object'));
    if (authorIds.length === 0) {
      alert('At least one valid author ID is required');
      return;
    }

    // Ensure authors array contains only string IDs (not objects)
    const validAuthorIds = authorIds.map((id: any) => {
      if (typeof id === 'object' && (id._id || id.id)) {
        return id._id || id.id;
      }
      return String(id);
    });

    console.log('Original author IDs from form:', this.requiredForm.authors);
    console.log('Validated author IDs for creation:', validAuthorIds);

    // Prepare required data only
    const requiredData: any = {
      title: this.requiredForm.title.trim(),
      price: parseFloat(String(this.requiredForm.price)),
      stock: parseInt(String(this.requiredForm.stock), 10),
      authors: validAuthorIds
    };

    // Validate numeric values
    if (isNaN(requiredData.price) || requiredData.price < 0) {
      alert('Price must be a valid number greater than or equal to 0');
      return;
    }

    if (isNaN(requiredData.stock) || requiredData.stock < 0) {
      alert('Stock must be a valid number greater than or equal to 0');
      return;
    }

    console.log('Creating book with data:', requiredData);
    console.log('Author IDs being sent (type):', typeof validAuthorIds[0]);
    console.log('Author IDs being sent (value):', validAuthorIds);
    console.log('Current author _id:', this.author._id);
    console.log('Current author id:', this.author.id);

    // Create book with required fields only
    this.bookService.createBook(requiredData).subscribe({
      next: (response) => {
        console.log('Book creation response:', response);
        // Store the newly created book
        this.newlyCreatedBook = response.book || response;
        console.log('Newly created book:', this.newlyCreatedBook);
        if (this.newlyCreatedBook && this.newlyCreatedBook.authors) {
          console.log('Book authors in response:', this.newlyCreatedBook.authors);
          // Extract author IDs from response
          const responseAuthorIds = this.newlyCreatedBook.authors.map((a: any) => {
            if (typeof a === 'object') return a._id || a.id || String(a);
            return String(a);
          });
          console.log('Author IDs in created book response:', responseAuthorIds);
          console.log('Expected author ID:', this.author._id || this.author.id);
          console.log('Author IDs match?', responseAuthorIds.some((id: string) => String(id) === String(this.author._id || this.author.id)));
        }
        
        // Close the required form and show details form
        this.showBookForm = false;
        this.showDetailsForm = true;
        
        // Wait a bit before refreshing to ensure backend has processed
        setTimeout(() => {
          // Verify the book was created by fetching it directly
          const createdBookId = this.newlyCreatedBook._id || this.newlyCreatedBook.id;
          if (createdBookId) {
            console.log('Fetching created book directly by ID:', createdBookId);
            this.bookService.getBookById(createdBookId).subscribe({
              next: (book) => {
                console.log('Fetched book directly:', book);
                if (book && book.authors) {
                  console.log('Book authors (direct fetch):', book.authors);
                  // Check if authors are objects or IDs
                  const bookAuthorIds = book.authors.map((a: any) => {
                    if (typeof a === 'object') return a._id || a.id;
                    return a;
                  });
                  console.log('Book author IDs:', bookAuthorIds);
                  console.log('Current author ID:', this.author._id || this.author.id);
                  console.log('Author IDs match:', bookAuthorIds.includes(this.author._id || this.author.id));
                }
              },
              error: (err) => {
                console.error('Error fetching created book:', err);
              }
            });
          }
          
          // Refresh the books list to show the newly created book
          this.currentPage = 1; // Reset to first page
          const filterAuthorId = this.author._id || this.author.id;
          console.log('Refreshing books list with author ID:', filterAuthorId);
          console.log('Author ID type:', typeof filterAuthorId);
          this.loadMyBooks();
        }, 1000); // Increased delay to ensure backend has saved and indexed the book
        
        alert('Book created successfully! Now fill in the details.');
      },
      error: (err) => {
        console.error('Error creating book:', err);
        // Extract detailed error message
        let errorMessage = 'Failed to create book';
        if (err.error) {
          if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error.error) {
            errorMessage = err.error.error;
          }
          // If there are validation details, show them
          if (err.error.details && Array.isArray(err.error.details) && err.error.details.length > 0) {
            const details = err.error.details.map((d: any) => {
              if (typeof d === 'string') return d;
              return d.message || JSON.stringify(d);
            }).join('\n');
            errorMessage += '\n\nDetails:\n' + details;
          }
        }
        alert(errorMessage);
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
          this.loadMyBooks();
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
    if (!this.bookForm.title || !this.bookForm.price || this.bookForm.stock === undefined) {
      alert('Please fill in all required fields (Title, Price, Stock)');
      return;
    }

    // Prepare book data
    const bookData: any = {
      title: this.bookForm.title.trim(),
      description: this.bookForm.description || '',
      price: parseFloat(this.bookForm.price),
      stock: parseInt(this.bookForm.stock),
      isActive: this.bookForm.isActive
    };

    if (this.bookForm.isbn) bookData.isbn = this.bookForm.isbn.trim();
    if (this.bookForm.sku) bookData.sku = this.bookForm.sku.trim();
    if (this.bookForm.publisher) bookData.publisher = this.bookForm.publisher.trim();
    if (this.bookForm.language) bookData.language = this.bookForm.language.trim();
    if (this.bookForm.publishedAt) bookData.publishedAt = new Date(this.bookForm.publishedAt).toISOString();
    if (this.bookForm.authors && this.bookForm.authors.length > 0) bookData.authors = this.bookForm.authors;
    if (this.bookForm.categories && this.bookForm.categories.length > 0) bookData.categories = this.bookForm.categories;

    // Initialize image object if image file is selected (prevents backend error)
    if (this.selectedEditImageFile && !bookData.image) {
      bookData.image = {};
    }

    const bookId = this.editingBook._id;

    // Update existing book
    this.bookService.updateBook(bookId, bookData).subscribe({
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
          this.loadMyBooks();
        });
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update book');
        console.error('Error updating book:', err);
      }
    });
  }

  deleteBook(book: any) {
    if (!confirm(`Are you sure you want to delete "${book.title}"? This action cannot be undone.`)) {
      return;
    }

    this.bookService.deleteBook(book._id).subscribe({
      next: (response) => {
        alert('Book deleted successfully!');
        this.loadMyBooks();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete book');
        console.error('Error deleting book:', err);
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadMyBooks();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}


