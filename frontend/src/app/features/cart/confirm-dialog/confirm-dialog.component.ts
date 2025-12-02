import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: false,
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="false" class="cancel-btn">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-raised-button color="warn" [mat-dialog-close]="true" class="confirm-btn">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 0;
    }
    
    h2[mat-dialog-title] {
      margin: 0;
      padding: 24px 24px 16px;
      font-size: 1.5rem;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 1px solid #e9ecef;
    }
    
    mat-dialog-content {
      padding: 24px;
      margin: 0;
      min-height: 60px;
    }
    
    mat-dialog-content p {
      margin: 0;
      font-size: 1rem;
      color: #6c757d;
      line-height: 1.6;
    }
    
    mat-dialog-actions {
      padding: 16px 24px 24px;
      margin: 0;
      border-top: 1px solid #e9ecef;
    }
    
    .cancel-btn {
      margin-right: 8px;
      color: #6c757d;
    }
    
    .cancel-btn:hover {
      background-color: #f8f9fa;
    }
    
    .confirm-btn {
      min-width: 100px;
      background-color: #dc3545;
      color: white;
    }
    
    .confirm-btn:hover {
      background-color: #c82333;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}

