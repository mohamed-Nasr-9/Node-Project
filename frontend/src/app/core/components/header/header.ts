import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth';
import { AuthorService } from '../../services/author';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  isAuthor: boolean = false;
  isLoadingAuthor: boolean = false;
  isAuthenticated: boolean = false;
  isAdmin: boolean = false;
  private socket: WebSocket | null = null;

  constructor(
    public cartService: CartService,
    private authService: AuthService,
    private authorService: AuthorService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Check authentication status (check both possible token keys)
    this.updateAuthStatus();
    this.checkAdminStatus();

    // Load cart on component initialization
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    if (token) {
      this.cartService.getCart().subscribe({
        error: (err) => {
          // Silently fail if user not authenticated or cart doesn't exist
          console.log('Could not load cart:', err.status);
        }
      });
    }

    // Check if user is authenticated and has author profile
    if (this.isAuthenticated) {
      this.checkAuthorStatus();
    }

    // Listen to authentication changes from AuthService
    this.authService.currentUser$.subscribe(() => {
      this.updateAuthStatus();
      this.checkAdminStatus();
      if (this.isAuthenticated) {
        this.checkAuthorStatus();
      } else {
        this.isAuthor = false;
        this.isAdmin = false;
      }
    });

    // Listen to storage events to detect login/logout from other tabs or same tab
    window.addEventListener('storage', (event) => {
      if (event.key === 'authToken' || event.key === 'auth_token' || event.key === 'user') {
        this.updateAuthStatus();
        this.checkAdminStatus();
        if (this.isAuthenticated) {
          this.checkAuthorStatus();
        } else {
          this.isAuthor = false;
          this.isAdmin = false;
        }
      }
    });

    // Initialize WebSocket connection for real-time notifications
    this.initWebSocket();
  }

  ngOnDestroy(): void {
    // Close WebSocket connection when component is destroyed
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  initWebSocket(): void {
    try {
      // 1. Determine protocol: if the site is https, use wss (secure), otherwise ws
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      // 2. Get the host (e.g., "18.184.165.152" or "example.com")
      const host = window.location.host;

      // 3. Initialize
      this.socket = new WebSocket(`${protocol}//${host}/ws`);

      this.socket.onopen = (event) => {
        console.log('WebSocket connection established.');
      };

      this.socket.onmessage = (event) => {
        console.log('Message received from server:', event.data);
        try {
          const data = JSON.parse(event.data);

          // Handle NEW_BOOK notifications
          if (data.type === 'NEW_BOOK') {
            const book = data.payload;
            this.showNewBookNotification(book);
          }

          // Handle WELCOME messages (optional)
          if (data.type === 'WELCOME') {
            console.log('Welcome message:', data.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket connection closed.');
        // Optionally attempt to reconnect after a delay
        setTimeout(() => {
          if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
            this.initWebSocket();
          }
        }, 5000);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  showNewBookNotification(book: any): void {
    const bookTitle = book.title || 'New Book';
    const authorName = book.author?.name || book.author || book.authors?.[0]?.name || 'Unknown Author';
    const bookId = book._id || book.id;

    const message = `New Book Published: "${bookTitle}" by ${authorName}`;

    const snackBarRef = this.snackBar.open(message, 'View', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['new-book-notification']
    });

    // Navigate to book detail page when "View" is clicked
    snackBarRef.onAction().subscribe(() => {
      if (bookId) {
        this.router.navigate(['/book', bookId]);
      }
    });
  }

  updateAuthStatus(): void {
    // Check authentication - login component uses 'authToken', AuthService uses 'auth_token'
    const authToken = localStorage.getItem('authToken');
    const auth_token = localStorage.getItem('auth_token');
    this.isAuthenticated = !!(authToken || auth_token);
  }

  checkAuthorStatus() {
    this.isLoadingAuthor = true;
    this.authorService.getMyAuthorProfile().subscribe({
      next: (author) => {
        // Check if author exists and is approved
        this.isAuthor = author && author.status === 'approved';
        this.isLoadingAuthor = false;
      },
      error: (err) => {
        // User is not an author or not authenticated
        this.isAuthor = false;
        this.isLoadingAuthor = false;
      }
    });
  }

  checkAdminStatus() {
    // Check if user is admin from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.isAdmin = user?.role?.toLowerCase() === 'admin';
      } catch (e) {
        this.isAdmin = false;
      }
    } else {
      // Also check from token payload
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.isAdmin = payload?.role?.toLowerCase() === 'admin';
        } catch (e) {
          this.isAdmin = false;
        }
      } else {
        this.isAdmin = false;
      }
    }
  }

  scrollToShop() {
    // Check if we're already on the homepage
    if (this.router.url === '/' || this.router.url === '') {
      // If on homepage, scroll to the section
      setTimeout(() => {
        const element = document.getElementById('all-books');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // If not on homepage, navigate to homepage and then scroll
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          const element = document.getElementById('all-books');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      });
    }
  }
}
