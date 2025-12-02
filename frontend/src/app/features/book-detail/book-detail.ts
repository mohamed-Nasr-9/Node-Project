import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BookService } from '../../core/services/book';
import { ReviewService, ReviewsResponse } from '../../core/services/review-service';
import { AuthService } from '../../core/services/auth';
import { Profileservice } from '../account/ProfileService/profileservice';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.html',
  styleUrls: ['./book-detail.css'],
  standalone: false
})
export class BookDetailComponent implements OnInit {
  book: any = null;
  loading: boolean = true;
  error: string | null = null;
  palceholderCover: string = 'https://res.cloudinary.com/dbelkcsrq/image/upload/book-store/covers/soul.jpg';

  reviews: any[] = [];
  reviewPagination: any = null;
  reviewsLoading: boolean = true;
  reviewsError: string | null = null;
  currentReviewPage: number = 1;
  reviewsLimit: number = 5;

  // Review form
  reviewForm: FormGroup;
  showReviewForm: boolean = false;
  isSubmittingReview: boolean = false;
  hasPurchasedBook: boolean = false;
  isCheckingPurchase: boolean = false;
  userHasReviewed: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private profileService: Profileservice,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      review: ['']
    });
  }

  ngOnInit() {
    const bookId = this.route.snapshot.paramMap.get('id');
    console.log('Book Detail - Book ID from route:', bookId);
    if (bookId) {
      this.loadBook(bookId);
      // Check if user can review (logged in and purchased)
      if (this.authService.isAuthenticated()) {
        this.checkIfUserCanReview(bookId);
      }
    } else {
      this.error = 'Book ID not provided';
      this.loading = false;
      this.reviewsLoading = false;
    }
  }

  loadBook(id: string) {
    this.loading = true;
    this.error = null;
    console.log('Loading book with ID:', id);

    this.bookService.getBookById(id).subscribe({
      next: (book) => {
        console.log('Book loaded successfully:', book);
        this.book = book;
        this.loading = false;
        this.loadReviews(book._id, this.currentReviewPage);
      },
      error: (error) => {
        console.error('Error loading book:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        this.error = error.error?.message || error.message || 'Failed to load book. Please try again.';
        this.loading = false;
        this.reviewsLoading = false;
      }
    });
  }

  loadReviews(bookId: string, page: number) {
    this.reviewsLoading = true;
    this.reviewsError = null;
    this.currentReviewPage = page;

    this.reviewService.getBookReviews(bookId, page, this.reviewsLimit).subscribe({
      next: (response: ReviewsResponse) => {
        this.reviews = response.data;
        this.reviewPagination = response.pagination;
        this.reviewsLoading = false;
        console.log('Reviews loaded:', response);
        
        // Check if user has reviewed after loading reviews
        if (this.authService.isAuthenticated()) {
          this.checkIfUserReviewed();
        }
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.reviewsError = 'Failed to load reviews. Please try again.';
        this.reviewsLoading = false;
      },
    });
  }

  // Check if current user has already reviewed this book
  checkIfUserReviewed(): void {
    if (!this.authService.isAuthenticated() || !this.reviews || this.reviews.length === 0) {
      this.userHasReviewed = false;
      return;
    }

    // Get user ID from token
    const token = this.authService.getToken();
    if (!token) {
      this.userHasReviewed = false;
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentUserId = payload.id || payload.userId || payload._id;

      if (currentUserId) {
        this.userHasReviewed = this.reviews.some((review: any) => {
          const reviewUserId = typeof review.userId === 'string' 
            ? review.userId 
            : (review.userId?._id || review.userId?.id);
          return reviewUserId === currentUserId;
        });
      }
    } catch (e) {
      console.error('Error decoding token:', e);
      this.userHasReviewed = false;
    }
  }

  onReviewPageChange(page: number) {
    if (
      page < 1 ||
      (this.reviewPagination && page > this.reviewPagination.totalPages)
    ) {
      return;
    }
    this.loadReviews(this.book._id, page);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  addToCart() {
    if (this.book) {
      this.bookService.addToCart(this.book);
    }
  }

  getStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
  }

  // Check if user has purchased the book and can review
  checkIfUserCanReview(bookId: string): void {
    if (!this.authService.isAuthenticated()) {
      this.hasPurchasedBook = false;
      return;
    }

    this.isCheckingPurchase = true;
    this.profileService.getUserOrders().subscribe({
      next: (response) => {
        const orders = response.data?.orders || response.orders || [];
        let purchased = false;

        // Check if user has purchased this book (in a paid order)
        orders.forEach((order: any) => {
          const isPaid = order.payment?.status?.toLowerCase() === 'paid' || 
                        order.status?.toLowerCase() === 'paid';
          
          if (isPaid && order.items && order.items.length > 0) {
            order.items.forEach((item: any) => {
              const itemBookId = typeof item.bookId === 'string' 
                ? item.bookId 
                : (item.bookId?._id || item.bookId?.id || item.book?._id || item.book?.id);
              
              if (itemBookId === bookId) {
                purchased = true;
              }
            });
          }
        });

        this.hasPurchasedBook = purchased;
        this.isCheckingPurchase = false;
        
        // Check if user has already reviewed this book (after reviews are loaded)
        if (this.reviews && this.reviews.length > 0) {
          this.checkIfUserReviewed();
        }
      },
      error: (error) => {
        console.error('Error checking purchase status:', error);
        this.hasPurchasedBook = false;
        this.isCheckingPurchase = false;
      }
    });
  }

  // Show review form
  showReviewFormDialog(): void {
    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('Please login to write a review', 'Login', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }).onAction().subscribe(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    if (!this.hasPurchasedBook) {
      this.snackBar.open('You must purchase this book before you can review it', 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    if (this.userHasReviewed) {
      this.snackBar.open('You have already reviewed this book', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    this.showReviewForm = true;
  }

  // Cancel review form
  cancelReviewForm(): void {
    this.showReviewForm = false;
    this.reviewForm.reset({ rating: 5, review: '' });
  }

  // Submit review
  submitReview(): void {
    if (!this.reviewForm.valid || !this.book) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    if (!this.hasPurchasedBook) {
      this.snackBar.open('You must purchase this book before you can review it', 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    this.isSubmittingReview = true;
    const reviewData = {
      bookId: this.book._id || this.book.id,
      rating: this.reviewForm.value.rating,
      review: this.reviewForm.value.review?.trim() || ''
    };

    this.reviewService.createReview(reviewData).subscribe({
      next: (response) => {
        this.snackBar.open('Review submitted successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.showReviewForm = false;
        this.reviewForm.reset({ rating: 5, review: '' });
        this.isSubmittingReview = false;
        this.userHasReviewed = true;
        
        // Reload reviews and book to update rating
        this.loadReviews(this.book._id || this.book.id, 1);
        this.loadBook(this.book._id || this.book.id);
      },
      error: (error) => {
        console.error('Error submitting review:', error);
        const errorMsg = error.error?.error || error.error?.message || error.message || 'Failed to submit review';
        this.snackBar.open(errorMsg, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.isSubmittingReview = false;
      }
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}

