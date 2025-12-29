import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModerationService } from '../../../core/services/moderation.service';
import { FlaggedContent, ModerationAction } from '../../../core/models/content.model';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-content-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    RelativeTimePipe
  ],
  providers: [MessageService, ConfirmationService],
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
  currentPage = signal(1);
  pageSize = 25;

  // Preview Dialog
  showPreviewDialog = signal(false);
  selectedContent = signal<FlaggedContent | null>(null);
  isProcessing = signal(false);

  constructor(
    private moderationService: ModerationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadFlaggedContent();
  }

  async loadFlaggedContent() {
    try {
      this.isLoading.set(true);
      const response = await this.moderationService.getFlaggedContent({
        page: this.currentPage(),
        pageSize: this.pageSize,
        contentType: this.contentTypeFilter()
      });

      this.flaggedContent.set(response.content);
      this.totalRecords.set(response.total);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load flagged content'
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: any) {
    this.currentPage.set(event.page + 1);
    this.loadFlaggedContent();
  }

  onContentTypeFilterChange() {
    this.currentPage.set(1);
    this.loadFlaggedContent();
  }

  viewContent(content: FlaggedContent) {
    this.selectedContent.set(content);
    this.showPreviewDialog.set(true);
  }

  confirmApprove(content: FlaggedContent) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to approve this content? This will clear the flag.',
      header: 'Approve Content',
      icon: 'pi pi-check-circle',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.moderateContent(content, 'approve');
      }
    });
  }

  confirmRemove(content: FlaggedContent) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to remove this content? This action cannot be undone.',
      header: 'Remove Content',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.moderateContent(content, 'remove');
      }
    });
  }

  async moderateContent(content: FlaggedContent, action: ModerationAction) {
    try {
      this.isProcessing.set(true);
      await this.moderationService.moderateContent({
        content_id: content.content_id,
        content_type: content.content_type,
        action
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Content ${action === 'approve' ? 'approved' : 'removed'} successfully`
      });

      this.showPreviewDialog.set(false);
      this.loadFlaggedContent();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to moderate content'
      });
    } finally {
      this.isProcessing.set(false);
    }
  }

  getContentTypeColor(type: string): 'info' | 'warn' {
    return type === 'post' ? 'info' : 'warn';
  }
}
