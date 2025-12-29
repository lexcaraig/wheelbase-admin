# CMS Public API Guide - Marketing Website Integration

## Overview

The Wheelbase CMS provides public API endpoints for fetching published content. These endpoints are **unauthenticated** and designed for public consumption by the marketing website.

---

## Base URL

```
https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1
```

---

## Endpoints

### 1. Get Content List

**Endpoint:** `POST /get-content-list`

**Purpose:** Fetch a list of published content with filtering and pagination.

**Request:**
```json
{
  "category": "legal",        // Optional: "legal", "updates", "help", "announcements", "about"
  "status": "published",      // Always use "published" for public website
  "limit": 10,                // Optional: default 20, max 100
  "offset": 0,                // Optional: for pagination
  "search": "privacy"         // Optional: search in title/content/excerpt
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "privacy-policy",
      "category": "legal",
      "title": "Privacy Policy",
      "excerpt": "How we collect, use, and protect your information",
      "publishedAt": "2024-12-29T05:17:47.483188+00:00",
      "effectiveDate": "2024-12-08",
      "metadata": {
        "seo": {
          "title": "Wheelbase Privacy Policy",
          "description": "SEO description...",
          "keywords": "privacy, data protection, GDPR"
        }
      },
      "updatedAt": "2024-12-29T05:17:47.483188+00:00"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### 2. Get Single Content

**Endpoint:** `POST /get-content`

**Purpose:** Fetch a single published content page by slug.

**Request:**
```json
{
  "slug": "terms-of-service"
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
    "content": "# Wheelbase Terms of Service\n\n**Last Updated:** December 8, 2024\n\n## 1. Acceptance of Terms...",
    "excerpt": "Legal terms and conditions for using Wheelbase",
    "version": 2,
    "status": "published",
    "publishedAt": "2024-12-29T05:17:47.483188+00:00",
    "effectiveDate": "2024-12-08",
    "metadata": {
      "seo": {
        "title": "Wheelbase Terms of Service",
        "description": "Legal terms and conditions for using the Wheelbase motorcycle community app",
        "keywords": "terms of service, legal, wheelbase, motorcycle app"
      },
      "requires_acceptance": true,
      "acceptance_version": 1,
      "jurisdiction": "[Your Jurisdiction]"
    },
    "createdAt": "2024-12-29T05:17:47.483188+00:00",
    "updatedAt": "2024-12-29T05:17:47.483188+00:00"
  }
}
```

---

## Implementation Examples

### JavaScript/TypeScript (React, Next.js, etc.)

```typescript
// lib/cms.ts
const CMS_BASE_URL = 'https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1';

interface CMSContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  metadata: {
    seo: {
      title: string;
      description: string;
      keywords: string;
    };
  };
}

interface CMSListResponse {
  success: boolean;
  data: CMSContent[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface CMSContentResponse {
  success: boolean;
  data: CMSContent;
}

/**
 * Fetch a list of published content
 */
export async function getContentList(params: {
  category?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<CMSListResponse> {
  const response = await fetch(`${CMS_BASE_URL}/get-content-list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...params,
      status: 'published', // Always fetch published content only
    }),
    // Enable caching for better performance
    next: { revalidate: 3600 }, // Next.js - cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch content list: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single content page by slug
 */
export async function getContent(slug: string): Promise<CMSContentResponse> {
  const response = await fetch(`${CMS_BASE_URL}/get-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ slug }),
    // Enable caching
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch content: ${response.statusText}`);
  }

  return response.json();
}
```

**Usage in React/Next.js:**

```tsx
// app/legal/[slug]/page.tsx (Next.js App Router)
import { getContent } from '@/lib/cms';
import ReactMarkdown from 'react-markdown';

export default async function LegalPage({ params }: { params: { slug: string } }) {
  const { data: content } = await getContent(params.slug);

  return (
    <div className="legal-page">
      <h1>{content.title}</h1>
      {content.excerpt && <p className="excerpt">{content.excerpt}</p>}
      <div className="last-updated">
        Last Updated: {new Date(content.updatedAt).toLocaleDateString()}
      </div>
      <div className="markdown-content">
        <ReactMarkdown>{content.content}</ReactMarkdown>
      </div>
    </div>
  );
}

// Generate static params for all legal pages
export async function generateStaticParams() {
  const { data } = await getContentList({ category: 'legal' });
  return data.map((content) => ({
    slug: content.slug,
  }));
}

// SEO metadata
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: content } = await getContent(params.slug);

  return {
    title: content.metadata.seo.title,
    description: content.metadata.seo.description,
    keywords: content.metadata.seo.keywords,
  };
}
```

---

### PHP (WordPress, Laravel, etc.)

```php
<?php
// cms.php

const CMS_BASE_URL = 'https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1';

/**
 * Fetch content list
 */
function get_content_list($params = []) {
    $params['status'] = 'published'; // Always published

    $response = wp_remote_post(CMS_BASE_URL . '/get-content-list', [
        'headers' => ['Content-Type' => 'application/json'],
        'body' => json_encode($params),
        'timeout' => 10,
    ]);

    if (is_wp_error($response)) {
        return null;
    }

    return json_decode(wp_remote_retrieve_body($response), true);
}

/**
 * Fetch single content by slug
 */
function get_content($slug) {
    $response = wp_remote_post(CMS_BASE_URL . '/get-content', [
        'headers' => ['Content-Type' => 'application/json'],
        'body' => json_encode(['slug' => $slug]),
        'timeout' => 10,
    ]);

    if (is_wp_error($response)) {
        return null;
    }

    return json_decode(wp_remote_retrieve_body($response), true);
}

// Usage
$terms = get_content('terms-of-service');
if ($terms && $terms['success']) {
    echo '<h1>' . esc_html($terms['data']['title']) . '</h1>';
    // Use parsedown or similar for markdown
    echo Parsedown::instance()->text($terms['data']['content']);
}
?>
```

---

### Python (Django, Flask, etc.)

```python
# cms.py
import requests
from typing import Optional, Dict, List

CMS_BASE_URL = 'https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1'

def get_content_list(
    category: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    search: Optional[str] = None
) -> Dict:
    """Fetch content list from CMS"""
    payload = {
        'status': 'published',
        'limit': limit,
        'offset': offset
    }

    if category:
        payload['category'] = category
    if search:
        payload['search'] = search

    response = requests.post(
        f'{CMS_BASE_URL}/get-content-list',
        json=payload,
        headers={'Content-Type': 'application/json'},
        timeout=10
    )

    response.raise_for_status()
    return response.json()

def get_content(slug: str) -> Dict:
    """Fetch single content by slug"""
    response = requests.post(
        f'{CMS_BASE_URL}/get-content',
        json={'slug': slug},
        headers={'Content-Type': 'application/json'},
        timeout=10
    )

    response.raise_for_status()
    return response.json()

# Usage in Django view
from django.shortcuts import render
import markdown

def legal_page(request, slug):
    result = get_content(slug)

    if not result['success']:
        raise Http404

    content = result['data']
    content['html'] = markdown.markdown(content['content'])

    return render(request, 'legal/page.html', {'content': content})
```

---

## CORS Configuration

The public endpoints already have CORS enabled:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

This means you can call these endpoints from **any domain** without CORS issues.

---

## Caching Strategy

### Recommended Approach:

1. **CDN Caching** (Cloudflare, CloudFront):
   - Cache responses for 1 hour (3600 seconds)
   - Legal content rarely changes

2. **Application-Level Caching**:
   ```typescript
   // Next.js
   next: { revalidate: 3600 }

   // Standard fetch
   cache: 'force-cache'
   ```

3. **Invalidation**:
   - When admin publishes/updates content in CMS
   - Trigger webhook to invalidate CDN cache
   - Or use time-based revalidation (ISR)

---

## SEO Best Practices

### 1. Use Metadata from CMS

```tsx
// Next.js metadata
export async function generateMetadata({ params }) {
  const { data } = await getContent(params.slug);

  return {
    title: data.metadata.seo.title,
    description: data.metadata.seo.description,
    keywords: data.metadata.seo.keywords,
    openGraph: {
      title: data.metadata.seo.title,
      description: data.metadata.seo.description,
      type: 'article',
      publishedTime: data.publishedAt,
      modifiedTime: data.updatedAt,
    },
  };
}
```

### 2. Structured Data

```tsx
// Add JSON-LD schema
<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": content.title,
    "datePublished": content.publishedAt,
    "dateModified": content.updatedAt,
    "description": content.excerpt,
  })}
</script>
```

---

## Error Handling

```typescript
try {
  const { data, success } = await getContent('terms-of-service');

  if (!success) {
    // Handle error
    return <ErrorPage message="Content not found" />;
  }

  // Render content
  return <LegalPage content={data} />;

} catch (error) {
  console.error('Failed to fetch content:', error);
  return <ErrorPage message="Failed to load content" />;
}
```

---

## Rate Limiting

**Current Limits:**
- No rate limiting on public endpoints
- Supabase free tier: 500K requests/month

**Best Practices:**
- Implement caching (see above)
- Use static generation where possible (Next.js ISR)
- Monitor usage in Supabase Dashboard

---

## Example URLs

### Legal Pages
```
https://ridewheelbase.app/legal/terms-of-service
https://ridewheelbase.app/legal/privacy-policy
https://ridewheelbase.app/legal/community-guidelines
```

### Updates/Changelog
```
https://ridewheelbase.app/updates
https://ridewheelbase.app/updates/version-1-0-14
```

### Help Center
```
https://ridewheelbase.app/help
https://ridewheelbase.app/help/getting-started
```

---

## Testing

### Test Get Content List:
```bash
curl -X POST https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1/get-content-list \
  -H "Content-Type: application/json" \
  -d '{"category":"legal","status":"published"}'
```

### Test Get Single Content:
```bash
curl -X POST https://hvwpdiyrqonuaomwkuxk.supabase.co/functions/v1/get-content \
  -H "Content-Type: application/json" \
  -d '{"slug":"privacy-policy"}'
```

---

## Summary

✅ **Public endpoints are ready** - No authentication required
✅ **CORS enabled** - Works from any domain
✅ **SEO-friendly** - Metadata included in responses
✅ **Fast** - Implement caching for best performance
✅ **Simple** - Just POST requests with JSON

The marketing website can start using these endpoints immediately!
