import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CmsService, ContentPage } from '../../../core/services/cms.service';

@Component({
  selector: 'app-content-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './content-list.component.html',
  styleUrls: ['./content-list.component.scss']
})
export class ContentListComponent implements OnInit {
  contents: ContentPage[] = [];
  filteredContents: ContentPage[] = [];
  loading = false;
  error: string | null = null;

  // Filters
  searchTerm = '';
  selectedCategory: string | null = null;
  selectedStatus: string | null = null;

  categories = ['legal', 'updates', 'help', 'announcements', 'about'];
  statuses = ['draft', 'published', 'archived'];

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalItems = 0;
  hasMore = false;

  constructor(
    private cmsService: CmsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadContents();
  }

  loadContents(): void {
    this.loading = true;
    this.error = null;

    const params: any = {
      limit: this.pageSize,
      offset: this.currentPage * this.pageSize
    };

    if (this.selectedCategory) {
      params.category = this.selectedCategory;
    }

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    this.cmsService.getContentList(params).subscribe({
      next: (response) => {
        this.contents = response.data;
        this.filteredContents = this.filterByStatus(response.data);
        this.totalItems = response.pagination.total;
        this.hasMore = response.pagination.hasMore;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  filterByStatus(contents: ContentPage[]): ContentPage[] {
    if (!this.selectedStatus) {
      return contents;
    }
    return contents.filter(c => c.status === this.selectedStatus);
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadContents();
  }

  onCategoryChange(): void {
    this.currentPage = 0;
    this.loadContents();
  }

  onStatusChange(): void {
    this.filteredContents = this.filterByStatus(this.contents);
  }

  nextPage(): void {
    if (this.hasMore) {
      this.currentPage++;
      this.loadContents();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadContents();
    }
  }

  createNew(): void {
    this.router.navigate(['/content/new']);
  }

  editContent(content: ContentPage): void {
    this.router.navigate(['/content/edit', content.id]);
  }

  publishContent(content: ContentPage): void {
    if (confirm(`Are you sure you want to publish "${content.title}"?`)) {
      this.cmsService.publishContent(content.id, 'publish').subscribe({
        next: () => {
          alert('Content published successfully!');
          this.loadContents();
        },
        error: (err) => {
          alert(`Failed to publish: ${err.message}`);
        }
      });
    }
  }

  unpublishContent(content: ContentPage): void {
    if (confirm(`Are you sure you want to unpublish "${content.title}"?`)) {
      this.cmsService.publishContent(content.id, 'unpublish').subscribe({
        next: () => {
          alert('Content unpublished successfully!');
          this.loadContents();
        },
        error: (err) => {
          alert(`Failed to unpublish: ${err.message}`);
        }
      });
    }
  }

  archiveContent(content: ContentPage): void {
    if (confirm(`Are you sure you want to archive "${content.title}"? This will hide it from the public.`)) {
      this.cmsService.publishContent(content.id, 'archive').subscribe({
        next: () => {
          alert('Content archived successfully!');
          this.loadContents();
        },
        error: (err) => {
          alert(`Failed to archive: ${err.message}`);
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'published': return 'badge-success';
      case 'draft': return 'badge-warning';
      case 'archived': return 'badge-secondary';
      default: return 'badge-default';
    }
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'legal': return 'badge-danger';
      case 'updates': return 'badge-info';
      case 'help': return 'badge-primary';
      case 'announcements': return 'badge-warning';
      case 'about': return 'badge-secondary';
      default: return 'badge-default';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
