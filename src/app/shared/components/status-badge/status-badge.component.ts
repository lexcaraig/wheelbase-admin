import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeSeverity = 'success' | 'danger' | 'warning' | 'info' | 'secondary';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="'status-badge badge-' + severity" [class.rounded]="rounded">
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

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      border-radius: 4px;

      &.rounded {
        border-radius: 9999px;
      }
    }

    .badge-success {
      background-color: #d1fae5;
      color: #065f46;
    }

    .badge-danger {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .badge-warning {
      background-color: #fef3c7;
      color: #92400e;
    }

    .badge-info {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .badge-secondary {
      background-color: #e5e7eb;
      color: #374151;
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
}
