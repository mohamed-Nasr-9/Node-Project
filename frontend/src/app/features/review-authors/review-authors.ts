import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthorService, AuthorFilters } from '../../core/services/author';
import { AuthService } from '../../core/services/auth';
import { CoreModule } from '../../core/core-module';

@Component({
  selector: 'app-review-authors',
  standalone: true,
  templateUrl: './review-authors.html',
  styleUrls: ['./review-authors.css'],
  imports: [CommonModule, FormsModule, CoreModule, MatSnackBarModule]
})
export class ReviewAuthorsComponent implements OnInit {
  authors: any[] = [];
  loading = true;
  error: string | null = null;

  // Filters
  filters: AuthorFilters = {
    status: undefined,
    q: '',
    page: 1,
    limit: 20,
    sort: 'appliedAt'
  };

  // Pagination
  totalAuthors = 0;
  totalPages = 0;
  currentPage = 1;

  // Action modals
  showApproveModal = false;
  showRejectModal = false;
  showRevokeModal = false;
  selectedAuthor: any = null;
  
  // Form data
  approveData = { name: '', bio: '' };
  rejectReason = '';
  revokeReason = '';

  // Check if we're in dashboard (to hide header/footer)
  showHeaderFooter = true;

  constructor(
    private authorService: AuthorService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Check if we're in the dashboard route
    this.showHeaderFooter = !this.router.url.includes('/dashboard/review-authors');
    this.loadAuthors();
  }

  loadAuthors() {
    this.loading = true;
    this.error = null;

    const filters: AuthorFilters = {
      page: this.currentPage,
      limit: this.filters.limit || 20,
      sort: this.filters.sort || 'appliedAt'
    };

    if (this.filters.status) {
      filters.status = this.filters.status;
    }

    if (this.filters.q && this.filters.q.trim()) {
      filters.q = this.filters.q.trim();
    }

    this.authorService.listAuthors(filters).subscribe({
      next: (response) => {
        this.authors = response.items || [];
        this.totalAuthors = response.meta?.total || 0;
        this.totalPages = response.meta?.pages || 0;
        this.currentPage = response.meta?.page || 1;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load authors';
        this.loading = false;
        console.error('Error loading authors:', err);
      }
    });
  }

  onStatusFilterChange(status: string) {
    if (status === 'all') {
      this.filters.status = undefined;
    } else {
      this.filters.status = status as any;
    }
    this.currentPage = 1;
    this.loadAuthors();
  }

  onSearch() {
    this.currentPage = 1;
    this.loadAuthors();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadAuthors();
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

  openApproveModal(author: any) {
    this.selectedAuthor = author;
    this.approveData = {
      name: author.name || '',
      bio: author.bio || ''
    };
    this.showApproveModal = true;
  }

  openRejectModal(author: any) {
    this.selectedAuthor = author;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  openRevokeModal(author: any) {
    this.selectedAuthor = author;
    this.revokeReason = '';
    this.showRevokeModal = true;
  }

  closeModals() {
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.showRevokeModal = false;
    this.selectedAuthor = null;
    this.approveData = { name: '', bio: '' };
    this.rejectReason = '';
    this.revokeReason = '';
  }

  approveAuthor() {
    if (!this.selectedAuthor) return;

    this.authorService.approveAuthor(
      this.selectedAuthor._id || this.selectedAuthor.id,
      this.approveData.name || this.approveData.bio ? this.approveData : undefined
    ).subscribe({
      next: (response) => {
        this.snackBar.open('Author approved successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.closeModals();
        this.loadAuthors();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to approve author', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error approving author:', err);
      }
    });
  }

  rejectAuthor() {
    if (!this.selectedAuthor) return;

    this.authorService.rejectAuthor(
      this.selectedAuthor._id || this.selectedAuthor.id,
      this.rejectReason
    ).subscribe({
      next: (response) => {
        this.snackBar.open('Author rejected successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.closeModals();
        this.loadAuthors();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to reject author', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error rejecting author:', err);
      }
    });
  }

  revokeAuthor() {
    if (!this.selectedAuthor) return;

    if (this.selectedAuthor.status !== 'approved') {
      this.snackBar.open('Only approved authors can be revoked', 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.authorService.revokeAuthor(
      this.selectedAuthor._id || this.selectedAuthor.id,
      this.revokeReason || 'Revoked by admin'
    ).subscribe({
      next: (response) => {
        this.snackBar.open('Author privileges revoked successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.closeModals();
        this.loadAuthors();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to revoke author', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error revoking author:', err);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-warning';
      case 'approved':
        return 'bg-success';
      case 'rejected':
      case 'revoked':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}

