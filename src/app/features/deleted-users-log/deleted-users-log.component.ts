import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../core/services/users.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  DeletedUserLogEntry,
  DeletedUsersLogStats,
} from '../../core/models/deleted-user-log.model';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-deleted-users-log',
  standalone: true,
  imports: [CommonModule, FormsModule, RelativeTimePipe],
  templateUrl: './deleted-users-log.component.html'
})
export class DeletedUsersLogComponent implements OnInit {
  entries = signal<DeletedUserLogEntry[]>([]);
  stats = signal<DeletedUsersLogStats | null>(null);
  isLoading = signal(true);
  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = 25;

  deletedByFilter = 'all';
  searchQuery = '';

  constructor(
    private usersService: UsersService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.isLoading.set(true);
      const result = await this.usersService.getDeletedUsersLog({
        page: this.currentPage(),
        pageSize: this.pageSize,
        search: this.searchQuery.trim() || undefined,
        deleted_by: this.deletedByFilter as 'all' | 'auto' | 'admin',
      });
      this.entries.set(result.entries);
      this.stats.set(result.stats);
      this.totalRecords.set(result.total);
    } catch (error: any) {
      this.notificationService.error('Error', error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadData();
  }

  nextPage() {
    if (this.currentPage() < this.getTotalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadData();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadData();
    }
  }

  getTotalPages(): number {
    return Math.max(1, Math.ceil(this.totalRecords() / this.pageSize));
  }

  getPageRange(): string {
    const from = (this.currentPage() - 1) * this.pageSize + 1;
    const to = Math.min(this.currentPage() * this.pageSize, this.totalRecords());
    return `${from}-${to} of ${this.totalRecords()}`;
  }
}
