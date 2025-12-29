# Wheelbase Admin Panel - Features Documentation

**Project:** Wheelbase Admin Panel
**Version:** 1.0.0 (MVP)
**Last Updated:** December 28, 2024

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Dashboard & Analytics](#dashboard--analytics)
4. [User Management](#user-management)
5. [Content Moderation](#content-moderation)
6. [Audit Logging](#audit-logging)
7. [Future Features (BACKOFFICE-002)](#future-features-backoffice-002)

---

## Feature Overview

The Wheelbase Admin Panel provides comprehensive administrative tools for managing the Wheelbase motorcycle community platform. Features are organized into four main categories:

| Category | Features | Status |
|----------|----------|--------|
| **Authentication** | Email/Password, Google OAuth, Role-Based Access | ✅ Complete |
| **Dashboard** | Analytics, Charts, Auto-Refresh | ✅ Complete |
| **User Management** | View, Search, Ban/Unban Users | ✅ Complete |
| **Content Moderation** | Flagged Content Queue, Approve/Remove | ✅ Complete |
| **Audit Logging** | Automatic Action Tracking | ✅ Complete |

---

## Authentication & Authorization

### 1.1 Email/Password Login ✅

**Description:**
Secure email and password-based authentication for admin users.

**User Flow:**
1. Admin navigates to `/login`
2. Enters email and password
3. Clicks "Sign In" button
4. System validates credentials via `admin-login` Edge Function
5. On success: JWT token stored, redirect to `/dashboard`
6. On failure: Error message displayed

**Features:**
- ✅ Form validation (email format, password required)
- ✅ Loading state during authentication
- ✅ Error handling with user-friendly messages
- ✅ "Remember me" checkbox (persists session)
- ✅ Password visibility toggle
- ✅ Disabled state while submitting

**Technical Details:**
- **Endpoint:** `POST /admin/login`
- **Request:**
  ```json
  {
    "email": "admin@example.com",
    "password": "securePassword123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "email": "admin@example.com",
        "role": "super_admin",
        "full_name": "Admin User"
      },
      "session": {
        "access_token": "jwt-token",
        "refresh_token": "refresh-token",
        "expires_at": "2024-12-28T13:00:00Z"
      }
    }
  }
  ```

**Security:**
- Passwords hashed with bcrypt (cost factor 12)
- JWT signed with RS256 algorithm
- Access token: 1 hour expiry
- Refresh token: 7 days expiry
- Failed login attempts tracked (future: rate limiting)

---

### 1.2 Google OAuth 2.0 Login ✅

**Description:**
One-click authentication using Google account for convenience and security.

**User Flow:**
1. Admin clicks "Sign in with Google" button
2. Redirected to Google OAuth consent screen
3. Approves access (first time only)
4. Redirected back to admin panel with auth code
5. System exchanges code for access token
6. User data retrieved from Google
7. JWT token issued, redirect to `/dashboard`

**Features:**
- ✅ Google OAuth 2.0 integration
- ✅ Automatic account creation (if email in `admin_users`)
- ✅ Profile photo sync from Google
- ✅ Email verification (Google provides verified emails)
- ✅ Single sign-on experience

**Technical Details:**
- **OAuth Client:** Configured in Supabase Dashboard
- **Scopes:** email, profile, openid
- **Callback URL:** `https://admin.ridewheelbase.app/auth/callback`
- **Provider:** Supabase Auth (wraps Google OAuth)

**Security:**
- OAuth 2.0 standard compliance
- PKCE (Proof Key for Code Exchange) enabled
- State parameter for CSRF protection
- Only whitelisted redirect URIs allowed

---

### 1.3 Role-Based Access Control (RBAC) ✅

**Description:**
Four-tier permission system controlling feature access based on admin role.

**Roles & Permissions:**

| Role | Users | Banning | Moderation | Analytics | Audit Logs |
|------|-------|---------|------------|-----------|------------|
| **super_admin** | ✅ View, Ban | ✅ Full | ✅ Full | ✅ View | ✅ View All |
| **admin** | ✅ View, Ban | ✅ Full | ✅ Full | ✅ View | ✅ View Own |
| **moderator** | ❌ No Access | ❌ No Access | ✅ Full | ❌ No Access | ✅ View Own |
| **support** | ✅ View Only | ❌ No Access | ❌ No Access | ✅ View | ✅ View Own |

**Permission Matrix:**

```typescript
interface AdminPermissions {
  'users.view': boolean;       // View user list
  'users.ban': boolean;         // Ban/unban users
  'content.moderate': boolean;  // Approve/remove content
  'analytics.view': boolean;    // View dashboard
  'audit.view': boolean;        // View audit logs
}
```

**Implementation:**
- Route guards check permissions before page load
- Component-level permission checks hide/show UI elements
- Edge Functions validate permissions server-side
- Unauthorized access redirects to `/unauthorized`

**Features:**
- ✅ Automatic permission enforcement
- ✅ Graceful degradation (UI adapts to role)
- ✅ Server-side validation (security layer)
- ✅ Role assignment (super_admin only)

---

### 1.4 Session Management ✅

**Description:**
Automatic session lifecycle management with security best practices.

**Features:**
- ✅ JWT token storage in localStorage
- ✅ Automatic session refresh before expiry
- ✅ Session timeout detection (1 hour)
- ✅ Automatic logout on token expiry
- ✅ Redirect to login when unauthorized
- ✅ Persistent sessions (Remember Me)
- ✅ Manual logout with token revocation

**Session Lifecycle:**
1. **Login:** JWT issued with 1-hour expiry
2. **Active:** Token validated on every API call
3. **Refresh:** Auto-refresh 5 minutes before expiry
4. **Timeout:** Logout + redirect after 1 hour inactivity
5. **Logout:** Token revoked server-side

**Security:**
- HttpOnly cookies (future enhancement)
- Secure flag (HTTPS only)
- SameSite=Strict (CSRF protection)
- Token rotation on refresh

---

## Dashboard & Analytics

### 2.1 Metrics Cards ✅

**Description:**
Real-time key performance indicators (KPIs) displayed as cards.

**Metrics:**

**Total Users**
- **Description:** All-time registered users count
- **Calculation:** `SELECT COUNT(*) FROM users`
- **Refresh:** Every 30 seconds
- **Icon:** Users icon with blue background
- **Sparkline:** 10-day trend

**Daily Active Users (DAU)**
- **Description:** Unique users active in last 24 hours
- **Calculation:** PostgreSQL function `get_dau(0)`
- **Refresh:** Every 30 seconds
- **Icon:** Activity icon with green background
- **Sparkline:** 10-day DAU trend

**Monthly Active Users (MAU)**
- **Description:** Unique users active in last 30 days
- **Calculation:** PostgreSQL function `get_mau()`
- **Refresh:** Every 30 seconds
- **Icon:** Calendar icon with purple background
- **Sparkline:** 10-day MAU trend

**Rides This Month**
- **Description:** Total rides created in current calendar month
- **Calculation:** `SELECT COUNT(*) FROM rides WHERE created_at >= date_trunc('month', NOW())`
- **Refresh:** Every 30 seconds
- **Icon:** Motorcycle icon with orange background
- **Sparkline:** 10-day ride count trend

**Features:**
- ✅ Large, easy-to-read numbers
- ✅ Color-coded icons
- ✅ Trend sparklines (10-day history)
- ✅ Loading skeleton states
- ✅ Error states with retry button
- ✅ Responsive layout (stacks on mobile)

---

### 2.2 Subscription Tier Chart ✅

**Description:**
Doughnut chart showing distribution of users across subscription tiers.

**Chart Details:**
- **Type:** Doughnut chart
- **Data Source:** `admin-analytics-dashboard` endpoint
- **Tiers:** Free, Pro, Premium
- **Colors:**
  - Free: Blue (#3B82F6)
  - Pro: Purple (#8B5CF6)
  - Premium: Orange (#F59E0B)
- **Legend:** Right side with percentages
- **Refresh:** Every 30 seconds

**Features:**
- ✅ Interactive hover tooltips
- ✅ Click to filter (future enhancement)
- ✅ Responsive sizing
- ✅ Smooth animations
- ✅ Loading state placeholder

**Data Format:**
```json
{
  "subscription_tiers": {
    "free": 1250,
    "pro": 180,
    "premium": 45
  }
}
```

---

### 2.3 Ride Activity Chart ✅

**Description:**
7-day line chart showing daily ride creation trends.

**Chart Details:**
- **Type:** Line chart with fill
- **Data Source:** Last 7 days of ride activity
- **X-Axis:** Dates (e.g., "Dec 21", "Dec 22")
- **Y-Axis:** Ride count
- **Color:** Blue with light blue fill
- **Refresh:** Every 30 seconds

**Features:**
- ✅ Smooth curve (tension: 0.4)
- ✅ Interactive hover tooltips
- ✅ Point radius: 4px (hover: 6px)
- ✅ Grid lines (Y-axis only)
- ✅ Responsive sizing
- ✅ Loading state placeholder

**Data Format:**
```json
{
  "ride_activity": [
    { "date": "2024-12-21", "rides_count": 45 },
    { "date": "2024-12-22", "rides_count": 52 },
    { "date": "2024-12-23", "rides_count": 38 }
  ]
}
```

---

### 2.4 Recent Users Table ✅

**Description:**
Quick view of the 5 most recent user registrations.

**Columns:**
- **Avatar:** Profile picture (or initials fallback)
- **User:** Full name + email
- **Location:** Country name (e.g., "Philippines")
- **Subscription:** Free/Pro/Premium badge
- **Joined:** Relative time (e.g., "2 hours ago")

**Features:**
- ✅ Avatar with fallback initials
- ✅ Colored subscription badges
- ✅ Relative time formatting
- ✅ Click row to view user detail
- ✅ Loading skeleton (5 rows)
- ✅ Auto-refresh with dashboard

**Technical Details:**
- **Endpoint:** `GET /admin/get-users?page=1&pageSize=5`
- **Sort:** `created_at DESC` (newest first)
- **Refresh:** Every 30 seconds with dashboard

---

### 2.5 Auto-Refresh ✅

**Description:**
Automatic dashboard data refresh for real-time monitoring.

**Features:**
- ✅ Refresh interval: 30 seconds
- ✅ Fetches all dashboard data
- ✅ Refreshes charts and tables
- ✅ Smooth transitions (no flicker)
- ✅ Automatic cleanup on unmount
- ✅ Pause on error (prevents spam)

**Implementation:**
```typescript
private startAutoRefresh() {
  this.refreshInterval = setInterval(() => {
    this.loadAnalytics();
    this.loadRecentUsers();
  }, 30000); // 30 seconds
}

ngOnDestroy() {
  if (this.refreshInterval) {
    clearInterval(this.refreshInterval);
  }
}
```

**User Controls (Future):**
- [ ] Pause/resume button
- [ ] Custom interval selector
- [ ] Last updated timestamp display

---

## User Management

### 3.1 User List Table ✅

**Description:**
Paginated, searchable, filterable table of all app users.

**Columns:**
- **Avatar:** Profile picture with fallback
- **User:** Full name, username, email
- **Location:** Country
- **Subscription:** Free/Pro/Premium badge
- **Status:** Active/Banned badge
- **Joined:** Relative time
- **Actions:** View Detail, Ban/Unban

**Features:**

**Pagination:**
- ✅ 25 users per page
- ✅ First/Previous/Next/Last buttons
- ✅ Page number display (e.g., "Page 1 of 10")
- ✅ Total users count
- ✅ Lazy loading (backend pagination)

**Search:**
- ✅ Search by email or username
- ✅ Debounced input (500ms delay)
- ✅ Clear search button
- ✅ Case-insensitive matching
- ✅ Results update automatically

**Filters:**
- ✅ Status filter (All/Active/Banned)
- ✅ Dropdown selector
- ✅ Persisted in query params
- ✅ Combine with search

**Sorting:**
- ✅ Click column header to sort
- ✅ Ascending/descending toggle
- ✅ Sort indicators (↑↓)
- ✅ Sortable columns: Join Date, Reputation

**Actions:**
- ✅ View Detail button → Navigate to `/users/:id`
- ✅ Ban button (active users only)
- ✅ Unban button (banned users only)
- ✅ Confirmation dialogs
- ✅ Toast notifications

**Technical Details:**
- **Endpoint:** `GET /admin/get-users`
- **Request:**
  ```json
  {
    "page": 1,
    "pageSize": 25,
    "searchTerm": "john",
    "filter": "active"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "users": [...],
      "total": 150,
      "page": 1,
      "pageSize": 25
    }
  }
  ```

---

### 3.2 User Detail Page ✅

**Description:**
Comprehensive view of a single user's profile and activity.

**Sections:**

**Profile Information:**
- Full name
- Username (@handle)
- Email address
- Bio/description
- Profile photo
- Location (country/city)
- Join date
- Last active timestamp

**Statistics:**
- Total rides created
- Total posts published
- Total followers
- Total following
- Reputation score
- Subscription tier (Free/Pro/Premium)

**Motorcycles:**
- List of registered motorcycles
- Make, model, year
- Primary bike indicator
- Motorcycle photos

**Account Status:**
- Active or Banned badge
- Ban reason (if banned)
- Banned by (admin name)
- Ban date

**Actions:**
- ✅ Ban User button (if active)
- ✅ Unban User button (if banned)
- ✅ Back to Users List button

**Features:**
- ✅ Loading state (skeleton)
- ✅ Error state with retry
- ✅ 404 handling (user not found)
- ✅ Breadcrumb navigation
- ✅ Responsive layout

**Technical Details:**
- **Route:** `/users/:id`
- **Endpoint:** `GET /admin/get-user-detail`
- **Request:** `{ "userId": "uuid" }`

---

### 3.3 Ban User ✅

**Description:**
Temporarily or permanently restrict a user's access to the platform.

**User Flow:**
1. Admin clicks "Ban User" button
2. Confirmation dialog appears
3. Admin enters ban reason (required)
4. Admin clicks "Confirm Ban"
5. User is banned immediately
6. Audit log entry created
7. Toast notification: "User banned successfully"
8. User list/detail refreshes

**Features:**
- ✅ Required ban reason (min 10 characters)
- ✅ Confirmation dialog
- ✅ Loading state during API call
- ✅ Error handling
- ✅ Toast notification
- ✅ Automatic audit logging
- ✅ Immediate effect (user can't login)

**Ban Effects:**
- User can no longer log in
- All active sessions invalidated
- Profile shown as "Banned" in app
- User content remains visible (future: hide option)

**Technical Details:**
- **Endpoint:** `POST /admin/ban-user`
- **Request:**
  ```json
  {
    "userId": "uuid",
    "reason": "Spam violation - posted commercial links repeatedly"
  }
  ```
- **Database Updates:**
  ```sql
  UPDATE users SET
    is_banned = true,
    ban_reason = 'Spam violation...',
    banned_at = NOW(),
    banned_by = current_admin_id
  WHERE id = user_id;
  ```

**Audit Log:**
```json
{
  "action": "ban_user",
  "resource_type": "user",
  "resource_id": "user-uuid",
  "details": {
    "reason": "Spam violation...",
    "banned_by": "admin-uuid"
  }
}
```

---

### 3.4 Unban User ✅

**Description:**
Restore a banned user's access to the platform.

**User Flow:**
1. Admin clicks "Unban User" button
2. Confirmation dialog appears
3. Admin clicks "Confirm Unban"
4. Ban removed immediately
5. Audit log entry created
6. Toast notification: "User unbanned successfully"
7. User list/detail refreshes

**Features:**
- ✅ Confirmation dialog
- ✅ Loading state
- ✅ Error handling
- ✅ Toast notification
- ✅ Automatic audit logging
- ✅ Immediate effect (user can login)

**Unban Effects:**
- User can log in again
- Ban reason cleared
- Profile shown as "Active" in app
- All features restored

**Technical Details:**
- **Endpoint:** `POST /admin/unban-user`
- **Request:** `{ "userId": "uuid" }`
- **Database Updates:**
  ```sql
  UPDATE users SET
    is_banned = false,
    ban_reason = NULL,
    banned_at = NULL,
    banned_by = NULL
  WHERE id = user_id;
  ```

---

## Content Moderation

### 4.1 Flagged Content Queue ✅

**Description:**
Table of user-reported posts and comments requiring moderation.

**Columns:**
- **Content:** Post/comment text preview (first 100 chars)
- **Type:** Post or Comment badge
- **Author:** User who created the content
- **Reporter:** User who flagged it
- **Reason:** Flag reason (spam, harassment, inappropriate, etc.)
- **Date:** When content was flagged
- **Actions:** Preview, Approve, Remove

**Features:**

**Filters:**
- ✅ Content type (All/Posts/Comments)
- ✅ Dropdown selector
- ✅ Filter persisted in query params

**Pagination:**
- ✅ 25 items per page
- ✅ Standard pagination controls
- ✅ Total flagged items count

**Actions:**
- ✅ Preview button → Shows full content in dialog
- ✅ Approve button → Clears flag, keeps content
- ✅ Remove button → Deletes content permanently
- ✅ Confirmation dialogs for destructive actions
- ✅ Toast notifications

**Technical Details:**
- **Endpoint:** `GET /admin/get-flagged-content`
- **Request:**
  ```json
  {
    "page": 1,
    "pageSize": 25,
    "contentType": "posts" // or "comments" or "all"
  }
  ```

---

### 4.2 Content Preview Dialog ✅

**Description:**
Modal dialog showing full content details for moderation review.

**Content Displayed:**

**For Posts:**
- Full post text
- All images (if any)
- Post location
- Hashtags and mentions
- Like/comment counts
- Created date
- Author profile (name, avatar)

**For Comments:**
- Full comment text
- Parent post preview
- Created date
- Author profile

**Flag Details:**
- Flag reason
- Reporter name
- Flag date

**Actions:**
- ✅ Approve button
- ✅ Remove button
- ✅ Close dialog button

**Features:**
- ✅ Full-screen on mobile
- ✅ Scrollable content
- ✅ Syntax highlighting for links/hashtags
- ✅ Image zoom capability
- ✅ Keyboard shortcuts (ESC to close)

---

### 4.3 Approve Content ✅

**Description:**
Clear the flag on content deemed acceptable, keeping it visible.

**User Flow:**
1. Admin reviews content in preview dialog
2. Admin clicks "Approve" button
3. Confirmation dialog: "This content will be marked as reviewed and remain visible. Continue?"
4. Admin confirms
5. Flag cleared immediately
6. Audit log entry created
7. Toast: "Content approved"
8. Queue refreshes

**Features:**
- ✅ Confirmation dialog
- ✅ Loading state
- ✅ Error handling
- ✅ Toast notification
- ✅ Automatic audit logging

**Technical Details:**
- **Endpoint:** `POST /admin/moderate-content`
- **Request:**
  ```json
  {
    "contentId": "uuid",
    "contentType": "post",
    "action": "approve"
  }
  ```
- **Database Updates:**
  ```sql
  UPDATE posts SET
    is_flagged = false,
    flag_reason = NULL,
    moderated_at = NOW(),
    moderated_by = current_admin_id
  WHERE id = content_id;
  ```

---

### 4.4 Remove Content ✅

**Description:**
Permanently delete flagged content from the platform.

**User Flow:**
1. Admin reviews content in preview dialog
2. Admin clicks "Remove" button
3. Confirmation dialog: "This content will be permanently deleted. This action cannot be undone. Continue?"
4. Admin confirms
5. Content deleted immediately
6. Audit log entry created
7. Toast: "Content removed"
8. Queue refreshes

**Features:**
- ✅ Strong confirmation dialog (red button)
- ✅ Warning about permanent deletion
- ✅ Loading state
- ✅ Error handling
- ✅ Toast notification
- ✅ Automatic audit logging

**Deletion Effects:**
- Content no longer visible in app
- Removed from feeds
- Like/comment counts updated
- Author notified (future enhancement)
- Can be recovered from database (soft delete)

**Technical Details:**
- **Endpoint:** `POST /admin/moderate-content`
- **Request:**
  ```json
  {
    "contentId": "uuid",
    "contentType": "post",
    "action": "remove"
  }
  ```
- **Database Updates (Soft Delete):**
  ```sql
  UPDATE posts SET
    is_deleted = true,
    deleted_at = NOW(),
    deleted_by = current_admin_id,
    deletion_reason = 'Flagged content removed by moderator'
  WHERE id = content_id;
  ```

---

## Audit Logging

### 5.1 Automatic Action Tracking ✅

**Description:**
All admin actions are automatically logged for security and compliance.

**Logged Actions:**
- User bans
- User unbans
- Content approvals
- Content removals
- Login events
- Failed login attempts
- Permission changes (future)

**Logged Data:**
- Admin user ID
- Action type (e.g., "ban_user")
- Resource type (e.g., "user")
- Resource ID (affected user/content)
- Action details (JSON object)
- IP address
- User agent (browser/device info)
- Timestamp (UTC)

**Features:**
- ✅ Automatic logging (no manual intervention)
- ✅ Immutable logs (cannot be edited/deleted)
- ✅ Server-side enforcement (Edge Functions)
- ✅ RLS protection (read-only via UI)
- ✅ Structured data (queryable)

**Audit Log Entry Example:**
```json
{
  "id": "uuid",
  "admin_user_id": "admin-uuid",
  "action": "ban_user",
  "resource_type": "user",
  "resource_id": "user-uuid",
  "details": {
    "reason": "Spam violation",
    "user_email": "spammer@example.com"
  },
  "ip_address": "203.0.113.42",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2024-12-28T12:00:00Z"
}
```

**Compliance:**
- ✅ GDPR compliant (admin accountability)
- ✅ SOC 2 ready (audit trail)
- ✅ HIPAA ready (if needed)

---

### 5.2 Audit Log Viewer (Future - BACKOFFICE-002)

**Planned Features:**
- [ ] View all audit logs (paginated table)
- [ ] Search by admin user
- [ ] Filter by action type
- [ ] Filter by date range
- [ ] Export logs to CSV
- [ ] Retention policy management
- [ ] Compliance reports

---

## Future Features (BACKOFFICE-002)

### 6.1 Advanced Analytics

**Custom Date Ranges:**
- [ ] Date range picker (last 7/30/90 days, custom)
- [ ] Apply to all charts
- [ ] Compare date ranges

**User Metrics:**
- [ ] User growth trends
- [ ] Retention cohort analysis
- [ ] Geographic distribution map
- [ ] Device breakdown (iOS/Android)
- [ ] Active users by hour of day

**Ride Analytics:**
- [ ] Popular routes (most ridden)
- [ ] Average ride duration/distance
- [ ] Group ride vs solo breakdown
- [ ] Ride participation trends

**Social Metrics:**
- [ ] Post engagement rates
- [ ] Trending hashtags
- [ ] Most active users
- [ ] Network growth (followers)

**Export:**
- [ ] Export charts as PNG/PDF
- [ ] Export data as CSV
- [ ] Scheduled reports (daily/weekly/monthly)

---

### 6.2 System Health Monitoring

**Edge Functions:**
- [ ] Response time metrics (p50, p95, p99)
- [ ] Error rate by function
- [ ] Request volume trends
- [ ] Function invocation costs

**Database:**
- [ ] Slow query detection
- [ ] Connection pool usage
- [ ] Table size growth
- [ ] Index usage statistics

**Storage:**
- [ ] Storage used by bucket
- [ ] Upload/download bandwidth
- [ ] Storage costs

**Alerts:**
- [ ] Real-time error alerts
- [ ] Response time degradation
- [ ] Connection pool maxed out
- [ ] Storage quota warnings

---

### 6.3 Push Notification Broadcasting

**Broadcast Creation:**
- [ ] Send to all users
- [ ] Send to user segments (location, device, subscription)
- [ ] Schedule for later delivery
- [ ] A/B test variants

**Templates:**
- [ ] Save reusable templates
- [ ] Variables/placeholders ({{username}}, {{date}})
- [ ] Preview before sending

**Targeting:**
- [ ] By location (country, city)
- [ ] By user activity (active, dormant)
- [ ] By subscription (free, pro, premium)
- [ ] By device (iOS, Android)

**Analytics:**
- [ ] Delivery rate
- [ ] Open rate
- [ ] Click-through rate
- [ ] Conversion tracking

---

### 6.4 Support Ticket Management

**Ticket Queue:**
- [ ] View all support tickets
- [ ] Filter by status (new, in_progress, resolved)
- [ ] Filter by priority (low, medium, high, urgent)
- [ ] Assign to team members

**Ticket Details:**
- [ ] Full ticket history
- [ ] User profile integration
- [ ] Internal notes (admin-only)
- [ ] File attachments

**Actions:**
- [ ] Reply to user (email + in-app)
- [ ] Mark as resolved
- [ ] Escalate to senior admin
- [ ] Merge duplicate tickets

**Canned Responses:**
- [ ] Save frequently used replies
- [ ] Insert into tickets
- [ ] Template variables

**SLA Tracking:**
- [ ] First response time
- [ ] Resolution time
- [ ] SLA breach alerts

---

### 6.5 Enhanced Audit Logging

**Advanced Search:**
- [ ] Search by admin user
- [ ] Filter by action type
- [ ] Filter by date range
- [ ] Full-text search in details

**Export:**
- [ ] Export logs to CSV
- [ ] Export compliance reports
- [ ] Automated retention policy

**Permission Management:**
- [ ] View all admin users
- [ ] Assign/revoke roles
- [ ] Deactivate accounts
- [ ] Permission change history

---

### 6.6 Data Export

**User Export:**
- [ ] Export all users to CSV
- [ ] Export filtered users
- [ ] Include user stats

**Content Export:**
- [ ] Export posts with metrics
- [ ] Export marketplace listings
- [ ] Export group rides

**Analytics Export:**
- [ ] Export charts as images
- [ ] Export data as CSV/Excel
- [ ] Scheduled reports via email

**Data Retention:**
- [ ] Configure auto-delete rules
- [ ] GDPR compliance tools
- [ ] Legal data exports

---

## Feature Availability by Role

| Feature | super_admin | admin | moderator | support |
|---------|-------------|-------|-----------|---------|
| **Dashboard** | ✅ | ✅ | ❌ | ✅ |
| **View Users** | ✅ | ✅ | ❌ | ✅ |
| **Ban Users** | ✅ | ✅ | ❌ | ❌ |
| **Moderate Content** | ✅ | ✅ | ✅ | ❌ |
| **View Audit Logs** | ✅ All | ✅ Own | ✅ Own | ✅ Own |
| **Manage Admins** | ✅ | ❌ | ❌ | ❌ |
| **System Settings** | ✅ | ❌ | ❌ | ❌ |

---

**Document Version:** 1.0.0
**Last Updated:** December 28, 2024
**Feature Count:** 20+ features (MVP) + 30+ planned features
