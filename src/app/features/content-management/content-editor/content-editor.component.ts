import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CmsService, ContentPage } from '../../../core/services/cms.service';

@Component({
  selector: 'app-content-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './content-editor.component.html',
  styleUrls: ['./content-editor.component.scss']
})
export class ContentEditorComponent implements OnInit {
  contentId: string | null = null;
  isEditMode = false;
  loading = false;
  saving = false;
  error: string | null = null;
  currentContent: ContentPage | null = null;

  // Form data
  formData = {
    slug: '',
    category: 'help' as 'legal' | 'updates' | 'help' | 'announcements' | 'about',
    title: '',
    content: '',
    excerpt: '',
    effectiveDate: '',
    changeSummary: '',
    changeType: 'minor' as 'major' | 'minor' | 'patch',
    metadata: {
      seo: {
        title: '',
        description: ''
      },
      tags: [] as string[]
    }
  };

  categories = [
    { value: 'legal', label: 'Legal', description: 'Terms, Privacy, Guidelines' },
    { value: 'updates', label: 'App Updates', description: 'Release notes, changelogs' },
    { value: 'help', label: 'Help Center', description: 'How-to guides, FAQs' },
    { value: 'announcements', label: 'Announcements', description: 'News, updates' },
    { value: 'about', label: 'About', description: 'Company info' }
  ];

  changeTypes = [
    { value: 'major', label: 'Major', description: 'Breaking changes' },
    { value: 'minor', label: 'Minor', description: 'New content' },
    { value: 'patch', label: 'Patch', description: 'Typo fixes' }
  ];

  // Preview mode
  showPreview = false;

  constructor(
    private cmsService: CmsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.contentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.contentId && this.contentId !== 'new';

    if (this.isEditMode && this.contentId) {
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
        // Populate form with loaded content
        this.currentContent = content;
        this.formData = {
          slug: content.slug,
          category: content.category as any,
          title: content.title,
          content: content.content,
          excerpt: content.excerpt || '',
          effectiveDate: content.effectiveDate ? this.formatDateForInput(content.effectiveDate) : '',
          changeSummary: '',
          changeType: 'minor',
          metadata: {
            seo: {
              title: content.metadata?.seo?.title || '',
              description: content.metadata?.seo?.description || '',
            },
            tags: content.metadata?.tags || [],
          },
        };
        this.loading = false;
      },
      error: (err) => {
        this.error = `Failed to load content: ${err.message}`;
        this.loading = false;
      }
    });
  }

  private formatDateForInput(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  }

  saveAsDraft(): void {
    this.save(false);
  }

  saveAndPublish(): void {
    if (confirm('Are you sure you want to publish this content? It will be visible to the public immediately.')) {
      this.save(true);
    }
  }

  private save(publish: boolean): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    this.error = null;

    const data = {
      slug: this.formData.slug,
      category: this.formData.category,
      title: this.formData.title,
      content: this.formData.content,
      excerpt: this.formData.excerpt || undefined,
      effectiveDate: this.formData.effectiveDate || undefined,
      metadata: this.formData.metadata,
      changeSummary: this.formData.changeSummary || undefined,
      changeType: this.formData.changeType
    };

    const operation = this.isEditMode && this.contentId
      ? this.cmsService.updateContent(this.contentId, data)
      : this.cmsService.createContent(data);

    operation.subscribe({
      next: (content) => {
        if (publish) {
          // Publish after saving
          this.cmsService.publishContent(content.id, 'publish').subscribe({
            next: () => {
              this.saving = false;
              alert('Content saved and published successfully!');
              this.router.navigate(['/content']);
            },
            error: (err) => {
              this.saving = false;
              this.error = `Saved but failed to publish: ${err.message}`;
            }
          });
        } else {
          this.saving = false;
          alert('Content saved as draft successfully!');
          this.router.navigate(['/content']);
        }
      },
      error: (err) => {
        this.saving = false;
        this.error = err.message;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  validateForm(): boolean {
    if (!this.formData.slug) {
      alert('Slug is required');
      return false;
    }

    if (!this.formData.slug.match(/^[a-z0-9-]+$/)) {
      alert('Slug must contain only lowercase letters, numbers, and hyphens');
      return false;
    }

    if (!this.formData.title.trim()) {
      alert('Title is required');
      return false;
    }

    if (!this.formData.content.trim()) {
      alert('Content is required');
      return false;
    }

    if (this.formData.category === 'legal' && !this.formData.effectiveDate) {
      if (!confirm('Legal documents typically have an effective date. Continue without one?')) {
        return false;
      }
    }

    return true;
  }

  cancel(): void {
    if (confirm('Discard all changes?')) {
      this.router.navigate(['/content']);
    }
  }

  // Auto-generate slug from title
  generateSlug(): void {
    if (!this.isEditMode || !this.formData.slug) {
      this.formData.slug = this.formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
  }

  // Auto-fill SEO metadata from title/excerpt
  autoFillSEO(): void {
    if (!this.formData.metadata.seo.title) {
      this.formData.metadata.seo.title = `${this.formData.title} - Wheelbase`;
    }
    if (!this.formData.metadata.seo.description && this.formData.excerpt) {
      this.formData.metadata.seo.description = this.formData.excerpt;
    }
  }

  togglePreview(): void {
    this.showPreview = !this.showPreview;
  }

  // Markdown helper - insert template
  insertMarkdownTemplate(): void {
    const template = `# ${this.formData.title || 'Heading'}

## Introduction

Write your introduction here...

## Main Content

### Section 1

Your content here...

### Section 2

More content...

## Conclusion

Final thoughts...`;

    if (!this.formData.content || confirm('Replace existing content with template?')) {
      this.formData.content = template;
    }
  }

  // Insert markdown syntax helper
  insertMarkdown(syntax: string): void {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = this.formData.content.substring(start, end);
    let replacement = '';

    switch (syntax) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        break;
      case 'heading':
        replacement = `## ${selectedText || 'Heading'}`;
        break;
      case 'link':
        replacement = `[${selectedText || 'link text'}](url)`;
        break;
      case 'list':
        replacement = `- ${selectedText || 'list item'}`;
        break;
      case 'code':
        replacement = `\`${selectedText || 'code'}\``;
        break;
      case 'codeblock':
        replacement = `\`\`\`\n${selectedText || 'code block'}\n\`\`\``;
        break;
    }

    this.formData.content = this.formData.content.substring(0, start) + replacement + this.formData.content.substring(end);

    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 10);
  }

  getCharacterCount(): string {
    return `${this.formData.content.length} characters, ~${Math.ceil(this.formData.content.split(/\s+/).length / 200)} min read`;
  }
}
