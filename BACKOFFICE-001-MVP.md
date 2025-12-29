# BACKOFFICE-001: Wheelbase Admin Panel MVP

**Type:** Feature
**Priority:** Medium
**Status:** Planned
**Created:** December 9, 2024
**Estimated Duration:** 7-10 days (2 weeks)
**Target Completion:** After Mobile App Launch (Q1 2025)

---

## 📋 Overview

Build a minimal viable product (MVP) admin panel for Wheelbase to enable basic user management, content moderation, and analytics. This MVP provides essential administrative capabilities without the full complexity of the complete backoffice.

**Goal:** Enable Co+Lab team to manage Wheelbase platform with core admin features.

---

## 🎯 Success Criteria

-   [ ] Admins can log in securely with role-based access
-   [ ] Admins can view, search, and ban/unban users
-   [ ] Admins can view basic analytics (DAU, MAU, ride stats)
-   [ ] Admins can view flagged content queue
-   [ ] System deployed to production (admin.ridewheelbase.app)

---

## 📦 Deliverables

### 1. **Authentication & Authorization** (2-3 days)

**Features:**

-   [ ] Admin login page (email + password)
-   [ ] JWT-based authentication via Supabase
-   [ ] Role verification (only `admin`, `moderator`, `super_admin` can access)
-   [ ] Route guards to protect admin routes
-   [ ] Logout functionality

**Components:**

```
src/app/
├── core/
│   └── auth/
│       ├── auth.service.ts       # Supabase auth wrapper
│       ├── auth.guard.ts         # Route protection
│       └── login.component.ts    # Login page
```

**Acceptance Criteria:**

-   ✅ Only users with admin roles can log in
-   ✅ Non-admin users see "Unauthorized" error
-   ✅ Session persists across page reloads
-   ✅ Logout clears session

**Edge Function:**

```typescript
// supabase/functions/admin/verify-admin-role.ts
// Returns user role from JWT claims
```

---

### 2. **User Management** (3-4 days)

**Features:**

-   [ ] User list table (paginated, 25 per page)
-   [ ] Search users by name, email, username
-   [ ] Sort by join date, last active, location
-   [ ] View user details (profile, stats, activity)
-   [ ] Ban user (with reason)
-   [ ] Unban user
-   [ ] View banned users list

**Components:**

```
src/app/features/users/
├── users-list/
│   └── users-list.component.ts   # PrimeNG table
├── user-detail/
│   └── user-detail.component.ts  # User profile view
├── users.service.ts              # API calls
└── users.routes.ts
```

**PrimeNG Components Used:**

-   `p-table` - User list with pagination, sorting, filtering
-   `p-button` - Action buttons (View, Ban)
-   `p-tag` - Status badges (Active, Banned)
-   `p-dialog` - Ban user confirmation modal

**API Endpoints:**

```typescript
// supabase/functions/admin/get-users-paginated.ts
GET /admin/get-users-paginated
Query: { page: number, limit: number, search?: string, sort?: string }
Response: { users: User[], total: number }

// supabase/functions/admin/ban-user.ts
POST /admin/ban-user
Body: { userId: string, reason: string }
Response: { success: boolean }

// supabase/functions/admin/unban-user.ts
POST /admin/unban-user
Body: { userId: string }
Response: { success: boolean }
```

**Database Changes:**

```sql
-- Add ban tracking to users table
ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN ban_reason TEXT;
ALTER TABLE users ADD COLUMN banned_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN banned_by UUID REFERENCES admin_users(id);

-- Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'support')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
```

**Acceptance Criteria:**

-   ✅ Table shows 25 users per page with pagination
-   ✅ Search filters users in real-time
-   ✅ Banned users show red badge
-   ✅ Ban action shows confirmation dialog
-   ✅ Ban reason is required and saved
-   ✅ Unban restores user access immediately

---

### 3. **Basic Analytics Dashboard** (2-3 days)

**Features:**

-   [ ] Dashboard overview page
-   [ ] Key metrics cards:
    -   Total users
    -   Daily active users (DAU)
    -   Monthly active users (MAU)
    -   Total rides this month
    -   Total distance tracked (km)
-   [ ] User growth chart (last 30 days)
-   [ ] Ride activity chart (last 7 days)

**Components:**

```
src/app/features/dashboard/
├── dashboard.component.ts        # Main dashboard
├── stat-card.component.ts        # Reusable stat card
├── user-chart.component.ts       # PrimeNG chart
└── dashboard.service.ts          # Analytics API
```

**PrimeNG Components Used:**

-   `p-chart` - Line charts for user growth, ride activity
-   `p-card` - Stat cards

**Spartan UI Components Used:**

-   `hlmCard` - Dashboard stat cards (alternative to PrimeNG)

**API Endpoints:**

```typescript
// supabase/functions/admin/analytics-dashboard.ts
GET /admin/analytics-dashboard
Response: {
  totalUsers: number,
  dau: number,
  mau: number,
  totalRidesThisMonth: number,
  totalDistanceKm: number,
  userGrowth: { date: string, count: number }[],
  rideActivity: { date: string, count: number }[]
}
```

**Database Queries:**

```sql
-- Daily Active Users (last 24 hours)
SELECT COUNT(DISTINCT user_id) as dau
FROM user_activity_logs
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Monthly Active Users (last 30 days)
SELECT COUNT(DISTINCT user_id) as mau
FROM user_activity_logs
WHERE created_at > NOW() - INTERVAL '30 days';

-- User growth (last 30 days)
SELECT DATE(created_at) as date, COUNT(*) as count
FROM users
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

**Acceptance Criteria:**

-   ✅ Dashboard loads in <2 seconds
-   ✅ All metrics display correctly
-   ✅ Charts render without errors
-   ✅ Real-time updates (refresh every 30 seconds)

---

### 4. **Content Moderation Queue** (1-2 days)

**Features:**

-   [ ] View flagged posts queue
-   [ ] Filter by content type (posts, comments)
-   [ ] Approve flagged content (remove flag)
-   [ ] Remove content (delete post/comment)
-   [ ] Ban user who posted flagged content

**Components:**

```
src/app/features/moderation/
├── content-queue/
│   └── content-queue.component.ts  # Flagged content list
└── moderation.service.ts
```

**PrimeNG Components Used:**

-   `p-table` - Flagged content table
-   `p-button` - Approve/Remove actions
-   `p-tag` - Content type badges

**API Endpoints:**

```typescript
// supabase/functions/admin/get-flagged-content.ts
GET /admin/get-flagged-content
Query: { page: number, limit: number, type?: 'post' | 'comment' }
Response: { content: FlaggedContent[], total: number }

// supabase/functions/admin/moderate-content.ts
POST /admin/moderate-content
Body: { contentId: string, action: 'approve' | 'remove', type: 'post' | 'comment' }
Response: { success: boolean }
```

**Database Changes:**

```sql
-- Add moderation flags to posts
ALTER TABLE posts ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN flag_reason TEXT;
ALTER TABLE posts ADD COLUMN flagged_at TIMESTAMPTZ;

-- Add moderation flags to comments
ALTER TABLE comments ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN flag_reason TEXT;
ALTER TABLE comments ADD COLUMN flagged_at TIMESTAMPTZ;
```

**Acceptance Criteria:**

-   ✅ Queue shows all flagged content
-   ✅ Approve action clears flag
-   ✅ Remove action deletes content
-   ✅ User can be banned directly from queue

---

### 5. **Deployment** (1 day)

**Tasks:**

-   [ ] Set up Vercel project
-   [ ] Configure environment variables
-   [ ] Deploy to `admin.ridewheelbase.app`
-   [ ] Set up custom domain
-   [ ] Configure security headers (CSP, HSTS)
-   [ ] Test production deployment

**Environment Variables:**

```bash
VITE_SUPABASE_URL=https://hvwpdiyrqonuaomwkuxk.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_ENVIRONMENT=production
```

**Vercel Configuration:**

```json
{
	"framework": "angular",
	"buildCommand": "ng build --configuration production",
	"outputDirectory": "dist/wheelbase-admin/browser",
	"installCommand": "npm ci",
	"headers": [
		{
			"source": "/(.*)",
			"headers": [
				{ "key": "X-Frame-Options", "value": "DENY" },
				{ "key": "X-Content-Type-Options", "value": "nosniff" },
				{
					"key": "Strict-Transport-Security",
					"value": "max-age=31536000"
				}
			]
		}
	]
}
```

**Acceptance Criteria:**

-   ✅ Admin panel accessible at https://admin.ridewheelbase.app
-   ✅ HTTPS enforced
-   ✅ All security headers present
-   ✅ No console errors

---

## 🛠️ Technical Stack

**Frontend:**

-   Angular 17+ (Standalone Components)
-   PrimeNG 17+ (UI components)
-   Spartan UI (shadcn-like components)
-   TailwindCSS (styling)
-   RxJS (state management)

**Backend:**

-   Supabase Edge Functions (Deno)
-   PostgreSQL (existing database)
-   Supabase Auth (JWT)

**Deployment:**

-   Vercel (hosting)
-   Custom domain: admin.ridewheelbase.app

**See:** `docs/08-backoffice/STACK.md` for full stack details

---

## 📊 Database Schema Changes

### **New Tables:**

```sql
-- Admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'support')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- RLS Policy
CREATE POLICY "Admin only access"
ON admin_users
FOR ALL
USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'moderator'));
```

### **Table Modifications:**

```sql
-- Users table
ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN ban_reason TEXT;
ALTER TABLE users ADD COLUMN banned_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN banned_by UUID REFERENCES admin_users(id);

-- Posts table
ALTER TABLE posts ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN flag_reason TEXT;
ALTER TABLE posts ADD COLUMN flagged_at TIMESTAMPTZ;

-- Comments table
ALTER TABLE comments ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN flag_reason TEXT;
ALTER TABLE comments ADD COLUMN flagged_at TIMESTAMPTZ;
```

---

## 🔒 Security Considerations

### **Authentication:**

-   ✅ JWT-based auth via Supabase
-   ✅ Role verification on every request
-   ✅ Short session timeout (30 minutes)
-   ✅ 2FA recommended (not MVP requirement)

### **Authorization:**

-   ✅ Route guards prevent unauthorized access
-   ✅ RLS policies on all admin tables
-   ✅ Edge Functions verify admin role

### **Data Protection:**

-   ✅ HTTPS enforced
-   ✅ Security headers (CSP, HSTS, X-Frame-Options)
-   ✅ No sensitive data in client-side code
-   ✅ Angular's built-in XSS protection

---

## 📈 Success Metrics

**Development:**

-   [ ] All 5 features delivered
-   [ ] Zero critical bugs
-   [ ] <2 second page load time
-   [ ] Deployed to production

**Usage (Post-Launch):**

-   [ ] 100% admin login success rate
-   [ ] <1 second search response time
-   [ ] Zero unauthorized access attempts

---

## 🚀 Next Steps (After MVP)

**If MVP is successful, proceed to:** `BACKOFFICE-002-COMPLETE.md`

**Additional features for complete backoffice:**

-   Advanced analytics (revenue, retention, cohorts)
-   System health monitoring
-   Push notification broadcasting
-   Support ticket management
-   Audit logging
-   Export data (CSV, JSON)

---

## 📚 References

**Documentation:**

-   Stack: `docs/08-backoffice/STACK.md`
-   Schema: `supabase/migrations/schema.sql`
-   Edge Functions: `supabase/functions/`

**Related Tickets:**

-   `BACKOFFICE-002-COMPLETE.md` - Complete backoffice (post-MVP)

**External:**

-   [PrimeNG Table Docs](https://primeng.org/table)
-   [Angular Router Guards](https://angular.dev/guide/routing/common-router-tasks#preventing-unauthorized-access)
-   [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**Created:** December 9, 2024
**Last Updated:** December 9, 2024
**Assigned To:** TBD (Post Mobile Launch)
**Blocked By:** None
**Blocks:** `BACKOFFICE-002-COMPLETE.md`
