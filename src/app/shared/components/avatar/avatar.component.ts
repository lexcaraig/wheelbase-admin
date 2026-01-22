import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'small' | 'normal' | 'large' | 'xlarge';
export type AvatarShape = 'circle' | 'square';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [ngClass]="avatarClasses"
    >
      @if (image) {
        <img [src]="image" [alt]="label || 'Avatar'" (error)="onImageError($event)" />
      } @else {
        {{ displayLabel }}
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background-color: #FFD535;
      color: rgba(0, 0, 0, 0.87);
      font-weight: 600;
      flex-shrink: 0;
    }

    .avatar-circle {
      border-radius: 50%;
    }

    .avatar-square {
      border-radius: 4px;
    }

    .avatar-small {
      width: 32px;
      height: 32px;
      font-size: 0.75rem;
    }

    .avatar-normal {
      width: 40px;
      height: 40px;
      font-size: 0.875rem;
    }

    .avatar-large {
      width: 48px;
      height: 48px;
      font-size: 1rem;
    }

    .avatar-xlarge {
      width: 64px;
      height: 64px;
      font-size: 1.25rem;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    // Style class overrides
    .bg-primary {
      background-color: #FFD535;
    }

    .text-white {
      color: white;
    }
  `]
})
export class AvatarComponent {
  @Input() image: string | null = null;
  @Input() label: string = '';
  @Input() size: AvatarSize = 'normal';
  @Input() shape: AvatarShape = 'circle';
  @Input() styleClass: string = '';

  showFallback = false;

  get displayLabel(): string {
    if (this.label) {
      return this.label.charAt(0).toUpperCase();
    }
    return '?';
  }

  get avatarClasses(): string[] {
    const classes = ['avatar', `avatar-${this.size}`];
    if (this.shape === 'circle') {
      classes.push('avatar-circle');
    } else if (this.shape === 'square') {
      classes.push('avatar-square');
    }
    if (this.styleClass) {
      classes.push(...this.styleClass.split(' ').filter(c => c));
    }
    return classes;
  }

  onImageError(event: Event) {
    this.image = null;
    this.showFallback = true;
  }
}
