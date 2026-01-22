import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DocumentViewerDialogData {
  url: string;
  title: string;
}

@Component({
  selector: 'app-document-viewer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="flex items-center justify-center p-0">
      <img
        [src]="data.url"
        [alt]="data.title"
        class="max-w-full max-h-[70vh] object-contain"
      />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="downloadDocument()">
        <span class="material-symbols-outlined mr-2">download</span>
        Download
      </button>
      <button mat-button (click)="onClose()">Close</button>
    </mat-dialog-actions>
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
