import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { AdminRoleGuard } from './core/auth/admin-role.guard';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { UsersListComponent } from './features/users/users-list/users-list.component';
import { UserDetailComponent } from './features/users/user-detail/user-detail.component';
import { ContentQueueComponent } from './features/moderation/content-queue/content-queue.component';
import { ReviewReportsComponent } from './features/moderation/review-reports/review-reports.component';
import { AdminUsersListComponent } from './features/admin-users/admin-users-list.component';
import { AuditLogsComponent } from './features/audit-logs/audit-logs.component';
import { SystemSettingsComponent } from './features/system-settings/system-settings.component';
import { ContentListComponent } from './features/content-management/content-list/content-list.component';
import { ContentEditorComponent } from './features/content-management/content-editor/content-editor.component';
import { ContentViewerComponent } from './features/content-management/content-viewer/content-viewer.component';
import { VerificationQueueComponent } from './features/business-verifications/verification-queue.component';
import { MonitoringComponent } from './features/monitoring/monitoring.component';
import { PromotionsListComponent } from './features/promotions/promotions-list.component';
import { PromotionEditorComponent } from './features/promotions/promotion-editor.component';
import { PromotionReportComponent } from './features/promotions/promotion-report.component';
import { AnnouncementsComponent } from './features/announcements/announcements.component';
import { BusinessListComponent } from './features/businesses/business-list.component';
import { EmergencyDashboardComponent } from './features/emergency/emergency-dashboard.component';
import { AuthCallbackComponent } from './features/auth/callback/auth-callback.component';
import { SubscriptionsComponent } from './features/subscriptions/subscriptions.component';

export const routes: Routes = [
  // Root redirect to dashboard (will trigger AuthGuard if not authenticated)
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // OAuth callback route (no guard - handles Google OAuth redirect)
  {
    path: 'auth/callback',
    component: AuthCallbackComponent
  },

  // Login route (no guard)
  {
    path: 'login',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        component: LoginComponent
      }
    ]
  },

  // Protected routes (auth guard)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'monitoring',
        component: MonitoringComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'analytics.view' }
      },
      // Emergency Dashboard - TICKET-009
      {
        path: 'emergency',
        component: EmergencyDashboardComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'analytics.view' }
      },
      {
        path: 'users',
        component: UsersListComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'users.view' }
      },
      {
        path: 'users/:id',
        component: UserDetailComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'users.view' }
      },
      {
        path: 'moderation',
        component: ContentQueueComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'content.moderate' }
      },
      {
        path: 'moderation/reviews',
        component: ReviewReportsComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'content.moderate' }
      },
      {
        path: 'admin-users',
        component: AdminUsersListComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'users.view' }
      },
      {
        path: 'audit-logs',
        component: AuditLogsComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'users.view' }
      },
      {
        path: 'settings',
        component: SystemSettingsComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'users.view' }
      },
      {
        path: 'announcements',
        component: AnnouncementsComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'users.view' }
      },
      {
        path: 'content',
        component: ContentListComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'content.moderate' }
      },
      {
        path: 'content/new',
        component: ContentEditorComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'content.moderate' }
      },
      {
        path: 'content/view/:id',
        component: ContentViewerComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'content.moderate' }
      },
      {
        path: 'content/edit/:id',
        component: ContentEditorComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'content.moderate' }
      },
      {
        path: 'verifications',
        component: VerificationQueueComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'content.moderate' }
      },
      // Promotions management (Quick Action Widget banners)
      {
        path: 'promotions',
        component: PromotionsListComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'content.moderate' }
      },
      {
        path: 'promotions/new',
        component: PromotionEditorComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'content.moderate' }
      },
      {
        path: 'promotions/edit/:id',
        component: PromotionEditorComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'content.moderate' }
      },
      {
        path: 'promotions/report/:id',
        component: PromotionReportComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'content.moderate' }
      },
      // Subscription Management
      {
        path: 'subscriptions',
        component: SubscriptionsComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'users.view' }
      },
      // Business Portal Management
      {
        path: 'businesses',
        component: BusinessListComponent,
        canActivate: [AdminRoleGuard],
        data: { permission: 'content.moderate' }
      }
    ]
  },

  // Catch all - redirect to dashboard
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
