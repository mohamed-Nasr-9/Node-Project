import { Component, OnInit } from '@angular/core';
import { AuthorService } from '../../core/services/author';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-become-author',
  standalone: false,
  templateUrl: './become-author.html',
  styleUrls: ['./become-author.css'],
})
export class BecomeAuthorComponent implements OnInit {
  formData = {
    name: '',
    bio: ''
  };

  loading = false;
  error: string | null = null;
  success = false;
  existingApplication: any = null;

  constructor(
    private authorService: AuthorService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    // Check if user already has an application
    if (this.authService.isAuthenticated()) {
      this.checkExistingApplication();
    }
  }

  checkExistingApplication() {
    this.authorService.getMyAuthorProfile().subscribe({
      next: (author) => {
        this.existingApplication = author;
      },
      error: (err) => {
        // No existing application, which is fine
        if (err.error?.message !== 'No author record found') {
          console.error('Error checking application:', err);
        }
      }
    });
  }

  onSubmit() {
    if (!this.authService.isAuthenticated()) {
      this.error = 'Please log in to apply as an author';
      return;
    }

    if (!this.formData.name || this.formData.name.trim().length < 2) {
      this.error = 'Name must be at least 2 characters';
      return;
    }

    if (this.formData.name.length > 80) {
      this.error = 'Name must be less than 80 characters';
      return;
    }

    if (this.formData.bio && this.formData.bio.length > 2000) {
      this.error = 'Bio must be less than 2000 characters';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = false;

    this.authorService.applyAsAuthor(
      this.formData.name.trim(),
      this.formData.bio.trim()
    ).subscribe({
      next: (response) => {
        this.success = true;
        this.loading = false;
        this.existingApplication = response.author;
        this.formData = { name: '', bio: '' };
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to submit application';
        this.loading = false;
        if (err.error?.author) {
          this.existingApplication = err.error.author;
        }
      }
    });
  }
}

