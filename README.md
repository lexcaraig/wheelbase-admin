# Wheelbase Admin Panel

Modern admin panel for Wheelbase - motorcycle riding community platform. Built with Angular 20, PrimeNG, and Supabase.

## Overview

**Production URL**: https://admin.ridewheelbase.app
**Tech Stack**: Angular 20 (Standalone) + PrimeNG 20 + Supabase + TailwindCSS + Chart.js
**Generated with**: Angular CLI 20.1.4

**Features**:
- User management (view, search, ban/unban)
- Content moderation queue
- Analytics dashboard (DAU, MAU, ride stats)
- Google OAuth + Email/Password authentication
- Role-based access control (super_admin, admin, moderator, support)
- Comprehensive audit logging

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 20+
- Supabase account (already configured)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
ng serve

# Open http://localhost:4200
```

### Build

```bash
# Development build
npm run build

# Production build
npm run build --configuration production
```

---

## Project Structure

```
wheelbase-admin/
├── src/
│   ├── app/
│   │   ├── core/                    # Singleton services (TO BE CREATED)
│   │   │   ├── auth/
│   │   │   ├── services/
│   │   │   └── models/
│   │   ├── features/                # Feature modules (TO BE CREATED)
│   │   ├── shared/                  # Shared components (TO BE CREATED)
│   │   ├── layout/                  # Layout components (TO BE CREATED)
│   │   ├── app.routes.ts
│   │   └── app.config.ts
│   │
│   ├── environments/                # ✅ CONFIGURED
│   │   ├── environment.ts
│   │   └── environment.development.ts
│   └── styles.scss                  # ✅ CONFIGURED (TailwindCSS + PrimeNG)
│
├── vercel.json                      # ✅ CONFIGURED
├── tailwind.config.js               # ✅ CONFIGURED
└── package.json                     # ✅ CONFIGURED
```

---

## Environment Configuration

### Development (`environment.development.ts`)

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://hvwpdiyrqonuaomwkuxk.supabase.co',
  supabaseAnonKey: '<anon-key>',
  redirectUrl: 'http://localhost:4200/auth/callback',
};
```

### Production (`environment.ts`)

```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://hvwpdiyrqonuaomwkuxk.supabase.co',
  supabaseAnonKey: '<anon-key>',
  redirectUrl: 'https://admin.ridewheelbase.app/auth/callback',
};
```

---

## Deployment

### Vercel Deployment

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import `wheelbase-admin` Git repository
   - Framework: Angular (auto-detected)

2. **Configure Domain**:
   - Add custom domain: `admin.ridewheelbase.app`

3. **Deploy**:
   - Push to `main` branch triggers auto-deployment

### Security Headers

Configured in `vercel.json`:
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Strict-Transport-Security
- ✅ Content-Security-Policy

---

## Backend Integration

### Supabase Edge Functions

All Edge Functions deployed at: `https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1/`

**Admin Functions**:
1. `admin-login` - Email/password authentication
2. `admin-verify-session` - Validate JWT
3. `admin-get-users` - Paginated user list
4. `admin-get-user-detail` - User profile details
5. `admin-ban-user` - Ban user with reason
6. `admin-unban-user` - Restore user access
7. `admin-analytics-dashboard` - Dashboard metrics
8. `admin-get-flagged-content` - Moderation queue
9. `admin-moderate-content` - Approve/remove content

---

## Admin Roles & Permissions

| Role | Description |
|------|-------------|
| `super_admin` | Full access to all features |
| `admin` | User management, content moderation |
| `moderator` | Content moderation only |
| `support` | View-only access |

---

## Development Status

### Completed ✅
- [x] Angular 20 project setup
- [x] Dependencies installed (PrimeNG 20, Supabase, Chart.js, TailwindCSS)
- [x] TailwindCSS configured
- [x] Environment files configured
- [x] Vercel deployment configuration
- [x] Backend Edge Functions deployed
- [x] Google OAuth configured
- [x] Super admin user created

### In Progress 🔄
- [ ] Core services (Supabase, Auth)
- [ ] Route guards (auth, admin-role)

### Pending ⏳
- [ ] Authentication features (login page)
- [ ] Dashboard with analytics
- [ ] User management (list, detail, ban/unban)
- [ ] Content moderation queue
- [ ] Layouts (main, auth)

---

## Support

For issues or questions:
- **Technical**: lexphicableme@gmail.com
- **Documentation**: See `FLUTTER_APP/supabase/ADMIN_GOOGLE_OAUTH_SETUP.md`

---

## License

Proprietary - Co+Lab Digital Solutions
