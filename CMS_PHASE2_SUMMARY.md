# Wheelbase CMS - Phase 2 Complete ✅

**Created:** December 29, 2024
**Status:** Edge Functions deployed and ready
**Next Step:** Build admin interface (Phase 3)

---

## 📦 What Was Deployed

### 4 Edge Functions ✅

**Public API (No authentication required):**
1. ✅ **get-content** - Get single content page by slug
2. ✅ **get-content-list** - List published content with pagination

**Admin API (Authentication required):**
3. ✅ **admin-create-content** - Create/update content pages
4. ✅ **admin-publish-content** - Publish/unpublish/archive content

---

## 🔌 API Documentation

### 1. Get Content (Public)

**Endpoint:** `https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1/get-content`

**Method:** POST

**Request:**
```json
{
  "slug": "terms-of-service",
  "version": 2  // Optional: get specific version
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "terms-of-service",
    "category": "legal",
    "title": "Terms of Service",
    "content": "# Terms...",
    "excerpt": "Our terms of service...",
    "version": 2,
    "publishedAt": "2024-12-29T00:00:00Z",
    "effectiveDate": "2025-01-01T00:00:00Z",
    "metadata": {"seo": {...}},
    "createdAt": "2024-12-29T00:00:00Z",
    "updatedAt": "2024-12-29T00:00:00Z"
  }
}
```

**Cache:** 1 hour (3600s)

---

### 2. Get Content List (Public)

**Endpoint:** `https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1/get-content-list`

**Method:** POST

**Request:**
```json
{
  "category": "updates",  // Optional: filter by category
  "limit": 20,            // Default: 20, Max: 100
  "offset": 0,            // Default: 0
  "search": "version"     // Optional: search in title/excerpt
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "v1-0-16",
      "category": "updates",
      "title": "Version 1.0.16 Release",
      "excerpt": "Bug fixes and improvements...",
      "version": 1,
      "publishedAt": "2024-12-29T00:00:00Z",
      "effectiveDate": null,
      "metadata": {},
      "updatedAt": "2024-12-29T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 16,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

**Cache:** 5 minutes (300s)

---

### 3. Admin Create Content (Protected)

**Endpoint:** `https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1/admin-create-content`

**Method:** POST

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Request (Create):**
```json
{
  "slug": "new-feature-guide",
  "category": "help",
  "title": "New Feature Guide",
  "content": "# How to use...",
  "excerpt": "Learn how to use our new feature",
  "metadata": {
    "seo": {
      "title": "New Feature Guide - Wheelbase",
      "description": "Complete guide to our new feature"
    },
    "tags": ["guide", "tutorial"]
  }
}
```

**Request (Update):**
```json
{
  "id": "uuid",  // Existing content ID
  "slug": "updated-feature-guide",
  "category": "help",
  "title": "Updated Feature Guide",
  "content": "# Updated content...",
  "excerpt": "Updated excerpt",
  "changeSummary": "Added screenshots and examples",
  "changeType": "minor"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "new-feature-guide",
    "category": "help",
    "title": "New Feature Guide",
    "content": "# How to use...",
    "excerpt": "Learn how to use our new feature",
    "version": 1,
    "status": "draft",
    "publishedAt": null,
    "effectiveDate": null,
    "metadata": {...},
    "createdAt": "2024-12-29T00:00:00Z",
    "updatedAt": "2024-12-29T00:00:00Z"
  },
  "message": "Content created successfully"
}
```

**Security:**
- Requires valid admin JWT token
- Checks `admin_users` table for active admin
- Creates content in `draft` status by default
- Version control automatic on update

---

### 4. Admin Publish Content (Protected)

**Endpoint:** `https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1/admin-publish-content`

**Method:** POST

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "id": "uuid",
  "action": "publish"  // Options: "publish", "unpublish", "archive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "new-feature-guide",
    "category": "help",
    "title": "New Feature Guide",
    "status": "published",
    "publishedAt": "2024-12-29T12:30:00Z",
    "version": 1,
    "updatedAt": "2024-12-29T12:30:00Z"
  },
  "message": "Content published successfully"
}
```

**Actions:**
- **publish**: Sets status to 'published', sets `published_at` timestamp
- **unpublish**: Sets status to 'draft', clears `published_at`
- **archive**: Sets status to 'archived', keeps `published_at`

---

## 🧪 Testing the APIs

### Test Public API (No auth needed)

```bash
# Get content by slug
curl -X POST \
  'https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1/get-content' \
  -H 'Content-Type: application/json' \
  -d '{"slug": "terms-of-service"}'

# List all app updates
curl -X POST \
  'https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1/get-content-list' \
  -H 'Content-Type: application/json' \
  -d '{"category": "updates", "limit": 10}'
```

### Test Admin API (Auth required)

```bash
# First, get admin JWT token from Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/hvwpdiyrqonuaomwkuxk/auth/users
# Login as admin user and copy JWT token

# Create new content
curl -X POST \
  'https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1/admin-create-content' \
  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "slug": "test-content",
    "category": "help",
    "title": "Test Content",
    "content": "# Test\n\nThis is a test.",
    "excerpt": "Test excerpt"
  }'

# Publish content
curl -X POST \
  'https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1/admin-publish-content' \
  -H 'Authorization: Bearer <ADMIN_JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "<CONTENT_ID>",
    "action": "publish"
  }'
```

---

## 🔒 Security Features

**✅ Implemented:**
- Admin authentication via JWT tokens
- Admin user validation against `admin_users` table
- Role-based access control (only active admins)
- RLS policies enforce database-level security
- Input validation using Zod schemas
- CORS headers for cross-origin requests
- Service role key for admin operations
- No JWT verification for public APIs (--no-verify-jwt)

**Error Handling:**
- 400: Validation errors (invalid input)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (not an admin)
- 404: Not found (content doesn't exist)
- 409: Conflict (duplicate slug)
- 500: Internal server error

---

## 📊 Features Implemented

**Version Control** ✅
- Automatic version increment on content change
- Version history stored in `content_versions` table
- Can fetch specific version via `get-content`
- Change summary and type tracking

**Publishing Workflow** ✅
- Draft → Published → Archived states
- Timestamp tracking for publish date
- Effective date for legal documents

**Caching** ✅
- Public content: 1 hour cache
- Content lists: 5 minutes cache
- Admin APIs: No cache (always fresh)

**Search & Filtering** ✅
- Category filtering
- Full-text search in title/excerpt
- Pagination support (limit, offset)

---

## 🚀 Integration with Marketing Website

**Example: Next.js Integration**

```typescript
// lib/api/cms.ts
const SUPABASE_FUNCTIONS_URL = 'https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1';

export async function getContent(slug: string, version?: number) {
  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/get-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, version }),
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  return response.json();
}

export async function getContentList(category?: string, limit = 20) {
  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/get-content-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, limit }),
    next: { revalidate: 300 }, // Cache for 5 minutes
  });
  return response.json();
}

// Usage in page
export default async function TermsPage() {
  const { data } = await getContent('terms-of-service');

  return (
    <div>
      <h1>{data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: markdownToHtml(data.content) }} />
      <p>Last updated: {new Date(data.updatedAt).toLocaleDateString()}</p>
      <p>Version: {data.version}</p>
    </div>
  );
}
```

---

## 📋 Next Steps (Phase 3)

**Build Admin Interface in wheelbase-admin:**

1. **Content List Page** (`/admin/content`)
   - Table view with all content
   - Filters: category, status, search
   - Actions: edit, publish, archive, delete
   - Pagination

2. **Content Editor** (`/admin/content/new`, `/admin/content/[id]`)
   - Rich text editor (Quill.js or TinyMCE)
   - Metadata editor (SEO, tags)
   - Live preview
   - Save as draft / Publish

3. **Version History** (`/admin/content/[id]/versions`)
   - List all versions
   - View diff between versions
   - Restore previous version

4. **Analytics Dashboard** (`/admin/content/analytics`)
   - Acceptance rates for legal docs
   - Popular content pages
   - User engagement metrics

**Estimated Time:** 1-2 days

---

## ✅ Phase 2 Checklist

- [x] Created 4 Edge Functions
- [x] Deployed all functions successfully
- [x] Public APIs accessible without auth
- [x] Admin APIs require authentication
- [x] Version control working
- [x] Publishing workflow implemented
- [x] Caching configured
- [x] Error handling comprehensive
- [x] API documentation complete
- [x] Integration examples provided

---

## 📞 Ready for Phase 3?

**Current Status:** ✅ Phase 2 Complete (Edge Functions)

**What's Working:**
- Database schema with RLS ✅
- Version control & audit trail ✅
- Public content API ✅
- Admin content management API ✅
- Publishing workflow ✅

**What's Next:**
- Build admin UI for content management
- Rich text editor integration
- Version comparison interface
- User acceptance tracking dashboard

**Questions before Phase 3:**
1. Which rich text editor do you prefer? (Quill.js, TinyMCE, or Tiptap)
2. Do you want markdown or WYSIWYG editor?
3. Should we import existing content automatically?

Let me know when you're ready for Phase 3! 🚀
