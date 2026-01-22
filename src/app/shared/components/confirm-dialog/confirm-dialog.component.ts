import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      @if (data.icon) {
        <span class="material-symbols-outlined">{{ data.icon }}</span>
      }
      {{ data.title }}
    </h2>

    <mat-dialog-content>
      <p class="text-gray-600">{{ data.message }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{ data.cancelText || 'Cancel' }}
      </button>
      <button
        mat-raised-button
        [color]="data.confirmColor || 'primary'"
        (click)="onConfirm()"
      >
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    mat-dialog-content {
      min-width: 300px;
    }

    mat-dialog-actions {
      padding: 1rem 0 0 0;
    }

    .material-symbols-outlined {
      font-size: 24px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
