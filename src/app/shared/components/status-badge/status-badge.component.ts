import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeSeverity = 'success' | 'danger' | 'warning' | 'info' | 'secondary';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="getBadgeClass()">
      <ng-content></ng-content>
      @if (!hasContent && value) {
        {{ value }}
      }
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() severity: BadgeSeverity = 'info';
  @Input() value: string = '';
  @Input() rounded: boolean = false;

  hasContent = false;

  ngAfterContentInit() {
    // Check if there's projected content
    this.hasContent = false; // We'll rely on value input for simplicity
  }

  getBadgeClass(): string {
    const baseClass = 'badge font-semibold uppercase text-xs';
    const roundedClass = this.rounded ? 'badge-lg' : '';

    let severityClass = '';
    switch (this.severity) {
      case 'success':
        severityClass = 'badge-success';
        break;
      case 'danger':
        severityClass = 'badge-error';
        break;
      case 'warning':
        severityClass = 'badge-warning';
        break;
      case 'info':
        severityClass = 'badge-info';
        break;
      case 'secondary':
        severityClass = 'badge-neutral';
        break;
      default:
        severityClass = 'badge-info';
    }

    return `${baseClass} ${severityClass} ${roundedClass}`.trim();
  }
}
