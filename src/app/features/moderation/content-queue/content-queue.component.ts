import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModerationService } from '../../../core/services/moderation.service';
import { FlaggedContent, ModerationAction } from '../../../core/models/content.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { ContentPreviewDialogComponent } from './dialogs/content-preview-dialog.component';

@Component({
  selector: 'app-content-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    AvatarComponent,
    RelativeTimePipe
  ],
  templateUrl: './content-queue.component.html',
  styleUrl: './content-queue.component.scss'
})
export class ContentQueueComponent implements OnInit {
  flaggedContent = signal<FlaggedContent[]>([]);
  isLoading = signal(true);
  totalRecords = signal(0);

  // Filters
  contentTypeFilter = signal<'all' | 'post' | 'comment'>('all');
  contentTypeOptions = [
    { label: 'All Content', value: 'all' },
    { label: 'Posts', value: 'post' },
    { label: 'Comments', value: 'comment' }
  ];

  // Pagination
  currentPage = signal(0);
  pageSize = 25;
  pageSizeOptions = [10, 25, 50, 100];

  constructor(
    private moderationService: ModerationService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadFlaggedContent();
  }

  async loadFlaggedContent() {
    try {
      this.isLoading.set(true);
      const response = await this.moderationService.getFlaggedContent({
        page: this.currentPage() + 1, // API uses 1-based pages
        pageSize: this.pageSize,
        contentType: this.contentTypeFilter()
      });

      this.flaggedContent.set(response.content);
      this.totalRecords.set(response.total);
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to load flagged content');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Pagination methods
  getTotalPages(): number {
    return Math.ceil(this.totalRecords() / this.pageSize);
  }

  getPageRangeLabel(): string {
    const start = this.currentPage() * this.pageSize + 1;
    const end = Math.min((this.currentPage() + 1) * this.pageSize, this.totalRecords());
    return `${start} - ${end} of ${this.totalRecords()}`;
  }

  firstPage(): void {
    this.currentPage.set(0);
    this.loadFlaggedContent();
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadFlaggedContent();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.getTotalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadFlaggedContent();
    }
  }

  lastPage(): void {
    this.currentPage.set(this.getTotalPages() - 1);
    this.loadFlaggedContent();
  }

  onPageSizeChange(): void {
    this.currentPage.set(0);
    this.loadFlaggedContent();
  }

  onContentTypeFilterChange() {
    this.currentPage.set(0);
    this.loadFlaggedContent();
  }

  viewContent(content: FlaggedContent) {
    const dialogRef = this.dialog.open(ContentPreviewDialogComponent, {
      width: '700px',
      data: { content }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFlaggedContent();
      }
    });
  }

  async confirmApprove(content: FlaggedContent) {
    const confirmed = await this.confirmService.confirm({
      title: 'Approve Content',
      message: 'Are you sure you want to approve this content? This will clear the flag.',
      confirmText: 'Approve',
      confirmColor: 'primary'
    });

    if (confirmed) {
      await this.moderateContent(content, 'approve');
    }
  }

  async confirmRemove(content: FlaggedContent) {
    const confirmed = await this.confirmService.confirm({
      title: 'Remove Content',
      message: 'Are you sure you want to remove this content? This action cannot be undone.',
      confirmText: 'Remove',
      confirmColor: 'warn'
    });

    if (confirmed) {
      await this.moderateContent(content, 'remove');
    }
  }

  async moderateContent(content: FlaggedContent, action: ModerationAction) {
    try {
      await this.moderationService.moderateContent({
        content_id: content.content_id,
        content_type: content.content_type,
        action
      });

      this.notificationService.success(
        'Success',
        `Content ${action === 'approve' ? 'approved' : 'removed'} successfully`
      );

      this.loadFlaggedContent();
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to moderate content');
    }
  }

  getContentTypeSeverity(type: string): 'info' | 'warning' {
    return type === 'post' ? 'info' : 'warning';
  }
}
