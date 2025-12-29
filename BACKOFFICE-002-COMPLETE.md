# BACKOFFICE-002: Wheelbase Admin Panel - Complete System

**Type:** Feature
**Priority:** Medium
**Status:** Planned
**Created:** December 9, 2024
**Estimated Duration:** 4-5 weeks
**Target Completion:** Q1-Q2 2025
**Depends On:** `BACKOFFICE-001-MVP.md`

---

## 📋 Overview

Build a comprehensive admin panel for Wheelbase with advanced features beyond the MVP. This includes advanced analytics, system health monitoring, push notification broadcasting, support management, and audit logging.

**Goal:** Provide Co+Lab team with enterprise-grade administrative tools to manage Wheelbase at scale.

---

## 🎯 Success Criteria

- [ ] All MVP features stable and in production
- [ ] Advanced analytics with custom date ranges and exports
- [ ] Real-time system health monitoring with alerts
- [ ] Push notification broadcasting to user segments
- [ ] Support ticket management system
- [ ] Complete audit logging of all admin actions
- [ ] Data export capabilities (CSV, JSON)
- [ ] Role-based permissions (super_admin, admin, moderator, support)

---

## 📦 Phase Breakdown

### **Phase 1: Advanced Analytics** (Week 1)

**Features:**
- [ ] **User Metrics:**
  - User growth trends (daily, weekly, monthly)
  - User retention cohort analysis
  - Geographic distribution map
  - Device breakdown (iOS vs Android)
  - Active users by time of day

- [ ] **Ride Analytics:**
  - Total rides and distance over time
  - Average ride duration and distance
  - Popular routes (most frequently ridden)
  - Ride participation trends
  - Group ride vs solo ride breakdown

- [ ] **Social Metrics:**
  - Post engagement rates (likes, comments, shares)
  - Trending hashtags
  - Most active users (top contributors)
  - Network growth (followers, friends)

- [ ] **Revenue Analytics:** (if monetization implemented)
  - Subscription revenue trends
  - Marketplace commission earnings
  - Churn rate
  - Customer lifetime value (CLTV)

- [ ] **Custom Dashboards:**
  - Date range selector (last 7/30/90 days, custom)
  - Chart type selector (line, bar, pie)
  - Export to CSV/PDF
  - Save custom dashboard layouts

**Components:**
```
src/app/features/analytics/
├── user-metrics/
│   ├── user-growth-chart.component.ts
│   ├── retention-cohort.component.ts
│   └── geographic-map.component.ts
├── ride-stats/
│   ├── ride-trends-chart.component.ts
│   └── popular-routes.component.ts
├── social-metrics/
│   ├── engagement-chart.component.ts
│   └── trending-hashtags.component.ts
├── revenue/
│   ├── revenue-chart.component.ts
│   └── churn-analysis.component.ts
└── analytics.service.ts
```

**PrimeNG Components:**
- `p-chart` - All charts (line, bar, pie, doughnut)
- `p-calendar` - Date range picker
- `p-dropdown` - Chart type selector
- `p-button` - Export buttons

**Third-Party Libraries:**
```bash
npm install chart.js ng2-charts
npm install jspdf jspdf-autotable  # PDF export
npm install papaparse  # CSV export
```

**API Endpoints:**
```typescript
// supabase/functions/admin/analytics-users.ts
GET /admin/analytics-users
Query: { startDate: string, endDate: string }
Response: { growth: [], retention: [], distribution: {} }

// supabase/functions/admin/analytics-rides.ts
GET /admin/analytics-rides
Query: { startDate: string, endDate: string }
Response: { trends: [], popular: [], participation: {} }

// supabase/functions/admin/analytics-social.ts
GET /admin/analytics-social
Query: { startDate: string, endDate: string }
Response: { engagement: [], hashtags: [], topUsers: [] }
```

**Acceptance Criteria:**
- ✅ All charts load in <3 seconds
- ✅ Date range updates charts dynamically
- ✅ Export to CSV downloads correctly formatted file
- ✅ Custom dashboards save to user preferences

---

### **Phase 2: System Health Monitoring** (Week 2)

**Features:**
- [ ] **Edge Function Monitoring:**
  - Response times (p50, p95, p99)
  - Error rates by function
  - Request volume trends
  - Function invocation costs

- [ ] **Database Health:**
  - Query performance (slow queries)
  - Connection pool usage
  - Table sizes and growth
  - Index usage statistics

- [ ] **Storage Metrics:**
  - Total storage used (by bucket)
  - Upload/download bandwidth
  - Storage costs

- [ ] **Real-time Alerts:**
  - Error rate threshold exceeded
  - Response time degradation
  - Database connection pool maxed out
  - Storage quota approaching limit

- [ ] **Uptime Monitoring:**
  - Service availability (%)
  - Incident history
  - Mean time to recovery (MTTR)

**Components:**
```
src/app/features/system-health/
├── edge-functions/
│   ├── function-performance.component.ts
│   └── function-errors.component.ts
├── database/
│   ├── query-performance.component.ts
│   └── table-stats.component.ts
├── storage/
│   └── storage-metrics.component.ts
├── alerts/
│   └── alerts-list.component.ts
└── health.service.ts
```

**PrimeNG Components:**
- `p-chart` - Performance trends
- `p-table` - Slow queries, error logs
- `p-badge` - Alert counts
- `p-toast` - Real-time alert notifications

**API Endpoints:**
```typescript
// supabase/functions/admin/health-edge-functions.ts
GET /admin/health-edge-functions
Response: { functions: [], metrics: {} }

// supabase/functions/admin/health-database.ts
GET /admin/health-database
Response: { slowQueries: [], poolUsage: number, tables: [] }

// supabase/functions/admin/health-storage.ts
GET /admin/health-storage
Response: { buckets: [], totalUsage: number, bandwidth: {} }
```

**Real-time Updates:**
```typescript
// Use Supabase Realtime for live monitoring
this.supabase
  .channel('system-health')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'system_logs' },
    payload => this.updateHealthMetrics(payload)
  )
  .subscribe();
```

**Acceptance Criteria:**
- ✅ Metrics update every 30 seconds
- ✅ Alerts trigger within 1 minute of threshold breach
- ✅ Historical data available for last 7 days
- ✅ Slow queries identified correctly

---

### **Phase 3: Push Notification Broadcasting** (Week 2)

**Features:**
- [ ] **Broadcast Notifications:**
  - Send to all users
  - Send to specific user segment (location, device, subscription)
  - Schedule notifications for later
  - A/B test notification variants

- [ ] **Notification Templates:**
  - Save reusable templates
  - Variables/placeholders ({{username}}, {{date}})
  - Preview before sending

- [ ] **Targeting:**
  - By location (country, city)
  - By user activity (active, dormant)
  - By subscription status (free, premium)
  - By device (iOS, Android)

- [ ] **Analytics:**
  - Delivery rate
  - Open rate
  - Click-through rate (if deep link)
  - Conversion rate

**Components:**
```
src/app/features/notifications/
├── broadcast/
│   ├── create-broadcast.component.ts
│   ├── schedule-notification.component.ts
│   └── notification-preview.component.ts
├── templates/
│   ├── template-list.component.ts
│   └── template-editor.component.ts
├── targeting/
│   └── audience-selector.component.ts
├── analytics/
│   └── notification-stats.component.ts
└── notifications.service.ts
```

**PrimeNG Components:**
- `p-editor` - Rich text notification editor
- `p-calendar` - Schedule date/time picker
- `p-multiSelect` - Audience targeting
- `p-chart` - Notification analytics

**API Endpoints:**
```typescript
// supabase/functions/admin/send-broadcast.ts
POST /admin/send-broadcast
Body: {
  title: string,
  body: string,
  audience: { location?: string, device?: string, active?: boolean },
  deepLink?: string,
  schedule?: string  // ISO timestamp
}
Response: { broadcastId: string, estimatedRecipients: number }

// supabase/functions/admin/notification-stats.ts
GET /admin/notification-stats
Query: { broadcastId: string }
Response: { delivered: number, opened: number, clicked: number }
```

**Database Changes:**
```sql
-- Broadcast notifications table
CREATE TABLE broadcast_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES admin_users(id) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience JSONB NOT NULL,
  deep_link TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipients_count INT,
  delivered_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification templates table
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB,  -- e.g., ["username", "date"]
  created_by UUID REFERENCES admin_users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Acceptance Criteria:**
- ✅ Broadcast sent to correct audience segment
- ✅ Scheduled notifications send at exact time
- ✅ Templates save and load correctly
- ✅ Analytics update within 5 minutes

---

### **Phase 4: Support Ticket Management** (Week 3)

**Features:**
- [ ] **Ticket Queue:**
  - View all open tickets
  - Filter by status (new, in_progress, resolved)
  - Filter by priority (low, medium, high, urgent)
  - Assign to team member

- [ ] **Ticket Details:**
  - User info (name, email, join date)
  - Ticket history (all messages)
  - Internal notes (not visible to user)
  - Attachments (screenshots)

- [ ] **Ticket Actions:**
  - Reply to user (sends email + in-app notification)
  - Mark as resolved
  - Escalate to senior admin
  - Merge duplicate tickets

- [ ] **Canned Responses:**
  - Save frequently used replies
  - Insert canned response into ticket

- [ ] **SLA Tracking:**
  - First response time
  - Resolution time
  - SLA breach alerts

**Components:**
```
src/app/features/support/
├── ticket-queue/
│   └── ticket-queue.component.ts
├── ticket-detail/
│   ├── ticket-detail.component.ts
│   ├── ticket-history.component.ts
│   └── reply-editor.component.ts
├── canned-responses/
│   └── canned-responses.component.ts
└── support.service.ts
```

**PrimeNG Components:**
- `p-table` - Ticket queue
- `p-editor` - Reply editor
- `p-timeline` - Ticket history
- `p-fileUpload` - Attachment uploads

**API Endpoints:**
```typescript
// supabase/functions/admin/support-tickets.ts
GET /admin/support-tickets
Query: { status?: string, priority?: string, assignee?: string }
Response: { tickets: Ticket[], total: number }

// supabase/functions/admin/reply-ticket.ts
POST /admin/reply-ticket
Body: { ticketId: string, message: string, internal?: boolean }
Response: { success: boolean }

// supabase/functions/admin/update-ticket.ts
PATCH /admin/update-ticket
Body: { ticketId: string, status?: string, assignee?: string, priority?: string }
Response: { success: boolean }
```

**Database Changes:**
```sql
-- Support tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES admin_users(id),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket messages table
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) NOT NULL,
  sender_id UUID NOT NULL,  -- Can be user or admin
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,  -- Internal notes
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canned responses table
CREATE TABLE canned_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_by UUID REFERENCES admin_users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Acceptance Criteria:**
- ✅ All tickets visible in queue
- ✅ Reply sends email + in-app notification to user
- ✅ Internal notes only visible to admins
- ✅ SLA breach alerts trigger correctly

---

### **Phase 5: Audit Logging & Permissions** (Week 4)

**Features:**
- [ ] **Audit Logging:**
  - Log all admin actions (create, update, delete)
  - Log user bans/unbans
  - Log content moderation actions
  - Log notification broadcasts
  - Log ticket replies

- [ ] **Audit Log Viewer:**
  - Search by admin user
  - Filter by action type
  - Filter by date range
  - Export audit logs

- [ ] **Role-Based Permissions:**
  - **Super Admin:** Full access to everything
  - **Admin:** User management, content moderation, analytics
  - **Moderator:** Content moderation only
  - **Support:** Support tickets only (read-only analytics)

- [ ] **Permission Management:**
  - View all admin users
  - Assign/revoke roles
  - Deactivate admin accounts

**Components:**
```
src/app/features/audit/
├── audit-log-viewer/
│   └── audit-log-viewer.component.ts
├── admin-users/
│   ├── admin-users-list.component.ts
│   └── admin-user-detail.component.ts
└── audit.service.ts
```

**PrimeNG Components:**
- `p-table` - Audit log table with filtering
- `p-timeline` - Action history
- `p-dropdown` - Role selector

**API Endpoints:**
```typescript
// supabase/functions/admin/audit-logs.ts
GET /admin/audit-logs
Query: { adminId?: string, action?: string, startDate?: string, endDate?: string }
Response: { logs: AuditLog[], total: number }

// supabase/functions/admin/admin-users.ts
GET /admin/admin-users
Response: { admins: AdminUser[] }

// supabase/functions/admin/update-admin-role.ts
PATCH /admin/update-admin-role
Body: { adminId: string, role: string }
Response: { success: boolean }
```

**Database Changes:**
```sql
-- Audit logs table
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES admin_users(id) NOT NULL,
  action TEXT NOT NULL,  -- 'ban_user', 'delete_post', 'send_broadcast', etc.
  resource_type TEXT NOT NULL,  -- 'user', 'post', 'notification', etc.
  resource_id TEXT,  -- ID of affected resource
  details JSONB,  -- Additional context
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Admins can read all logs, but cannot modify
CREATE POLICY "Admins can read audit logs"
ON admin_audit_logs
FOR SELECT
USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin', 'moderator', 'support'));

CREATE POLICY "Only system can write audit logs"
ON admin_audit_logs
FOR INSERT
WITH CHECK (false);  -- Enforced via Edge Functions only
```

**Automatic Audit Logging:**
```typescript
// core/services/audit.service.ts
@Injectable({ providedIn: 'root' })
export class AuditService {
  async logAction(action: string, resourceType: string, resourceId: string, details?: any) {
    await this.supabase.rpc('create_audit_log', {
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details
    });
  }
}

// Usage in components:
async banUser(userId: string, reason: string) {
  await this.usersService.banUser(userId, reason);
  await this.auditService.logAction('ban_user', 'user', userId, { reason });
}
```

**Acceptance Criteria:**
- ✅ All admin actions logged automatically
- ✅ Logs immutable (cannot be deleted or edited)
- ✅ Audit log viewer shows complete history
- ✅ Role permissions enforced correctly

---

### **Phase 6: Data Export & Reporting** (Week 5)

**Features:**
- [ ] **Export Users:**
  - Export all users to CSV
  - Export filtered users (by location, join date, status)
  - Include user stats (total rides, posts, followers)

- [ ] **Export Content:**
  - Export all posts (with engagement metrics)
  - Export all marketplace listings
  - Export all group rides

- [ ] **Export Analytics:**
  - Export dashboard charts as PNG/PDF
  - Export analytics data as CSV
  - Scheduled reports (daily/weekly/monthly)

- [ ] **Data Retention:**
  - Configure auto-delete rules (GDPR compliance)
  - Export deleted user data (for legal compliance)

**Components:**
```
src/app/features/exports/
├── export-users/
│   └── export-users.component.ts
├── export-content/
│   └── export-content.component.ts
├── export-analytics/
│   └── export-analytics.component.ts
└── exports.service.ts
```

**PrimeNG Components:**
- `p-button` - Export buttons
- `p-progressBar` - Export progress
- `p-calendar` - Date range for filtered exports

**API Endpoints:**
```typescript
// supabase/functions/admin/export-users.ts
POST /admin/export-users
Body: { filters?: {}, format: 'csv' | 'json' }
Response: { downloadUrl: string }

// supabase/functions/admin/export-analytics.ts
POST /admin/export-analytics
Body: { chartType: string, startDate: string, endDate: string }
Response: { downloadUrl: string }
```

**Libraries:**
```bash
npm install papaparse  # CSV export
npm install jspdf jspdf-autotable  # PDF export
npm install xlsx  # Excel export
```

**Acceptance Criteria:**
- ✅ CSV exports download with correct formatting
- ✅ Large exports (10K+ rows) don't timeout
- ✅ PDF charts render correctly
- ✅ Scheduled reports send via email

---

## 🛠️ Technical Stack

**Same as MVP - See:** `docs/08-backoffice/STACK.md`

**Additional Dependencies:**
```json
{
  "dependencies": {
    "chart.js": "^4.4.0",
    "ng2-charts": "^5.0.0",
    "papaparse": "^5.4.1",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.0",
    "xlsx": "^0.18.5"
  }
}
```

---

## 🔒 Security Enhancements

### **IP Whitelisting** (Optional)
```typescript
// Restrict admin access to office IPs
const ALLOWED_IPS = ['203.0.113.0/24', '198.51.100.0/24'];

export const ipWhitelistGuard: CanActivateFn = async () => {
  const userIp = await fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => data.ip);

  if (!ALLOWED_IPS.some(range => isIpInRange(userIp, range))) {
    return router.parseUrl('/unauthorized');
  }

  return true;
};
```

### **2FA (Two-Factor Authentication)**
```typescript
// Enable 2FA for all admin users
async enableTwoFactor(adminId: string) {
  const secret = speakeasy.generateSecret();
  await this.supabase
    .from('admin_users')
    .update({ two_factor_secret: secret.base32 })
    .eq('id', adminId);

  return { qrCode: secret.otpauth_url };
}

async verifyTwoFactor(adminId: string, token: string): Promise<boolean> {
  const { data } = await this.supabase
    .from('admin_users')
    .select('two_factor_secret')
    .eq('id', adminId)
    .single();

  return speakeasy.totp.verify({
    secret: data.two_factor_secret,
    encoding: 'base32',
    token
  });
}
```

---

## 📊 Success Metrics

**Development:**
- [ ] All 6 phases completed
- [ ] Zero critical bugs in production
- [ ] <3 second page load time (all pages)
- [ ] 100% test coverage on critical paths

**Usage (Post-Launch):**
- [ ] Admin team uses daily
- [ ] <5 second response time for all queries
- [ ] Zero unauthorized access incidents
- [ ] 95%+ admin satisfaction score

---

## 💰 Cost Estimate

**Development Cost:**
- 4-5 weeks × 40 hours/week × $100/hr = **$16,000 - $20,000**

**Infrastructure Cost:**
- Vercel Pro: $20/month
- Supabase: $0 (reuse existing)
- Total: **$20/month**

**Total Investment:**
- Upfront: $16,000 - $20,000
- Monthly: $20

---

## 📚 References

**Documentation:**
- MVP Ticket: `docs/07-tickets/BACKOFFICE-001-MVP.md`
- Stack: `docs/08-backoffice/STACK.md`
- Schema: `supabase/migrations/schema.sql`

**External:**
- [PrimeNG Documentation](https://primeng.org/)
- [Angular Security](https://angular.dev/best-practices/security)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**Created:** December 9, 2024
**Last Updated:** December 9, 2024
**Assigned To:** TBD (After MVP Success)
**Blocked By:** `BACKOFFICE-001-MVP.md`
**Blocks:** None
