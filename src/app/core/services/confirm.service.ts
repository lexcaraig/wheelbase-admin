import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private dialog = inject(MatDialog);

  /**
   * Show a confirmation dialog and return a promise that resolves to true if confirmed
   * This replaces PrimeNG's ConfirmationService.confirm()
   */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const dialogData: ConfirmDialogData = {
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      confirmColor: options.confirmColor,
      icon: options.icon
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: dialogData,
      width: '400px',
      disableClose: false
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    return result === true;
  }

  /**
   * Show a delete confirmation dialog
   */
  async confirmDelete(itemName: string = 'this item'): Promise<boolean> {
    return this.confirm({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'warn',
      icon: 'delete'
    });
  }

  /**
   * Show a ban user confirmation dialog
   */
  async confirmBan(username: string): Promise<boolean> {
    return this.confirm({
      title: 'Confirm Ban',
      message: `Are you sure you want to ban ${username}? They will no longer be able to access the platform.`,
      confirmText: 'Ban User',
      cancelText: 'Cancel',
      confirmColor: 'warn',
      icon: 'block'
    });
  }

  /**
   * Show a restore user confirmation dialog
   */
  async confirmRestore(username: string): Promise<boolean> {
    return this.confirm({
      title: 'Confirm Restore',
      message: `Are you sure you want to restore ${username}'s account? They will regain access to the platform.`,
      confirmText: 'Restore',
      cancelText: 'Cancel',
      confirmColor: 'primary',
      icon: 'restore'
    });
  }
}
