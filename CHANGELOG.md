# Changelog

All notable changes to the Wheelbase Admin Panel will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned for BACKOFFICE-002 (Q1-Q2 2025)

#### Advanced Analytics
- Custom date range selector for all charts
- User retention cohort analysis
- Geographic distribution map
- Device breakdown (iOS vs Android)
- Export analytics to CSV/PDF
- Scheduled daily/weekly/monthly reports

#### System Health Monitoring
- Edge Function performance metrics (response times, error rates)
- Database query performance monitoring
- Storage usage metrics
- Real-time alerts for system issues
- Uptime monitoring dashboard

#### Push Notification Broadcasting
- Send notifications to all users
- Send to specific user segments (location, device, subscription)
- Schedule notifications for later delivery
- Notification templates with variables
- A/B testing for notification variants
- Delivery and engagement analytics

#### Support Ticket Management
- Ticket queue with filtering
- Ticket detail page with full history
- Reply to users (email + in-app notification)
- Canned responses for common queries
- SLA tracking and alerts
- Internal notes (admin-only)

#### Enhanced Audit Logging
- Advanced audit log search and filtering
- Export audit logs to CSV
- Permission management UI
- Admin user management (view, create, deactivate)
- Role assignment UI

#### Data Export
- Export users to CSV/JSON/Excel
- Export content (posts, rides, groups)
- Export analytics as PNG/PDF
- GDPR data retention tools
- Automated scheduled exports

---

## [1.0.0] - 2024-12-27

### Added - MVP Release (BACKOFFICE-001)

#### Authentication & Authorization
- Email/password login with form validation
- Google OAuth 2.0 integration
- JWT-based session management (1 hour access token, 7 day refresh token)
- Role-based access control (super_admin, admin, moderator, support)
- Auth guard for route protection
- Admin role guard for permission-based access
- Automatic session timeout and redirect to login

#### Dashboard
- Analytics metrics cards:
  - Total Users (all-time count)
  - Daily Active Users (DAU) - last 24 hours
  - Monthly Active Users (MAU) - last 30 days
  - Rides This Month - current month count
- Sparkline charts for trend visualization
- Subscription tier distribution (doughnut chart)
- 7-day ride activity chart (line chart)
- Recent users table (5 most recent signups)
- Auto-refresh every 30 seconds
- Loading skeleton states
- Error handling with toast notifications

#### User Management
- User list table with PrimeNG DataTable
  - Pagination (25 users per page)
  - Search by email or username
  - Filter by status (all/active/banned)
  - Sort by columns (join date, reputation)
- User detail page showing:
  - Profile information (name, email, bio, location)
  - User statistics (total rides, posts, followers, following)
  - Reputation score and tier (Free/Pro/Premium)
  - Registered motorcycles
  - Account status (active/banned)
  - Join date and last active
- Ban user action with required reason
- Unban user action
- Toast notifications for all actions
- Audit logging for ban/unban actions

#### Content Moderation
- Flagged content queue table
  - Display flagged posts and comments
  - Filter by content type (all/posts/comments)
  - Show flag reason and reporter info
  - Content preview in table
- Content preview dialog (full post/comment view)
- Approve content action (clear flag)
- Remove content action (delete permanently)
- Confirmation dialogs for all moderation actions
- Toast notifications for success/error

#### UI/UX
- Responsive layouts for desktop, tablet, mobile
- Dark theme with yellow accents (#FFD535)
- Modern glassmorphism design (blur backgrounds)
- Sidebar navigation with active route highlighting
- Top header with user profile and logout
- Loading states with PrimeNG ProgressSpinner
- Error states with retry buttons
- Toast notifications for all user actions
- Relative time pipe ("2 hours ago" formatting)

#### Backend Integration
- 9 Supabase Edge Functions deployed:
  - `admin-login` - Authentication
  - `admin-verify-session` - Session validation
  - `admin-get-users` - Paginated user list
  - `admin-get-user-detail` - User profile
  - `admin-ban-user` - Ban with audit log
  - `admin-unban-user` - Unban with audit log
  - `admin-analytics-dashboard` - Dashboard metrics
  - `admin-get-flagged-content` - Moderation queue
  - `admin-moderate-content` - Approve/remove content
- Supabase client integration (@supabase/supabase-js)
- Generic API service for Edge Function calls
- Typed responses with error handling

#### Database
- `admin_users` table with role system
- `admin_audit_logs` table (immutable audit trail)
- `users` table ban tracking fields
- `posts` and `comments` moderation flags
- PostgreSQL functions: `get_dau()`, `get_mau()`
- Row-Level Security (RLS) policies on all admin tables

#### Security
- HTTPS enforced (TLS 1.3)
- Security headers configured:
  - Content-Security-Policy
  - Strict-Transport-Security
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
- CORS whitelisting (admin.ridewheelbase.app)
- JWT RS256 signature verification
- RLS policies prevent unauthorized data access
- Audit logging for all admin actions
- IP address and user agent tracking

#### Developer Experience
- Angular 20 standalone components
- TypeScript strict mode enabled
- PrimeNG 20 component library
- TailwindCSS 3 utility classes
- Chart.js 4 for data visualization
- ESLint + Prettier configured
- Vercel deployment configuration
- Environment-based configuration (dev/prod)

### Changed
- Migrated from NgModules to standalone components
- Updated to Angular 20 (from Angular 18)
- Switched to Signals for reactive state (from RxJS BehaviorSubjects)

### Fixed
- Bundle size optimization (tree-shaking enabled)
- Chart memory leaks (destroy on component unmount)
- Auto-refresh interval cleanup on destroy
- Form validation edge cases
- Toast notification z-index issues

---

## [0.2.0] - 2024-12-20

### Added - Project Setup Phase
- Initialized Angular 20 project with standalone architecture
- Installed dependencies (PrimeNG, Supabase, Chart.js, TailwindCSS)
- Configured TailwindCSS with PrimeNG integration
- Created environment files (development and production)
- Set up Vercel deployment configuration
- Configured security headers in vercel.json
- Created project directory structure

### Changed
- Updated package.json with all required dependencies
- Configured angular.json build settings
- Set up tsconfig.json with strict mode

---

## [0.1.0] - 2024-12-15

### Added - Backend Infrastructure Phase
- Created database migration `20250101_admin_panel_mvp.sql`:
  - `admin_users` table with roles (super_admin, admin, moderator, support)
  - `admin_audit_logs` table for complete audit trail
  - Modified `users` table with ban tracking fields
  - Modified `posts` and `comments` with moderation flags
  - Created analytics functions (`get_dau()`, `get_mau()`)
  - Enabled RLS policies on all admin tables

- Deployed 9 Supabase Edge Functions:
  - `admin-login` (email/password authentication)
  - `admin-verify-session` (JWT validation)
  - `admin-get-users` (paginated user list)
  - `admin-get-user-detail` (user profile details)
  - `admin-ban-user` (ban with reason + audit)
  - `admin-unban-user` (remove ban + audit)
  - `admin-analytics-dashboard` (DAU, MAU, rides)
  - `admin-get-flagged-content` (moderation queue)
  - `admin-moderate-content` (approve/remove content)

- Configured Google OAuth in Supabase:
  - Created admin-specific OAuth client
  - Set callback URL: admin.ridewheelbase.app/auth/callback
  - Configured admin scopes

- Created super admin user:
  - Email: lexphicableme@gmail.com
  - Role: super_admin
  - Full permissions

- Updated CORS configuration:
  - Added admin.ridewheelbase.app
  - Added localhost:4200 for development

### Security
- Implemented JWT RS256 authentication
- Enabled RLS on all admin tables
- Created audit logging system
- Configured secure password hashing (bcrypt)

---

## Version History Summary

| Version | Release Date | Milestone | Status |
|---------|--------------|-----------|--------|
| 1.0.0   | 2024-12-27   | MVP Complete (BACKOFFICE-001) | ✅ Ready for Deployment |
| 0.2.0   | 2024-12-20   | Project Setup | ✅ Complete |
| 0.1.0   | 2024-12-15   | Backend Infrastructure | ✅ Complete |

---

## Deprecation Notices

None at this time.

---

## Breaking Changes

None at this time (initial release).

---

## Migration Guides

### Upgrading from 0.x to 1.0.0

No migration required - this is the initial release.

---

## Known Issues

### Non-Critical Issues

1. **Bundle Size Warning**
   - Main bundle exceeds budget by 126 KB (1.63 MB vs 1.50 MB target)
   - **Impact:** Low - acceptable for admin panel
   - **Fix:** Planned for future with lazy loading
   - **Tracking:** #1

2. **SCSS File Size Warnings**
   - login.component.scss exceeds 4 KB budget by 2.28 KB
   - dashboard.component.scss exceeds 4 KB budget by 1.03 KB
   - **Impact:** Negligible
   - **Fix:** Planned for future - extract common styles
   - **Tracking:** #2

---

## Future Roadmap

### Version 2.0.0 - BACKOFFICE-002 (Q1-Q2 2025)
- Advanced analytics with custom date ranges
- System health monitoring dashboard
- Push notification broadcasting
- Support ticket management system
- Enhanced audit logging and reporting
- Data export capabilities (CSV, PDF, Excel)

### Version 2.1.0 - Security Enhancements (Q2 2025)
- Two-Factor Authentication (2FA)
- IP whitelisting
- Session activity monitoring
- Advanced permission management

### Version 2.2.0 - Performance Optimizations (Q2 2025)
- Lazy loading for all feature modules
- Service worker for offline support
- Advanced caching strategies
- Bundle size optimization (<1.5 MB)

### Version 3.0.0 - Mobile App (Q3 2025)
- Native iOS app for admin panel
- Native Android app for admin panel
- Push notifications for admin alerts

---

## Support

For questions, bug reports, or feature requests:
- **Technical Support:** lexphicableme@gmail.com
- **Documentation:** See README.md, ARCHITECTURE.md, FEATURES.md
- **Backend Docs:** `FLUTTER_APP/supabase/ADMIN_GOOGLE_OAUTH_SETUP.md`

---

## Contributors

**Development:**
- Claude Code (AI Assistant) - Full-stack implementation

**Product Owner:**
- Lex Caraig (Co+Lab Digital Solutions)

**Super Admin:**
- Lex Caraig (lexphicableme@gmail.com)

---

## License

Proprietary - Co+Lab Digital Solutions
All rights reserved.

---

**Changelog Version:** 1.0.0
**Last Updated:** December 28, 2024
**Format:** Based on [Keep a Changelog](https://keepachangelog.com/)
