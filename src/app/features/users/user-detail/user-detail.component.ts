import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsersService } from '../../../core/services/users.service';
import { UserDetail } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { getSubscriptionTierSeverity } from '../../../shared/utils/severity.utils';
import { BadgeSeverity } from '../../../shared/components/status-badge/status-badge.component';
import { UserDetailBanDialogComponent } from './dialogs/user-detail-ban-dialog.component';
import { UserDetailHardDeleteDialogComponent } from './dialogs/user-detail-hard-delete-dialog.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    MatTooltipModule,
    StatusBadgeComponent,
    AvatarComponent,
    RelativeTimePipe
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent implements OnInit {
  user = signal<UserDetail | null>(null);
  isLoading = signal(true);
  userId = signal<string>('');
  activeTab = signal(0);

  // Posts table columns
  postsDisplayedColumns: string[] = ['content', 'engagement', 'date'];
  ridesDisplayedColumns: string[] = ['title', 'distance', 'participants', 'date'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private notificationService: NotificationService,
    private dialog: MatDialog
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
      this.notificationService.error('Error', error.message || 'Failed to load user details');
      // Go back to users list on error
      setTimeout(() => this.router.navigate(['/users']), 2000);
    } finally {
      this.isLoading.set(false);
    }
  }

  openBanDialog() {
    const dialogRef = this.dialog.open(UserDetailBanDialogComponent, {
      width: '500px',
      data: { user: this.user() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUserDetail();
      }
    });
  }

  async unbanUser() {
    if (!this.user()) return;

    try {
      await this.usersService.unbanUser(this.user()!.id);
      this.notificationService.success('Success', 'User has been unbanned');
      await this.loadUserDetail();
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'Failed to unban user');
    }
  }

  openHardDeleteDialog() {
    const dialogRef = this.dialog.open(UserDetailHardDeleteDialogComponent, {
      width: '600px',
      data: { user: this.user() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Navigate back to users list
        setTimeout(() => this.router.navigate(['/users']), 1500);
      }
    });
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  getSeverity(tier: string): BadgeSeverity {
    return getSubscriptionTierSeverity(tier);
  }

  onTabChange(index: number) {
    this.activeTab.set(index);
  }
}
