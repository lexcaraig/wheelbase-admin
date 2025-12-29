# Wheelbase Admin Panel - Pages Documentation

**Project:** Wheelbase Admin Panel
**Version:** 1.0.0 (MVP)
**Last Updated:** December 28, 2024

---

## Table of Contents

1. [Page Overview](#page-overview)
2. [Login Page](#login-page)
3. [Dashboard Page](#dashboard-page)
4. [Users List Page](#users-list-page)
5. [User Detail Page](#user-detail-page)
6. [Content Moderation Page](#content-moderation-page)
7. [Navigation & Layout](#navigation--layout)

---

## Page Overview

The Wheelbase Admin Panel consists of 5 main pages:

| Route | Page | Access Level | Purpose |
|-------|------|--------------|---------|
| `/login` | Login | Public | Authentication |
| `/dashboard` | Dashboard | All Admins | Analytics overview |
| `/users` | Users List | Admin, Super Admin, Support | User management |
| `/users/:id` | User Detail | Admin, Super Admin, Support | Individual user view |
| `/moderation` | Content Queue | All Admins | Content moderation |

---

## Login Page

**Route:** `/login`
**Access:** Public (no authentication required)
**Layout:** Auth Layout (centered card on gradient background)

### Page Description

The login page provides two authentication methods: email/password and Google OAuth. It features a modern, clean design with form validation and error handling.

### Visual Design

**Layout:**
- Centered card on gradient background
- Wheelbase logo at top
- "Admin Panel" heading
- Two authentication sections
- Footer with support link

**Color Scheme:**
- Background: Dark gradient (#1E2329 to #2A2E35)
- Card: White with slight blur (glassmorphism)
- Primary buttons: Yellow (#FFD535)
- Google button: White with Google logo

### Components

**Email/Password Section:**
- Email input field
  - Label: "Email"
  - Placeholder: "admin@example.com"
  - Validation: Valid email format required
  - Icon: Envelope icon (left)
- Password input field
  - Label: "Password"
  - Placeholder: "Enter your password"
  - Validation: Required, min 6 characters
  - Icon: Lock icon (left)
  - Toggle: Eye icon to show/hide password
- Remember Me checkbox
- Sign In button (full width, yellow)

**Divider:**
- "OR" text with horizontal lines

**Google OAuth Section:**
- "Sign in with Google" button
  - White background
  - Google logo
  - Full width
  - Border: Light gray

**Footer:**
- "Need help?" text
- Link to support email

### States

**Default State:**
- Empty form fields
- Sign In button enabled
- No error messages

**Loading State:**
- Sign In button shows spinner
- Form fields disabled
- Button text: "Signing in..."

**Error State:**
- Red error message below form
- Examples:
  - "Invalid email or password"
  - "Account not found"
  - "Too many login attempts. Try again later."
- Form fields re-enabled
- Button returns to normal

**Success State:**
- Brief success message (optional)
- Automatic redirect to `/dashboard`
- Session token stored

### User Flows

**Email/Password Login:**
1. User enters email
2. User enters password
3. (Optional) Checks "Remember Me"
4. Clicks "Sign In"
5. System validates credentials
6. On success: Redirect to dashboard
7. On failure: Show error message

**Google OAuth Login:**
1. User clicks "Sign in with Google"
2. Redirected to Google consent screen
3. User approves access
4. Redirected back to admin panel
5. System validates OAuth token
6. Redirect to dashboard

**Forgot Password (Future):**
- Link below password field
- Opens password reset flow

### Validation Rules

- **Email:** Must be valid email format
- **Password:** Required, minimum 6 characters
- **Account:** Must exist in `admin_users` table
- **Status:** Account must be active (not deactivated)

### Error Messages

| Scenario | Error Message |
|----------|--------------|
| Empty email | "Email is required" |
| Invalid email format | "Please enter a valid email" |
| Empty password | "Password is required" |
| Wrong credentials | "Invalid email or password" |
| Account not found | "Account not found. Contact support." |
| Deactivated account | "Your account has been deactivated" |
| Server error | "Something went wrong. Please try again." |

### Security Features

- Password masked by default
- HTTPS enforced
- CSRF protection
- Rate limiting (future)
- No sensitive data in URL/logs

### Accessibility

- ✅ Keyboard navigation (Tab, Enter)
- ✅ ARIA labels on form fields
- ✅ Focus indicators
- ✅ Screen reader compatible
- ✅ Error messages announced

### Responsive Design

**Desktop (≥1024px):**
- Card width: 400px
- Large logo
- Spacious padding

**Tablet (768px - 1023px):**
- Card width: 80%
- Medium logo
- Moderate padding

**Mobile (<768px):**
- Full width card with margin
- Small logo
- Compact padding
- Stack elements vertically

---

## Dashboard Page

**Route:** `/dashboard`
**Access:** All authenticated admins (super_admin, admin, moderator, support)
**Layout:** Main Layout (sidebar + header + content)

### Page Description

The dashboard provides a real-time overview of key platform metrics with interactive charts and recent activity. It auto-refreshes every 30 seconds for live monitoring.

### Visual Design

**Layout:**
- 4-column grid for metrics cards (responsive to 2 cols on tablet, 1 col on mobile)
- 2-column grid for charts (1 col on mobile)
- Full-width table at bottom

**Color Scheme:**
- Background: Light gray (#F8F9FA)
- Cards: White with shadow
- Metrics colors: Blue, Green, Purple, Orange
- Chart colors: Consistent with brand

### Sections

#### 1. Metrics Cards (Top Row)

**Total Users Card:**
- **Icon:** Users icon (blue background)
- **Main Number:** e.g., "1,475" (large, bold)
- **Label:** "Total Users"
- **Sparkline:** 10-day trend (blue line)
- **Hover:** Shows trend direction

**Daily Active Users Card:**
- **Icon:** Activity icon (green background)
- **Main Number:** e.g., "324"
- **Label:** "Daily Active (24h)"
- **Sparkline:** 10-day DAU trend (green line)

**Monthly Active Users Card:**
- **Icon:** Calendar icon (purple background)
- **Main Number:** e.g., "1,128"
- **Label:** "Monthly Active (30d)"
- **Sparkline:** 10-day MAU trend (purple line)

**Rides This Month Card:**
- **Icon:** Motorcycle icon (orange background)
- **Main Number:** e.g., "487"
- **Label:** "Rides This Month"
- **Sparkline:** 10-day ride count trend (orange line)

#### 2. Charts Row

**Subscription Tiers Chart (Left):**
- **Title:** "Subscription Distribution"
- **Type:** Doughnut chart
- **Data:**
  - Free tier (blue): e.g., 1,250 users
  - Pro tier (purple): e.g., 180 users
  - Premium tier (orange): e.g., 45 users
- **Legend:** Right side with percentages
- **Interactivity:** Hover shows exact numbers

**Ride Activity Chart (Right):**
- **Title:** "Ride Activity (7 Days)"
- **Type:** Line chart with area fill
- **X-Axis:** Dates (e.g., "Dec 21", "Dec 22")
- **Y-Axis:** Number of rides
- **Data:** Last 7 days of ride counts
- **Interactivity:** Hover shows exact date and count

#### 3. Recent Users Table (Bottom)

**Title:** "Recent Users"

**Columns:**
- **User:** Avatar + Name + Email (stacked)
- **Location:** Country name
- **Subscription:** Badge (Free/Pro/Premium)
- **Joined:** Relative time (e.g., "2 hours ago")

**Rows:** 5 most recent user registrations

**Actions:** Click row to navigate to user detail

### States

**Loading State:**
- Skeleton loaders for all cards
- Gray placeholder boxes
- Pulsing animation

**Loaded State:**
- All metrics displayed
- Charts rendered
- Table populated

**Error State:**
- Error icon in failed sections
- "Failed to load data" message
- Retry button

**Empty State (Rare):**
- "No data available" message
- Refresh button

### Auto-Refresh

- **Interval:** 30 seconds
- **Behavior:**
  - Fetches latest analytics data
  - Updates all metrics and charts
  - Refreshes recent users table
  - Smooth transition (no flicker)
- **Pause:** Automatically pauses on error
- **Visual Indicator (Future):** Last updated timestamp

### User Interactions

**Refresh Button:**
- Manual refresh trigger
- Icon: Circular arrow
- Location: Top right of page
- Click: Immediately fetches new data

**Time Range Selector (Future):**
- Dropdown: Last 7 days, 30 days, 90 days, Custom
- Applies to all charts
- Persists in localStorage

**Chart Interactions:**
- Hover: Show tooltips with exact values
- Click legend: Toggle data series (future)

### Performance

- **Load Time:** <2 seconds
- **Chart Render:** <500ms
- **Auto-Refresh:** Non-blocking (background fetch)

### Accessibility

- ✅ Chart alt text descriptions
- ✅ Keyboard navigation
- ✅ Screen reader announcements on data updates
- ✅ High contrast mode support

### Responsive Design

**Desktop (≥1024px):**
- 4-column metrics grid
- 2-column charts grid
- Full-width table

**Tablet (768px - 1023px):**
- 2-column metrics grid
- 1-column charts grid (stacked)
- Full-width table

**Mobile (<768px):**
- 1-column layout (all stacked)
- Smaller chart heights
- Horizontal scroll on table

---

## Users List Page

**Route:** `/users`
**Access:** Admin, Super Admin, Support (requires 'users.view' permission)
**Layout:** Main Layout (sidebar + header + content)

### Page Description

The users list page displays all app users in a paginated, searchable, filterable table. Admins can view user details, search by email/username, filter by status, and perform ban/unban actions.

### Visual Design

**Layout:**
- Page header with title
- Search and filter toolbar
- Data table (full width)
- Pagination controls (bottom)

**Color Scheme:**
- Table: White background with alternating row colors
- Active badge: Green
- Banned badge: Red
- Subscription badges: Blue (Free), Purple (Pro), Orange (Premium)

### Components

#### 1. Page Header

- **Title:** "Users" (large, bold)
- **Count:** "1,475 total users" (subtitle)
- **Refresh Button:** Icon button (top right)

#### 2. Toolbar

**Search Bar (Left):**
- Icon: Magnifying glass
- Placeholder: "Search by email or username"
- Width: 300px
- Debounced input (500ms)
- Clear button (X icon)

**Status Filter (Right):**
- Dropdown selector
- Options: All Users, Active Only, Banned Only
- Default: All Users
- Width: 150px

#### 3. Data Table

**Columns:**

| Column | Width | Content | Sortable |
|--------|-------|---------|----------|
| User | 30% | Avatar + Name + Email | No |
| Location | 15% | Country name | No |
| Subscription | 15% | Badge | No |
| Status | 10% | Active/Banned badge | No |
| Joined | 15% | Relative time | Yes |
| Actions | 15% | View/Ban/Unban buttons | No |

**Row Details:**

**User Cell:**
- Avatar (40x40px circle)
- Full name (bold)
- Email (gray, smaller)
- Username (gray, @handle)

**Location Cell:**
- Country flag emoji
- Country name

**Subscription Cell:**
- Badge with tier name
- Color-coded (Free=blue, Pro=purple, Premium=orange)

**Status Cell:**
- "Active" badge (green) or "Banned" badge (red)

**Joined Cell:**
- Relative time (e.g., "2 hours ago", "3 days ago")
- Tooltip shows exact date on hover

**Actions Cell:**
- "View" button (blue outline)
- "Ban" button (red, shown if active)
- "Unban" button (green, shown if banned)

#### 4. Pagination Controls

- First page button (|◀)
- Previous page button (◀)
- Page indicator: "Page 1 of 59"
- Next page button (▶)
- Last page button (▶|)
- Results per page: 25 users

### States

**Loading State:**
- Skeleton rows (25 placeholders)
- Gray animated boxes
- Disabled controls

**Loaded State:**
- All user data displayed
- Interactive buttons
- Active pagination

**Empty State (No Results):**
- "No users found" message
- Search/filter reset buttons

**Error State:**
- Error icon
- "Failed to load users" message
- Retry button

### User Interactions

**Search:**
1. User types in search bar
2. Wait 500ms after last keystroke
3. Fetch filtered results
4. Update table
5. Reset to page 1

**Filter:**
1. User selects status filter
2. Immediate fetch with filter applied
3. Update table
4. Reset to page 1

**Sort:**
1. User clicks sortable column header
2. Toggle ascending/descending
3. Fetch sorted results
4. Update table
5. Show sort indicator (↑ or ↓)

**Pagination:**
1. User clicks next/previous/first/last
2. Fetch new page
3. Update table
4. Scroll to top

**View User:**
1. User clicks "View" button
2. Navigate to `/users/:id`

**Ban User:**
1. User clicks "Ban" button
2. Confirmation dialog appears
3. Admin enters ban reason
4. Clicks "Confirm Ban"
5. API call to ban user
6. Table row updates (shows "Banned" badge)
7. Toast notification: "User banned"
8. Audit log created

**Unban User:**
1. User clicks "Unban" button
2. Confirmation dialog
3. Clicks "Confirm Unban"
4. API call to unban
5. Table row updates (shows "Active" badge)
6. Toast notification: "User unbanned"
7. Audit log created

### Dialogs

**Ban User Dialog:**
- Title: "Ban User"
- Message: "Are you sure you want to ban [username]?"
- Reason textarea (required, min 10 chars)
- Placeholder: "Enter ban reason (e.g., spam, harassment)"
- Cancel button (gray)
- Confirm button (red)

**Unban User Dialog:**
- Title: "Unban User"
- Message: "Are you sure you want to unban [username]?"
- Note: "This user will be able to access the platform again."
- Cancel button (gray)
- Confirm button (green)

### Performance

- **Load Time:** <1 second (25 users)
- **Search Debounce:** 500ms
- **Pagination:** Client-side (fast)

### Accessibility

- ✅ Keyboard navigation (Tab through rows)
- ✅ Enter to activate buttons
- ✅ ARIA labels on all interactive elements
- ✅ Screen reader table headers
- ✅ Focus indicators

### Responsive Design

**Desktop (≥1024px):**
- Full table with all columns
- 25 users per page

**Tablet (768px - 1023px):**
- Hide Location column
- 20 users per page

**Mobile (<768px):**
- Card layout (no table)
- Stack user info vertically
- Show only essential fields
- 10 users per page

---

## User Detail Page

**Route:** `/users/:id`
**Access:** Admin, Super Admin, Support (requires 'users.view' permission)
**Layout:** Main Layout (sidebar + header + content)

### Page Description

The user detail page provides a comprehensive view of a single user's profile, statistics, motorcycles, and activity. Admins can ban/unban users from this page.

### Visual Design

**Layout:**
- Breadcrumb navigation (top)
- User profile section (top)
- Statistics grid (middle)
- Motorcycles section (bottom)
- Action buttons (bottom)

**Color Scheme:**
- Profile card: White with shadow
- Stats cards: White with colored icons
- Status badges: Green (active) or Red (banned)

### Components

#### 1. Breadcrumb Navigation

- Home > Users > [Username]
- Clickable links
- Current page not clickable

#### 2. User Profile Card

**Left Side (Avatar):**
- Large profile photo (120x120px)
- Circular crop
- Fallback: Initials with colored background

**Right Side (Info):**
- Full name (large, bold)
- Username (@handle, gray)
- Email (gray, with mailto link)
- Bio/description (italic)
- Location (icon + city, country)
- Status badge (Active or Banned)

**Ban Details (If Banned):**
- Red alert box below profile
- "This user has been banned"
- Ban reason: [reason text]
- Banned by: [admin name]
- Banned on: [date]

#### 3. Statistics Grid (4 Columns)

**Total Rides:**
- Icon: Motorcycle (blue)
- Number: e.g., "127"
- Label: "Total Rides"

**Total Posts:**
- Icon: Post (green)
- Number: e.g., "89"
- Label: "Posts Created"

**Followers:**
- Icon: Users (purple)
- Number: e.g., "245"
- Label: "Followers"

**Following:**
- Icon: User Follow (orange)
- Number: e.g., "182"
- Label: "Following"

#### 4. Account Details Card

**Left Column:**
- **Reputation:** Score + tier badge
- **Subscription:** Free/Pro/Premium badge
- **Joined:** Exact date + relative time
- **Last Active:** Exact date + relative time

**Right Column:**
- **Total Distance:** e.g., "1,247 km"
- **Total Ride Time:** e.g., "42 hours"
- **Groups Joined:** e.g., "5 groups"
- **Marketplace Listings:** e.g., "3 active"

#### 5. Motorcycles Section

**Title:** "Registered Motorcycles"

**Motorcycle Cards (Grid):**
- Motorcycle photo (if available)
- Make and model (e.g., "Honda CB650R")
- Year (e.g., "2023")
- Primary bike indicator (star icon)
- License plate

**Empty State:**
- "No motorcycles registered"
- Icon placeholder

#### 6. Recent Activity Section (Future)

- Recent posts
- Recent rides
- Recent comments

#### 7. Action Buttons (Bottom)

**Ban User Button (If Active):**
- Red button
- Icon: Ban icon
- Text: "Ban User"
- Full width on mobile

**Unban User Button (If Banned):**
- Green button
- Icon: Check icon
- Text: "Unban User"
- Full width on mobile

**Back to Users Button:**
- Gray outline button
- Icon: Arrow left
- Text: "Back to Users"

### States

**Loading State:**
- Skeleton for profile card
- Skeleton for stats grid
- Skeleton for motorcycles

**Loaded State:**
- All user data displayed
- Interactive buttons

**Error State (User Not Found):**
- 404 page
- "User not found" message
- Back to users button

**Error State (Failed to Load):**
- Error icon
- "Failed to load user details"
- Retry button

### User Interactions

**Ban User:**
1. Click "Ban User" button
2. Dialog appears (same as users list)
3. Enter ban reason
4. Confirm
5. Page refreshes with ban details shown

**Unban User:**
1. Click "Unban User" button
2. Confirmation dialog
3. Confirm
4. Page refreshes, ban details removed

**Navigate Back:**
1. Click "Back to Users"
2. Return to `/users` (preserves filters/page)

**Click Email:**
1. Opens default email client
2. Pre-filled "To:" field

### Performance

- **Load Time:** <1 second
- **Image Loading:** Progressive (blur placeholder)

### Accessibility

- ✅ Heading hierarchy (h1, h2, h3)
- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Alt text on images

### Responsive Design

**Desktop (≥1024px):**
- 2-column layout (profile + stats)
- 4-column stats grid
- 3-column motorcycles grid

**Tablet (768px - 1023px):**
- 1-column layout
- 2-column stats grid
- 2-column motorcycles grid

**Mobile (<768px):**
- Full stack (1 column)
- 1-column stats grid
- 1-column motorcycles grid
- Full-width buttons

---

## Content Moderation Page

**Route:** `/moderation`
**Access:** All admins (all roles can moderate content)
**Layout:** Main Layout (sidebar + header + content)

### Page Description

The content moderation page displays a queue of flagged posts and comments that require review. Moderators can preview content and either approve (keep it) or remove (delete it).

### Visual Design

**Layout:**
- Page header with title
- Filter toolbar
- Data table (full width)
- Pagination controls

**Color Scheme:**
- Table: White background
- Post badge: Blue
- Comment badge: Orange
- Action buttons: Green (approve), Red (remove)

### Components

#### 1. Page Header

- **Title:** "Content Moderation" (large, bold)
- **Count:** "12 flagged items" (subtitle)
- **Refresh Button:** Icon button (top right)

#### 2. Toolbar

**Content Type Filter:**
- Dropdown selector
- Options: All Content, Posts Only, Comments Only
- Default: All Content
- Width: 180px

#### 3. Data Table

**Columns:**

| Column | Width | Content | Sortable |
|--------|-------|---------|----------|
| Content | 35% | Preview text | No |
| Type | 10% | Post/Comment badge | No |
| Author | 15% | Name + avatar | No |
| Reporter | 15% | Name + avatar | No |
| Reason | 15% | Flag reason | No |
| Flagged | 10% | Relative time | Yes |
| Actions | 10% | Preview/Approve/Remove | No |

**Row Details:**

**Content Cell:**
- First 100 characters of text
- "..." if truncated
- Clickable to open preview

**Type Cell:**
- "Post" badge (blue) or "Comment" badge (orange)

**Author Cell:**
- Small avatar (30x30px)
- User's full name

**Reporter Cell:**
- Small avatar
- Reporter's full name

**Reason Cell:**
- Short flag reason
- Examples: "Spam", "Harassment", "Inappropriate"

**Flagged Cell:**
- Relative time (e.g., "2 hours ago")

**Actions Cell:**
- "Preview" button (blue outline, small)
- "Approve" button (green, small)
- "Remove" button (red, small)

#### 4. Pagination Controls

- Same as Users List page
- 25 items per page

### Dialogs

#### Content Preview Dialog

**Header:**
- Title: "Content Preview"
- Close button (X icon, top right)

**Content Section (Full Screen):**

**For Posts:**
- Author info (avatar + name)
- Post text (full)
- Post images (if any)
- Post location (if any)
- Hashtags and mentions (highlighted)
- Like/comment counts
- Created date

**For Comments:**
- Author info
- Comment text (full)
- Parent post preview (gray box)
- Created date

**Flag Details Section:**
- Red alert box
- "This content was flagged by [reporter name]"
- Reason: [flag reason]
- Flagged on: [date]

**Actions (Bottom):**
- "Approve" button (green, left)
- "Remove" button (red, right)
- "Close" button (gray outline)

#### Approve Content Dialog

- Title: "Approve Content"
- Message: "This content will be marked as reviewed and remain visible on the platform. Continue?"
- Cancel button (gray)
- Confirm button (green)

#### Remove Content Dialog

- Title: "Remove Content"
- Message: "⚠️ This content will be permanently deleted. This action cannot be undone. Continue?"
- Warning text (red)
- Cancel button (gray)
- Confirm button (red, bold)

### States

**Loading State:**
- Skeleton rows (25 placeholders)

**Loaded State:**
- All flagged content displayed

**Empty State (No Flagged Content):**
- Success icon (green checkmark)
- "No flagged content"
- "All clear! No content needs moderation."

**Error State:**
- Error icon
- "Failed to load flagged content"
- Retry button

### User Interactions

**Filter by Type:**
1. Select content type from dropdown
2. Fetch filtered results
3. Update table
4. Reset to page 1

**Preview Content:**
1. Click row or "Preview" button
2. Dialog opens with full content
3. Review content and flag details
4. Choose action or close

**Approve Content:**
1. Click "Approve" button (in table or dialog)
2. Confirmation dialog
3. Confirm action
4. API call to approve
5. Content removed from queue
6. Toast: "Content approved"
7. Table refreshes

**Remove Content:**
1. Click "Remove" button (in table or dialog)
2. Warning dialog
3. Confirm deletion
4. API call to delete
5. Content removed from queue
6. Toast: "Content removed"
7. Table refreshes

### Performance

- **Load Time:** <1 second
- **Preview Dialog:** Instant open
- **Actions:** <500ms response

### Accessibility

- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Screen reader support
- ✅ Focus management in dialogs

### Responsive Design

**Desktop (≥1024px):**
- Full table with all columns
- Wide preview dialog

**Tablet (768px - 1023px):**
- Hide Reporter column
- Medium preview dialog

**Mobile (<768px):**
- Card layout (no table)
- Full-screen preview dialog
- Stack action buttons

---

## Navigation & Layout

### Sidebar Navigation

**Logo & Title:**
- Wheelbase logo (top)
- "Admin Panel" text
- Compact mode toggle (future)

**Menu Items:**

| Icon | Label | Route | Badge |
|------|-------|-------|-------|
| 📊 | Dashboard | `/dashboard` | - |
| 👥 | Users | `/users` | Total count |
| 🚦 | Moderation | `/moderation` | Flagged count (red) |

**Future Menu Items (BACKOFFICE-002):**
- 📈 Analytics
- 🔔 Notifications
- 🎫 Support Tickets
- ⚙️ Settings
- 📋 Audit Logs

**Bottom Section:**
- User profile (avatar + name)
- Role badge (e.g., "Super Admin")
- Logout button

### Top Header

**Left Side:**
- Page title (dynamic)
- Breadcrumb (if applicable)

**Right Side:**
- Refresh button (circular arrow icon)
- Notifications bell (future)
- User avatar (dropdown trigger)

**User Dropdown:**
- Profile link
- Settings link
- Logout link

### States

**Active Route:**
- Highlighted in sidebar (yellow background)
- Bold text
- Border indicator (left side)

**Collapsed Sidebar (Future):**
- Show only icons
- Expand on hover
- Toggle button

### Responsive Behavior

**Desktop (≥1024px):**
- Fixed sidebar (always visible)
- Content area beside sidebar

**Tablet (768px - 1023px):**
- Collapsible sidebar
- Hamburger menu toggle
- Overlay sidebar

**Mobile (<768px):**
- Hidden sidebar
- Hamburger menu (top left)
- Full-screen menu overlay
- Swipe to close

---

## Global UI Elements

### Toast Notifications

**Position:** Top right corner
**Duration:** 3 seconds (auto-dismiss)
**Types:**
- Success (green): "User banned successfully"
- Error (red): "Failed to load data"
- Warning (orange): "Session expiring soon"
- Info (blue): "Refreshing data..."

**Features:**
- Stacked (multiple toasts)
- Close button (X icon)
- Progress bar (countdown)
- Slide in/out animation

### Loading States

**Skeleton Loaders:**
- Gray boxes with pulse animation
- Match actual content layout
- Preserve dimensions (no layout shift)

**Spinners:**
- Circular spinner for buttons
- Full-page spinner for route changes

### Error States

**Inline Errors:**
- Red text below form fields
- Icon + message
- Retry button (if applicable)

**Page-Level Errors:**
- Large error icon
- Error message
- "Retry" or "Go Back" button

### Empty States

**Illustrations:**
- Friendly icon or graphic
- Descriptive message
- Call-to-action button

**Examples:**
- "No users found" (users list)
- "No flagged content" (moderation)
- "No motorcycles registered" (user detail)

---

## Keyboard Shortcuts (Future)

| Shortcut | Action |
|----------|--------|
| `/` | Focus search bar |
| `Esc` | Close dialog/modal |
| `?` | Show keyboard shortcuts |
| `r` | Refresh current page |
| `g d` | Go to dashboard |
| `g u` | Go to users |
| `g m` | Go to moderation |

---

## URL Structure

### Routes with Parameters

**User Detail:**
- Pattern: `/users/:id`
- Example: `/users/550e8400-e29b-41d4-a716-446655440000`

**Query Parameters (Future):**
- Search: `/users?search=john`
- Filter: `/users?status=banned`
- Page: `/users?page=2`
- Combined: `/users?search=john&status=active&page=3`

### Deep Linking

All pages support deep linking. Admins can:
- Bookmark specific pages
- Share URLs with team members
- Navigate browser history (back/forward)

---

**Document Version:** 1.0.0
**Last Updated:** December 28, 2024
**Total Pages:** 5 (MVP) + Future expansions
