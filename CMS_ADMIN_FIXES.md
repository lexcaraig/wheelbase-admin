# CMS Admin Panel Fixes

**Date:** December 29, 2024
**Status:** ✅ Complete

## Issues Identified

### 1. Content Not Showing in Admin Panel
**Problem:** Imported content from Flutter app was not displaying in admin panel.

**Root Cause:** The admin panel was using the **public** `get-content-list` endpoint, which only returns **published** content. The admin needs to see ALL content regardless of status (draft, published, archived).

**Solution:** Created new `admin-get-content-list` Edge Function that:
- Requires authentication (admin only)
- Returns all content regardless of status
- Allows filtering by status parameter
- Ordered by `updated_at` (most recent first)

### 2. No "View" Button
**Problem:** Admin panel only had Edit and Archive buttons, no way to preview content.

**Root Cause:** ContentListComponent was missing a view action.

**Solution:**
- Created new `ContentViewerComponent` with markdown rendering
- Added "View" button to content list table
- Added route `/content/view/:id`
- Installed `marked` library for markdown rendering

## Changes Made

### 1. New Edge Function: `admin-get-content-list`
**File:** `supabase/functions/admin-get-content-list/index.ts` (171 lines)

**Features:**
- JWT authentication required
- Verifies admin role via `admin_users` table
- Accepts filters: `category`, `status`, `search`, `limit`, `offset`
- Returns all content fields including `status`, `created_at`
- Ordered by `updated_at DESC` (most recent first)

**Deployment:** ✅ Deployed to production

### 2. Updated CMS Service
**File:** `wheelbase-admin/src/app/core/services/cms.service.ts`

**Changes:**
- Added `getAdminContentList()` method
- Uses new `admin-get-content-list` endpoint
- Includes authentication headers
- Supports status filtering

### 3. Updated Content List Component
**File:** `wheelbase-admin/src/app/features/content-management/content-list/content-list.component.ts`

**Changes:**
- Switched from `getContentList()` to `getAdminContentList()`
- Added status parameter to API call
- Removed client-side status filtering (now server-side)
- Added `viewContent()` method
- Status filter now triggers server reload

### 4. Updated Content List Template
**File:** `wheelbase-admin/src/app/features/content-management/content-list/content-list.component.html`

**Changes:**
- Added "View" button (blue, before Edit button)
- View button navigates to `/content/view/:id`

### 5. New Content Viewer Component
**Files:**
- `content-viewer.component.ts` (96 lines)
- `content-viewer.component.html` (68 lines)
- `content-viewer.component.scss` (207 lines)

**Features:**
- Displays content metadata (status, category, version, dates)
- Renders markdown content as HTML
- Sanitizes HTML output for security
- Responsive design (sidebar meta on desktop, stacked on mobile)
- "Edit Content" button for quick editing
- "Back to List" navigation

### 6. Updated Routes
**File:** `wheelbase-admin/src/app/app.routes.ts`

**Changes:**
- Imported `ContentViewerComponent`
- Added route: `/content/view/:id`
- Protected with `AdminRoleGuard` and permission check

### 7. Installed Dependencies
**Package:** `marked` + `@types/marked`

**Purpose:** Markdown to HTML conversion for content preview

## How It Works

### Content Flow

1. **Admin creates content** → Draft status (visible in admin panel)
2. **Admin clicks "View"** → Preview rendered markdown
3. **Admin clicks "Publish"** → Status changes to `published` (visible to public)
4. **Public API** (`get-content-list`) → Only shows published content
5. **Admin API** (`admin-get-content-list`) → Shows all content

### Status Filtering

| Filter | Public API | Admin API |
|--------|-----------|-----------|
| None | Published only | All content |
| Draft | N/A | Draft only |
| Published | Published only | Published only |
| Archived | N/A | Archived only |

### API Comparison

| Feature | `get-content-list` | `admin-get-content-list` |
|---------|-------------------|-------------------------|
| Authentication | Optional | Required (admin) |
| Status Filter | `published` only | All statuses |
| Fields Returned | Public fields | All fields + `created_at` |
| Order By | `published_at DESC` | `updated_at DESC` |
| Caching | 5 minutes | None |
| Use Case | Public website | Admin panel |

## Testing

### Test Admin Panel Content List

1. Log in to wheelbase-admin
2. Navigate to Content Management
3. Verify all 3 imported documents appear:
   - Terms of Service (published)
   - Privacy Policy (published)
   - Community Guidelines (published)
4. Test status filter dropdown
5. Test search functionality
6. Test category filter

### Test Content Viewer

1. Click "View" on any content item
2. Verify metadata displays correctly:
   - Status badge
   - Category
   - Version number
   - Published date
   - Effective date
   - Last updated date
3. Verify markdown renders correctly:
   - Headings
   - Lists
   - Links
   - Code blocks
4. Click "Edit Content" → Should navigate to editor
5. Click "Back to List" → Should return to content list

### Test Content Editor

1. Click "Edit" on any content
2. Verify form prepopulates with existing content
3. Make changes and save as draft
4. Verify changes appear in content list
5. Publish content
6. Verify status changes to "published"

## Security

### Authentication Flow

1. User logs in → Gets JWT token
2. Token stored in localStorage (`supabase_access_token`)
3. Angular service adds token to `Authorization` header
4. Edge Function verifies JWT
5. Edge Function checks `admin_users` table
6. If admin → Allow access
7. If not admin → Return 403 Forbidden

### RLS Policies

The database RLS policies still apply:
- `admin_view_all` - Admins can view all content
- `admin_insert` - Admins can create content
- `admin_update_own` - Admins can update any content
- `admin_delete_own` - Admins can delete any content

## Deployment Status

- ✅ Edge Function: `admin-get-content-list` deployed
- ✅ Angular Components: Created and integrated
- ✅ Routes: Updated with viewer route
- ✅ Dependencies: `marked` installed
- ✅ Service Layer: Updated with admin method

## Known Issues

None.

## Next Steps

1. Test the admin panel to ensure content displays
2. Verify all filters work correctly
3. Test content viewer with different markdown formats
4. Optional: Add more markdown content for testing
