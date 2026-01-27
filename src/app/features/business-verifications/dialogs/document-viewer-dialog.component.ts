import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

export interface DocumentViewerDialogData {
  url: string;
  title: string;
}

@Component({
  selector: 'app-document-viewer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule
  ],
  styles: [`
    :host {
      display: block;
    }
    /* Override Material dialog container with daisyUI theme */
    ::ng-deep .mat-mdc-dialog-container .mat-mdc-dialog-surface {
      background-color: oklch(var(--b2)) !important;
      color: oklch(var(--bc)) !important;
      border-radius: var(--rounded-box, 1rem) !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
    }
    ::ng-deep .cdk-overlay-dark-backdrop {
      background-color: rgba(0, 0, 0, 0.7) !important;
    }
  `],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-base-content">{{ data.title }}</h2>
        <button class="btn btn-ghost btn-sm btn-square" (click)="onClose()">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Document Viewer -->
      <div class="flex items-center justify-center bg-base-200 rounded-lg p-4 min-h-[60vh]">
        <img
          [src]="data.url"
          [alt]="data.title"
          class="max-w-full max-h-[70vh] object-contain rounded"
        />
      </div>

      <!-- Footer Actions -->
      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-base-300">
        <button class="btn btn-outline gap-2" (click)="downloadDocument()">
          <span class="material-symbols-outlined text-sm">download</span>
          Download
        </button>
        <button class="btn btn-ghost" (click)="onClose()">Close</button>
      </div>
    </div>
  `
})
export class DocumentViewerDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DocumentViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DocumentViewerDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  downloadDocument(): void {
    window.open(this.data.url, '_blank');
  }
}
