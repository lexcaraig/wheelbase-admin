import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { UserDetail } from '../../../core/models/user.model';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    DialogModule,
    ToastModule,
    SkeletonModule,
    RelativeTimePipe
  ],
  providers: [MessageService],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent implements OnInit {
  user = signal<UserDetail | null>(null);
  isLoading = signal(true);
  userId = signal<string>('');
  activeTab = signal(0);

  // Ban Dialog
  showBanDialog = signal(false);
  banReason = ''; // Regular property for ngModel
  isBanning = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId.set(params['id']);
      this.loadUserDetail();
    });
  }

  async loadUserDetail() {
    try {
      this.isLoading.set(true);
      const userData = await this.usersService.getUserDetail(this.userId());
      this.user.set(userData);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load user details'
      });
      // Go back to users list on error
      setTimeout(() => this.router.navigate(['/users']), 2000);
    } finally {
      this.isLoading.set(false);
    }
  }

  openBanDialog() {
    this.banReason = '';
    this.showBanDialog.set(true);
  }

  async banUser() {
    if (!this.user() || !this.banReason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Ban reason is required'
      });
      return;
    }

    try {
      this.isBanning.set(true);
      await this.usersService.banUser(this.user()!.id, this.banReason);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User has been banned'
      });

      this.showBanDialog.set(false);
      await this.loadUserDetail();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to ban user'
      });
    } finally {
      this.isBanning.set(false);
    }
  }

  async unbanUser() {
    if (!this.user()) return;

    try {
      await this.usersService.unbanUser(this.user()!.id);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User has been unbanned'
      });

      await this.loadUserDetail();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to unban user'
      });
    }
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  getSeverity(tier: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (tier) {
      case 'premium': return 'warn';
      case 'pro': return 'info';
      case 'free': return 'success';
      default: return 'info';
    }
  }
}
