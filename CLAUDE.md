# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wheelbase Admin Panel - Angular 20 admin dashboard for the Wheelbase motorcycle community app. Connects to Supabase backend via Edge Functions for user management, content moderation, analytics, and business verification.

## Commands

```bash
# Development
npm start           # Start dev server at http://localhost:4200
npm run watch       # Build with watch mode

# Build
npm run build       # Production build (outputs to dist/)

# Testing
npm test            # Run Karma unit tests
```

## Architecture

### Tech Stack
- **Framework:** Angular 20 with standalone components and Signals
- **Styling:** Tailwind CSS + PrimeNG 20 (Aura theme configured in `app.config.ts`)
- **Backend:** Supabase (Edge Functions called via `SupabaseService.callFunction()`)
- **Charts:** Chart.js via PrimeNG ChartModule

### Directory Structure

```
src/app/
├── core/
│   ├── auth/           # Guards (AuthGuard, AdminRoleGuard)
│   ├── models/         # TypeScript interfaces
│   └── services/       # Injectable services
├── features/           # Feature modules (standalone components)
│   ├── dashboard/
│   ├── users/
│   ├── moderation/
│   ├── monitoring/
│   ├── promotions/
│   ├── businesses/
│   └── ...
├── layout/             # Layout components (MainLayout, AuthLayout)
└── shared/             # Shared components, pipes, utilities
```

### Key Patterns

**Service Pattern:** All services are `providedIn: 'root'`. Backend calls go through `SupabaseService.callFunction<T>('function-name')` which prefixes `admin-` to Edge Function names.

**Component Pattern:** All components are standalone with explicit imports. Use Angular Signals (`signal()`) for reactive state.

**Auth Flow:** `AuthService` manages admin sessions. `AuthGuard` protects routes. `AdminRoleGuard` checks permissions via `data: { permission: 'users.view' }` route data.

**Role Hierarchy:** `support` < `moderator` < `admin` < `super_admin`

### Environment Configuration

- Production: `src/environments/environment.ts`
- Development: `src/environments/environment.development.ts`

Build swaps environments via `fileReplacements` in `angular.json`.

### Styling Conventions

Global styles in `src/styles.scss` provide:
- `.page-container`, `.page-header` - Page layout patterns
- `.stat-badge.pending/.approved/.rejected` - Status badges
- `::ng-deep .admin-datatable` - PrimeNG table styling
- `.info-grid`, `.form-field`, `.dialog-footer` - Common UI patterns

Use Tailwind utility classes for component-specific styling.
