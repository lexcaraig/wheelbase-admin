# Wheelbase CMS Implementation Plan

**Created:** December 29, 2024
**Status:** Planning Phase
**Estimated Timeline:** 4-6 days

---

## 1. Overview

Build a Content Management System (CMS) in wheelbase-admin to manage:
- App Updates (version release notes)
- Legal Documents (Terms, Privacy, Community Guidelines)
- Help Center content
- Announcements

**Key Requirements:**
- Version control for legal compliance
- Public API for marketing website
- User acceptance tracking
- Audit trail
- Multi-language support (future)

---

## 2. Architecture Design

### 2.1 Database Schema

**Tables:**

1. **content_pages** (Main content table)
   - id (UUID, PK)
   - slug (VARCHAR, UNIQUE) - URL-friendly identifier
   - category (VARCHAR) - 'legal', 'updates', 'help', 'announcements'
   - title (VARCHAR)
   - content (TEXT) - Markdown format
   - version (INTEGER) - Current version number
   - status (VARCHAR) - 'draft', 'published', 'archived'
   - published_at (TIMESTAMPTZ)
   - effective_date (TIMESTAMPTZ) - For legal docs
   - created_by (UUID, FK → auth.users)
   - updated_by (UUID, FK → auth.users)
   - metadata (JSONB) - SEO, tags, language
   - Timestamps: created_at, updated_at

2. **content_versions** (Version history)
   - id (UUID, PK)
   - page_id (UUID, FK → content_pages)
   - version (INTEGER)
   - title (VARCHAR)
   - content (TEXT)
   - published_at (TIMESTAMPTZ)
   - created_by (UUID, FK → auth.users)
   - change_summary (TEXT) - What changed
   - Timestamp: created_at
   - UNIQUE(page_id, version)

3. **user_content_acceptances** (Legal compliance)
   - id (UUID, PK)
   - user_id (UUID, FK → public.users)
   - page_id (UUID, FK → content_pages)
   - version (INTEGER)
   - accepted_at (TIMESTAMPTZ)
   - ip_address (VARCHAR)
   - user_agent (TEXT)
   - UNIQUE(user_id, page_id, version)

**Indexes:**
- content_pages: slug, category, status, published_at
- content_versions: page_id + version
- user_content_acceptances: user_id + page_id

### 2.2 RLS Policies

**content_pages:**
- SELECT: Public (WHERE status = 'published')
- INSERT/UPDATE/DELETE: Admin only (check auth.jwt() → role = 'admin')

**content_versions:**
- SELECT: Public (for version history transparency)
- INSERT: Automatic via trigger on content_pages update
- DELETE: Admin only

**user_content_acceptances:**
- SELECT: User can view own acceptances
- INSERT: Authenticated users only (own records)
- UPDATE/DELETE: Never (immutable audit trail)

### 2.3 Edge Functions

**Public API:**
1. **get-content** - Get single page by slug
   - Input: { slug: string, version?: number }
   - Output: Content page data
   - Cache: 1 hour for published content

2. **get-content-list** - List pages by category
   - Input: { category: string, limit?: number, offset?: number }
   - Output: Array of content pages
   - Cache: 5 minutes

3. **get-content-versions** - Version history
   - Input: { slug: string }
   - Output: Array of versions

**Admin API:**
4. **admin-create-content** - Create/update content
   - Input: Content page data
   - Output: Created/updated page
   - Creates new version automatically

5. **admin-publish-content** - Publish draft
   - Input: { id: UUID }
   - Output: Published page
   - Sets published_at timestamp

6. **admin-delete-content** - Archive content
   - Input: { id: UUID }
   - Output: Success status
   - Sets status to 'archived'

### 2.4 Admin Interface Structure

```
wheelbase-admin/src/
├── pages/
│   └── content/
│       ├── index.tsx          # Content list (all categories)
│       ├── [id].tsx           # Content editor
│       ├── [id]/versions.tsx  # Version history
│       └── acceptances.tsx    # User acceptances dashboard
├── components/
│   └── content/
│       ├── ContentList.tsx
│       ├── ContentEditor.tsx  # Rich text editor
│       ├── VersionDiff.tsx    # Compare versions
│       └── AcceptanceChart.tsx
└── lib/
    └── api/
        └── content.ts         # API client functions
```

---

## 3. Implementation Phases

### Phase 1: Database Foundation (Day 1)
**Tasks:**
- [x] Create implementation plan
- [ ] Review current schema.sql
- [ ] Design and create migration file
- [ ] Document RLS policies
- [ ] Run migration (user action required)
- [ ] Test database structure

**Deliverables:**
- Migration file: `20241229_create_content_cms.sql`
- Updated: `schema.sql`
- Updated: `rls-policies.md`

### Phase 2: Edge Functions (Day 2-3)
**Tasks:**
- [ ] Check Supabase CLI session
- [ ] Create `get-content` (public)
- [ ] Create `get-content-list` (public)
- [ ] Create `get-content-versions` (public)
- [ ] Create `admin-create-content` (protected)
- [ ] Create `admin-publish-content` (protected)
- [ ] Test all endpoints with Postman/curl
- [ ] Deploy Edge Functions

**Deliverables:**
- 6 Edge Functions deployed
- API documentation
- Example requests/responses

### Phase 3: Admin Interface (Day 4-5)
**Tasks:**
- [ ] Set up routing in wheelbase-admin
- [ ] Create content list page
- [ ] Implement rich text editor (Quill.js)
- [ ] Create content editor page
- [ ] Build version history viewer
- [ ] Add user acceptances dashboard
- [ ] Implement search and filters
- [ ] Add validation and error handling

**Deliverables:**
- 4 admin pages
- Reusable React components
- Form validation

### Phase 4: Testing & Documentation (Day 6)
**Tasks:**
- [ ] End-to-end testing
- [ ] Create test content for all categories
- [ ] API integration testing
- [ ] Security audit (RLS, XSS, SQL injection)
- [ ] Performance testing (caching)
- [ ] Documentation updates
- [ ] Marketing website integration guide

**Deliverables:**
- Test reports
- Integration guide
- User manual

---

## 4. Initial Content Setup

**Pre-populate with:**

1. **App Updates** (from VERSION_SUMMARY.md)
   - v1.0.16, v1.0.15, v1.0.14, etc.
   - Import from existing release notes

2. **Legal Documents** (from Flutter app)
   - Community Guidelines (already in app)
   - Terms of Service (already in app)
   - Privacy Policy (already in app)

3. **Help Center**
   - Getting Started guide
   - FAQs

---

## 5. Technology Stack

**Database:** PostgreSQL (Supabase)
**Edge Functions:** Deno + TypeScript
**Admin UI:** Next.js 14 + React 18 + TypeScript
**Rich Text Editor:** Quill.js (lightweight, customizable)
**Styling:** Tailwind CSS
**Forms:** React Hook Form + Zod
**API Client:** Fetch API with custom wrapper

---

## 6. Security Considerations

1. **XSS Prevention**
   - Sanitize HTML output using DOMPurify
   - Store content as markdown (safer than HTML)

2. **SQL Injection**
   - Use parameterized queries (Supabase handles this)
   - Validate all inputs with Zod schemas

3. **Access Control**
   - RLS policies enforce admin-only write access
   - JWT validation in Edge Functions
   - Rate limiting on public API

4. **Audit Trail**
   - Log all changes (who, when, what)
   - Immutable version history
   - User acceptance tracking

5. **Data Privacy**
   - GDPR compliance (user can view own acceptances)
   - IP address hashing (optional for privacy)
   - Retention policy for logs

---

## 7. Performance Optimization

1. **Caching Strategy**
   - Public content: 1 hour CDN cache
   - Content list: 5 minutes cache
   - Admin API: No cache (always fresh)

2. **Database Indexing**
   - Composite indexes on frequently queried columns
   - Partial indexes for status = 'published'

3. **Content Delivery**
   - Lazy load version history
   - Paginate content lists
   - Compress API responses

---

## 8. Future Enhancements

**Phase 5 (Optional):**
- Multi-language support (i18n)
- Content templates (reusable blocks)
- Approval workflow (draft → review → published)
- Email notifications for changes
- Analytics (page views, acceptance rates)
- Content scheduling
- WYSIWYG + markdown toggle

---

## 9. Success Metrics

**MVP Success Criteria:**
- All 4 content categories working
- Version control functional
- Public API returning content
- Admin can create/edit/publish content
- RLS policies enforced
- No security vulnerabilities

**Performance Targets:**
- API response time: <200ms (p95)
- Page load time: <1s
- Database query time: <50ms

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex version control | High | Use proven pattern (audit table) |
| XSS vulnerabilities | High | Strict content sanitization |
| Performance degradation | Medium | Proper indexing + caching |
| User adoption | Medium | Clear UI/UX design |
| Data loss | High | Automated backups, version history |

---

## 11. Next Steps

1. **Review this plan** - User approval needed
2. **Check current schema** - Understand existing structure
3. **Create database migration** - Foundation for CMS
4. **Build & test iteratively** - One phase at a time

---

**Status:** ⏳ Awaiting approval to proceed

**Questions for User:**
1. Should we import existing content from Flutter app automatically?
2. Do you want draft/review/publish workflow or just draft/publish?
3. Any specific rich text features needed (tables, code blocks)?
4. Should version history be public or admin-only?
