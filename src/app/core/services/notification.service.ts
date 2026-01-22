import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type NotificationSeverity = 'success' | 'error' | 'warn' | 'info';

export interface NotificationMessage {
  severity: NotificationSeverity;
  summary: string;
  detail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  /**
   * Show a notification with the specified severity
   * This replaces PrimeNG's MessageService.add()
   */
  add(message: NotificationMessage): void {
    const config: MatSnackBarConfig = {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: this.getSeverityClass(message.severity)
    };

    const displayMessage = message.detail
      ? `${message.summary}: ${message.detail}`
      : message.summary;

    this.snackBar.open(displayMessage, 'Close', config);
  }

  /**
   * Show a success notification
   */
  success(summary: string, detail?: string): void {
    this.add({ severity: 'success', summary, detail });
  }

  /**
   * Show an error notification
   */
  error(summary: string, detail?: string): void {
    this.add({ severity: 'error', summary, detail });
  }

  /**
   * Show a warning notification
   */
  warn(summary: string, detail?: string): void {
    this.add({ severity: 'warn', summary, detail });
  }

  /**
   * Show an info notification
   */
  info(summary: string, detail?: string): void {
    this.add({ severity: 'info', summary, detail });
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.snackBar.dismiss();
  }

  private getSeverityClass(severity: NotificationSeverity): string[] {
    const classMap: Record<NotificationSeverity, string> = {
      success: 'snackbar-success',
      error: 'snackbar-error',
      warn: 'snackbar-warning',
      info: 'snackbar-info'
    };

    return [classMap[severity]];
  }
}
