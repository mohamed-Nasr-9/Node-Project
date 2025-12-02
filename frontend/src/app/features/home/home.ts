import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../core/services/category';
import { BookService, BookFilters } from '../../core/services/book';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: false
})
export class HomeComponent implements OnInit {

  categories: any[] = [];
  books: any[] = [];
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 12;
  totalBooks: number = 0;
  totalPages: number = 0;
  palceholderCover: string = 'https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/covers/soul.jpg';
  
  // Filters
  filters: BookFilters = {
    page: 1,
    limit: 12,
    sort: 'createdAt',
    isActive: true
  };
  
  // Filter UI state
  searchQuery: string = '';
  selectedCategory: string = '';
  selectedAuthor: string = '';
  minPrice: number | string | null = null;
  maxPrice: number | string | null = null;
  sortBy: string = 'createdAt';

  // Customer reviews
  customerReviews: any[] = [
    {
      text: "I stumbled upon this bookstore while visiting the city, and it instantly became my favorite spot. The cozy atmosphere, friendly staff, and wide selection of books make every visit a delight!",
      author: "Emma Chamberlin"
    },
    {
      text: "As an avid reader, I'm always on the lookout for new releases, and this bookstore never disappoints. They always have the latest titles, and their recommendations have introduced me to some incredible reads!",
      author: "Thomas John"
    },
    {
      text: "I ordered a few books online from this store, and I was impressed by the quick delivery and careful packaging. It's clear that they prioritize customer satisfaction, and I'll definitely be shopping here again!",
      author: "Kevin Bryan"
    },
    {
      text: "I stumbled upon this tech store while searching for a new laptop, and I couldn't be happier with my experience! The staff was incredibly knowledgeable and guided me through the process of choosing the perfect device for my needs. Highly recommended!",
      author: "Stevin"
    }
  ];

  constructor(
    private categoryService: CategoryService,
    private bookService: BookService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadBooks();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe((data) => {
      this.categories = data;
    });
  }

  loadBooks() {
    // Build filters object
    const filters: BookFilters = {
      page: this.currentPage,
      limit: this.pageSize,
      sort: this.sortBy
      // Temporarily removed isActive to see all books
    };

    if (this.searchQuery) filters.q = this.searchQuery;
    if (this.selectedCategory) filters.category = this.selectedCategory;
    if (this.selectedAuthor) filters.author = this.selectedAuthor;
    
    // Convert price values to numbers and handle empty strings
    // Handle minPrice
    if (this.minPrice !== null && this.minPrice !== undefined) {
      const minPriceStr = String(this.minPrice).trim();
      if (minPriceStr !== '') {
        const minPriceNum = parseFloat(minPriceStr);
        if (!isNaN(minPriceNum) && minPriceNum >= 0) {
          filters.minPrice = minPriceNum;
          console.log('Setting minPrice filter:', minPriceNum);
        }
      }
    }
    
    // Handle maxPrice
    if (this.maxPrice !== null && this.maxPrice !== undefined) {
      const maxPriceStr = String(this.maxPrice).trim();
      if (maxPriceStr !== '') {
        const maxPriceNum = parseFloat(maxPriceStr);
        if (!isNaN(maxPriceNum) && maxPriceNum > 0) {
          filters.maxPrice = maxPriceNum;
          console.log('Setting maxPrice filter:', maxPriceNum);
        }
      }
    }

    console.log('Filters being sent to API:', filters);
    this.bookService.getAllBooks(filters).subscribe({
      next: (response: any) => {
        // API returns: { meta: { total, page, limit, pages }, items: [...] }
        if (response && response.items && Array.isArray(response.items)) {
          this.books = response.items;
          this.totalBooks = response.meta?.total || response.items.length;
          this.totalPages = response.meta?.pages || Math.ceil((response.meta?.total || response.items.length) / this.pageSize);
          this.currentPage = response.meta?.page || 1;
        } else if (response && response.books && Array.isArray(response.books)) {
          // Fallback: response has 'books' property
          this.books = response.books;
          this.totalBooks = response.total || 0;
          this.totalPages = response.totalPages || 0;
          this.currentPage = response.page || 1;
        } else if (response && response.data && Array.isArray(response.data)) {
          // Fallback: response has 'data' property
          this.books = response.data;
          this.totalBooks = response.total || response.data.length;
          this.totalPages = response.totalPages || Math.ceil((response.total || response.data.length) / this.pageSize);
          this.currentPage = response.page || 1;
        } else if (Array.isArray(response)) {
          // Fallback: response is directly an array
          this.books = response;
          this.totalBooks = response.length;
          this.totalPages = Math.ceil(response.length / this.pageSize);
        } else {
          console.error('Unexpected response structure:', response);
          this.books = [];
          this.totalBooks = 0;
          this.totalPages = 0;
        }
      },
      error: (error) => {
        console.error('Error loading books:', error);
        this.books = [];
        this.totalBooks = 0;
        this.totalPages = 0;
      }
    });
  }

  onSearch() {
    console.log('Search clicked - minPrice:', this.minPrice, 'maxPrice:', this.maxPrice, 'type min:', typeof this.minPrice, 'type max:', typeof this.maxPrice);
    this.currentPage = 1;
    this.loadBooks();
  }

  onCategoryChange() {
    this.currentPage = 1;
    this.loadBooks();
  }

  selectCategory(category: any) {
    const categoryId = category._id || category.id;
    const categoryName = category.name;
    
    // Use category ID (backend now accepts both ID and name)
    if (this.selectedCategory === categoryId) {
      // If clicking the same category, clear the filter
      this.selectedCategory = '';
    } else {
      // Set the selected category ID
      this.selectedCategory = categoryId;
    }
    this.currentPage = 1;
    this.loadBooks();
    // Scroll to books section
    setTimeout(() => {
      const booksSection = document.querySelector('.books-section');
      if (booksSection) {
        booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  onAuthorChange() {
    this.currentPage = 1;
    this.loadBooks();
  }

  onPriceFilterChange() {
    console.log('Price filter changed - minPrice:', this.minPrice, 'maxPrice:', this.maxPrice);
    this.currentPage = 1;
    this.loadBooks();
  }

  onSortChange() {
    this.currentPage = 1;
    this.loadBooks();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadBooks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedAuthor = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'createdAt';
    this.currentPage = 1;
    this.loadBooks();
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, current page, and ellipsis
      pages.push(1);
      
      if (current > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < total - 2) {
        pages.push('...');
      }
      
      pages.push(total);
    }

    return pages;
  }

  navigateToBook(bookId: string) {
    this.router.navigate(['/book', bookId]);
  }

  addToCart(book: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.bookService.addToCart(book);
  }
}
