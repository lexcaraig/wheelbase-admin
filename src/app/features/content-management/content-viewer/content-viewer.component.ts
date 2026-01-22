import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CmsService, ContentPage } from '../../../core/services/cms.service';
import * as marked from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-content-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-viewer.component.html',
  styleUrls: ['./content-viewer.component.scss']
})
export class ContentViewerComponent implements OnInit {
  contentId: string | null = null;
  loading = false;
  error: string | null = null;
  content: ContentPage | null = null;
  renderedContent: SafeHtml = '';

  constructor(
    private cmsService: CmsService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    // Configure marked options for better markdown rendering
    marked.marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true // Convert \n to <br>
    });
  }

  ngOnInit(): void {
    this.contentId = this.route.snapshot.paramMap.get('id');

    if (this.contentId) {
      this.loadContent();
    }
  }

  loadContent(): void {
    if (!this.contentId) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.cmsService.getContentById(this.contentId).subscribe({
      next: (content) => {
        this.content = content;
        this.renderMarkdown(content.content);
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load content: ${err.message}`;
        this.loading = false;
      }
    });
  }

  renderMarkdown(markdown: string): void {
    try {
      if (!markdown || markdown.trim() === '') {
        this.renderedContent = this.sanitizer.bypassSecurityTrustHtml('<p><em>No content available</em></p>');
        return;
      }

      const html = marked.marked(markdown) as string;

      // Bypass security for trusted CMS content
      this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(html);
    } catch (err) {
      this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(
        `<div style="color: red; padding: 20px; border: 1px solid red; border-radius: 8px;">
          <h3>Failed to render content</h3>
          <p>Error: ${err instanceof Error ? err.message : 'Unknown error'}</p>
        </div>`
      );
    }
  }

  goBack(): void {
    this.router.navigate(['/content']);
  }

  editContent(): void {
    if (this.content) {
      this.router.navigate(['/content/edit', this.content.id]);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'published': return 'badge-success';
      case 'draft': return 'badge-warning';
      case 'archived': return 'badge-secondary';
      default: return 'badge-default';
    }
  }

  get isTimelineFormat(): boolean {
    return this.content?.metadata?.['display_format'] === 'timeline';
  }
}
