# Wheelbase Admin Panel - Architecture Documentation

**Project:** Wheelbase Admin Panel
**Tech Stack:** Angular 20 + PrimeNG 20 + Supabase + TailwindCSS
**Deployment:** Vercel (admin.ridewheelbase.app)
**Last Updated:** December 28, 2024

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Project Structure](#project-structure)
5. [Data Flow](#data-flow)
6. [Backend Integration](#backend-integration)
7. [Security Architecture](#security-architecture)
8. [State Management](#state-management)
9. [Performance Optimization](#performance-optimization)

---

## System Overview

The Wheelbase Admin Panel is a standalone Angular 20 single-page application (SPA) that provides administrative capabilities for the Wheelbase motorcycle community platform. It operates independently from the Flutter mobile app but shares the same Supabase backend infrastructure.

### Key Characteristics

- **Standalone Architecture**: Independent Angular app deployed separately from the mobile app
- **Shared Backend**: Uses the same Supabase instance as the Flutter app with dedicated admin Edge Functions
- **Role-Based Access**: Four admin roles (super_admin, admin, moderator, support) with granular permissions
- **Real-Time Updates**: Auto-refresh dashboards every 30 seconds for live monitoring
- **Responsive Design**: Works on desktop, tablet, and mobile devices

---

## Technology Stack

### Frontend

**Framework:**
- Angular 20.1.0 (Standalone Components)
- TypeScript 5.6+
- RxJS 7.8+

**UI Library:**
- PrimeNG 20.4.0 (Component library)
- PrimeIcons 7.0.0 (Icon set)
- TailwindCSS 3.4.19 (Utility-first CSS)

**Data Visualization:**
- Chart.js 4.5.1 (Charts and graphs)

**HTTP Client:**
- @supabase/supabase-js 2.89.0 (Supabase client SDK)

### Backend

**Database:**
- PostgreSQL 16 (Supabase-hosted)
- PostGIS 3.4 (Geospatial queries)

**Edge Functions:**
- Deno runtime (TypeScript on the edge)
- 9 admin-specific Edge Functions

**Authentication:**
- Supabase Auth (JWT-based)
- Google OAuth 2.0
- Email/Password authentication

### Infrastructure

**Hosting:**
- Vercel (Frontend SPA)
- Supabase (Backend + Database + Edge Functions)

**CDN:**
- Vercel Edge Network

**Domain:**
- admin.ridewheelbase.app

---

## Architecture Patterns

### 1. Standalone Component Architecture (Angular 20)

The admin panel uses Angular's modern standalone component pattern, eliminating the need for NgModules.

```typescript
// Example: Dashboard Component
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, ...],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent { }
```

**Benefits:**
- Simpler project structure
- Better tree-shaking (smaller bundle sizes)
- Easier lazy loading
- Faster build times

### 2. Service-Oriented Architecture

Services are organized by domain responsibility:

```
core/services/
├── supabase.service.ts    # Supabase client wrapper
├── auth.service.ts         # Authentication management
├── api.service.ts          # HTTP wrapper for Edge Functions
├── users.service.ts        # User management operations
├── analytics.service.ts    # Dashboard metrics
└── moderation.service.ts   # Content moderation
```

**Separation of Concerns:**
- **SupabaseService**: Low-level Supabase client setup
- **ApiService**: Generic HTTP request handling
- **Domain Services**: Business logic (users, analytics, moderation)

### 3. Route Guards Pattern

Two-layer security model:

```typescript
// Layer 1: Authentication Guard
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const isAuthenticated = await authService.isAuthenticated();
  return isAuthenticated ? true : router.parseUrl('/login');
};

// Layer 2: Role-Based Guard
export const adminRoleGuard: CanActivateFn = (route) => {
  const permission = route.data['permission'];
  return hasPermission(permission) ? true : router.parseUrl('/unauthorized');
};
```

### 4. Reactive State Management (Signals)

Uses Angular Signals for reactive state:

```typescript
export class DashboardComponent {
  analytics = signal<AnalyticsResponse | null>(null);
  isLoading = signal(true);

  async loadAnalytics() {
    this.isLoading.set(true);
    const data = await this.analyticsService.getDashboardMetrics();
    this.analytics.set(data);
    this.isLoading.set(false);
  }
}
```

**Benefits:**
- Fine-grained reactivity
- Better performance than Zone.js change detection
- Simpler than RxJS for UI state

---

## Project Structure

```
wheelbase-admin/
├── src/
│   ├── app/
│   │   ├── core/                    # Core functionality (singleton services)
│   │   │   ├── auth/
│   │   │   │   ├── auth.guard.ts    # Authentication guard
│   │   │   │   └── admin-role.guard.ts  # Role-based guard
│   │   │   ├── models/
│   │   │   │   ├── admin-user.model.ts  # Admin user interface
│   │   │   │   ├── user.model.ts        # App user interface
│   │   │   │   ├── analytics.model.ts   # Analytics data models
│   │   │   │   └── content.model.ts     # Flagged content models
│   │   │   └── services/
│   │   │       ├── supabase.service.ts  # Supabase client
│   │   │       ├── auth.service.ts      # Authentication
│   │   │       ├── api.service.ts       # API wrapper
│   │   │       ├── users.service.ts     # User management
│   │   │       ├── analytics.service.ts # Analytics
│   │   │       └── moderation.service.ts  # Moderation
│   │   │
│   │   ├── features/                # Feature modules
│   │   │   ├── auth/
│   │   │   │   └── login/           # Login page
│   │   │   ├── dashboard/           # Analytics dashboard
│   │   │   ├── users/
│   │   │   │   ├── users-list/      # User list table
│   │   │   │   └── user-detail/     # User detail page
│   │   │   └── moderation/
│   │   │       └── content-queue/   # Flagged content queue
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── auth-layout/         # Login page layout
│   │   │   └── main-layout/         # Dashboard layout
│   │   │
│   │   ├── shared/                  # Shared components/pipes
│   │   │   ├── components/
│   │   │   │   ├── sidebar.component.ts
│   │   │   │   └── header.component.ts
│   │   │   └── pipes/
│   │   │       └── relative-time.pipe.ts
│   │   │
│   │   ├── app.routes.ts            # Application routes
│   │   ├── app.config.ts            # App configuration
│   │   └── app.ts                   # Root component
│   │
│   ├── environments/                # Environment configs
│   │   ├── environment.ts           # Production
│   │   └── environment.development.ts  # Development
│   │
│   ├── styles.scss                  # Global styles
│   └── index.html                   # HTML entry point
│
├── public/                          # Static assets
│   └── favicon.ico
│
├── vercel.json                      # Vercel deployment config
├── tailwind.config.js               # TailwindCSS config
├── angular.json                     # Angular CLI config
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript config
```

### Directory Responsibilities

**core/**
- Contains singleton services used throughout the app
- Authentication logic and guards
- Data models and interfaces
- Never imports from `features/`

**features/**
- Feature-specific components and logic
- Organized by domain (auth, dashboard, users, moderation)
- Can import from `core/` and `shared/`

**layout/**
- Layout wrapper components
- Sidebar, header, footer components
- Routing structure for layouts

**shared/**
- Reusable components, pipes, directives
- Used by multiple features
- No business logic

---

## Data Flow

### 1. Authentication Flow

```
User Login
    ↓
LoginComponent
    ↓
AuthService.login(email, password)
    ↓
Supabase Edge Function: /admin/login
    ↓
Verify credentials in admin_users table
    ↓
Return JWT + admin user data
    ↓
AuthService stores JWT in localStorage
    ↓
Redirect to /dashboard
```

### 2. Data Retrieval Flow

```
Component.ngOnInit()
    ↓
DomainService.getData()
    ↓
ApiService.post('/admin/endpoint', payload)
    ↓
SupabaseService.functions.invoke('endpoint')
    ↓
Edge Function processes request
    ↓
PostgreSQL query via Supabase client
    ↓
RLS policies enforce access control
    ↓
Return data to Edge Function
    ↓
Transform and return to frontend
    ↓
Component updates signals
    ↓
Template re-renders automatically
```

### 3. Admin Action Flow (e.g., Ban User)

```
User clicks "Ban User" button
    ↓
Component shows confirmation dialog
    ↓
User confirms with reason
    ↓
UsersService.banUser(userId, reason)
    ↓
ApiService.post('/admin/ban-user', { userId, reason })
    ↓
Edge Function: /admin/ban-user
    ↓
Verify admin has 'users.ban' permission
    ↓
Update users table: is_banned = true
    ↓
Insert audit log entry
    ↓
Return success response
    ↓
Component refreshes user data
    ↓
Toast notification: "User banned successfully"
```

---

## Backend Integration

### Supabase Edge Functions

All admin operations go through dedicated Edge Functions deployed at:
```
https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1/admin/
```

**Deployed Functions:**

| Function | Method | Purpose |
|----------|--------|---------|
| `admin-login` | POST | Email/password authentication |
| `admin-verify-session` | GET | Validate JWT session |
| `admin-get-users` | GET | Paginated user list |
| `admin-get-user-detail` | GET | User profile details |
| `admin-ban-user` | POST | Ban user with reason |
| `admin-unban-user` | POST | Remove user ban |
| `admin-analytics-dashboard` | GET | Dashboard metrics |
| `admin-get-flagged-content` | GET | Moderation queue |
| `admin-moderate-content` | POST | Approve/remove content |

### API Request Format

**Request:**
```typescript
const response = await this.supabase.functions.invoke('admin-get-users', {
  body: {
    page: 1,
    pageSize: 25,
    searchTerm: 'john',
    filter: 'active'
  }
});
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "total": 150,
    "page": 1,
    "pageSize": 25
  },
  "meta": {
    "timestamp": "2024-12-28T12:00:00Z",
    "version": "1.0.0"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid session",
    "details": {}
  }
}
```

### Database Tables

**Admin-Specific Tables:**
- `admin_users` - Admin accounts with roles
- `admin_audit_logs` - Complete audit trail

**Modified App Tables:**
- `users` - Added ban tracking fields
- `posts` - Added moderation flags
- `comments` - Added moderation flags

**RLS Policies:**
- All admin tables have RLS enabled
- Policies check JWT role claim
- Audit logs are write-protected (Edge Functions only)

---

## Security Architecture

### 1. Multi-Layer Security

**Layer 1: Network**
- HTTPS enforced (TLS 1.3)
- Security headers (CSP, HSTS, X-Frame-Options)
- CORS whitelisting (admin.ridewheelbase.app only)

**Layer 2: Authentication**
- JWT-based authentication
- RS256 algorithm (asymmetric keys)
- Access token: 1 hour expiry
- Refresh token: 7 days expiry
- Google OAuth 2.0 support

**Layer 3: Authorization**
- Role-based access control (RBAC)
- Route guards check authentication
- Admin role guards check permissions
- Edge Functions validate JWT claims

**Layer 4: Database**
- Row-Level Security (RLS) policies
- Prepared statements (SQL injection prevention)
- Encrypted at rest (AES-256)

### 2. Permission Model

```typescript
interface AdminPermissions {
  'users.view': boolean;      // View user list
  'users.ban': boolean;        // Ban/unban users
  'content.moderate': boolean; // Moderate content
  'analytics.view': boolean;   // View analytics
}

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  super_admin: {
    'users.view': true,
    'users.ban': true,
    'content.moderate': true,
    'analytics.view': true
  },
  admin: {
    'users.view': true,
    'users.ban': true,
    'content.moderate': true,
    'analytics.view': true
  },
  moderator: {
    'users.view': false,
    'users.ban': false,
    'content.moderate': true,
    'analytics.view': false
  },
  support: {
    'users.view': true,
    'users.ban': false,
    'content.moderate': false,
    'analytics.view': true
  }
};
```

### 3. Audit Logging

All admin actions are logged immutably:

```sql
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY,
  admin_user_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Read-only for admins, write-only via Edge Functions
```

**Logged Actions:**
- User bans/unbans
- Content approvals/removals
- Permission changes
- Login/logout events

---

## State Management

### Angular Signals (Reactive State)

The admin panel uses Angular Signals for reactive state management:

```typescript
export class DashboardComponent {
  // Reactive state
  analytics = signal<AnalyticsResponse | null>(null);
  isLoading = signal(true);

  // Computed values
  totalUsers = computed(() => this.analytics()?.total_users || 0);

  // Effects
  constructor() {
    effect(() => {
      console.log('Analytics updated:', this.analytics());
    });
  }
}
```

**Benefits over RxJS Observables:**
- Simpler mental model (no subscribe/unsubscribe)
- Automatic cleanup (no memory leaks)
- Fine-grained reactivity (only affected components re-render)
- Better TypeScript inference

### Service State

Services maintain application-wide state:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AdminUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  async login(email: string, password: string): Promise<void> {
    const user = await this.performLogin(email, password);
    this.currentUserSubject.next(user);
  }
}
```

---

## Performance Optimization

### 1. Bundle Size Optimization

**Current Bundle:**
- Main bundle: 1.39 MB (275 KB gzipped)
- Lazy chunks: 64 KB (17 KB gzipped)
- Total: 1.63 MB (341 KB transferred)

**Optimization Strategies:**
- Standalone components (better tree-shaking)
- Lazy loading (future routes)
- PrimeNG selective imports
- TailwindCSS purge unused styles

### 2. Rendering Optimization

**Sparkline Charts:**
```typescript
private renderSparkline(canvasId: string, data: number[], color: string) {
  // Destroy previous chart to prevent memory leaks
  this.destroyChart(canvasId);

  // Render new chart
  this.charts.set(canvasId, new Chart(canvas, config));
}
```

**Auto-Refresh:**
```typescript
private startAutoRefresh() {
  // Refresh every 30 seconds (not too aggressive)
  this.refreshInterval = setInterval(() => {
    this.loadAnalytics();
  }, 30000);
}
```

### 3. Network Optimization

**Pagination:**
- User list: 25 users per page
- Lazy loading prevents loading all data

**Caching:**
- JWT stored in localStorage (avoid re-login)
- Analytics cached client-side (30s TTL)

### 4. Deployment Optimization

**Vercel Configuration:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

**Edge Caching:**
- Static assets cached at Vercel edge nodes
- API responses not cached (always fresh)

---

## Future Enhancements (BACKOFFICE-002)

### Advanced Features (Planned)

1. **Advanced Analytics**
   - Custom date range selector
   - Export to CSV/PDF
   - User retention cohort analysis
   - Geographic distribution map

2. **System Health Monitoring**
   - Edge Function performance metrics
   - Database query performance
   - Real-time alerts

3. **Push Notification Broadcasting**
   - Send to user segments
   - Schedule notifications
   - A/B testing

4. **Support Ticket Management**
   - Ticket queue
   - Canned responses
   - SLA tracking

5. **Enhanced Audit Logging**
   - Advanced search and filtering
   - Export audit logs
   - Compliance reports

6. **Data Export**
   - Export users to CSV
   - Export analytics to PDF
   - Scheduled reports

---

## Development Guidelines

### Code Style

- **TypeScript Strict Mode**: Enabled
- **Linting**: ESLint with Angular rules
- **Formatting**: Prettier (2 spaces, semicolons)

### Component Structure

```typescript
@Component({ ... })
export class ExampleComponent implements OnInit, OnDestroy {
  // 1. Signals (reactive state)
  data = signal<Data[]>([]);
  isLoading = signal(false);

  // 2. Observables (if needed)
  private destroy$ = new Subject<void>();

  // 3. Constructor (dependency injection)
  constructor(private service: ExampleService) {}

  // 4. Lifecycle hooks
  async ngOnInit() { }
  ngOnDestroy() { }

  // 5. Public methods
  async loadData() { }

  // 6. Private methods
  private helperMethod() { }
}
```

### Service Structure

```typescript
@Injectable({ providedIn: 'root' })
export class ExampleService {
  constructor(
    private supabase: SupabaseService,
    private api: ApiService
  ) {}

  async getData(params: Params): Promise<Response> {
    return this.api.post<Response>('/admin/endpoint', params);
  }
}
```

---

## Deployment Architecture

```
User Browser
    ↓
Vercel Edge Network (CDN)
    ↓
Angular SPA (admin.ridewheelbase.app)
    ↓
Supabase Edge Functions (hvwpdiyrqonuaomwkuxk.supabase.co)
    ↓
PostgreSQL Database (Supabase)
```

**Benefits:**
- Global CDN (Vercel Edge) - Low latency worldwide
- Edge Functions - Run close to users
- Serverless Architecture - Auto-scaling
- Zero DevOps - Managed by Vercel + Supabase

---

**Document Version:** 1.0.0
**Last Updated:** December 28, 2024
**Maintained By:** Co+Lab Digital Solutions
