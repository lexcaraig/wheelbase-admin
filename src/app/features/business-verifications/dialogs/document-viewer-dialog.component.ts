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
