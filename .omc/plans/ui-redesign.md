# CSTOM UI/UX Redesign - Implementation Plan

## Context

### Original Request
Redesign the CSTOM maintenance management system UI from a generic SaaS look to a professional government-institution design system with sidebar navigation, semantic design tokens, improved information hierarchy, breadcrumbs, and better loading states.

### Interview Summary
- **System**: KRIHS (Korea Research Institute for Human Settlements) IT maintenance management
- **Tech**: Next.js 15.5.9, React 19, Tailwind CSS 4, Django REST API backend
- **Language**: Korean UI throughout
- **Constraints**: Backend untouched, no API changes, keep all features, maintain responsive + print + PWA
- **Design direction**: "Accessible & Ethical" - high contrast, WCAG AAA, government-appropriate

### Research Findings
- 15 admin modules across 3 categories (Operations, Documents, System)
- Current layout: horizontal navbar with dropdowns, no sidebar, no breadcrumbs
- Current design tokens: only `--background` and `--foreground` CSS variables
- All list pages share identical pattern: server component + SearchInput + FilterSelect + Pagination
- All detail pages share identical pattern: server component + card layout + action buttons
- Print styles exist in globals.css and must be preserved
- Modal system uses portal rendering with backdrop blur
- Auth uses cookie-based JWT tokens with auto-refresh

---

## Work Objectives

### Core Objective
Transform CSTOM from a generic admin template into a professional, government-grade design system with proper navigation, information hierarchy, and consistent styling.

### Deliverables
1. Semantic design token system (CSS variables + Tailwind integration)
2. Collapsible sidebar navigation with active state indicators
3. Breadcrumb navigation for all nested pages
4. Improved KPI dashboard with executive-style cards
5. Consistent typography, color, and spacing system across all pages
6. Professional login page with institutional branding
7. Enhanced UI components (skeleton, pagination, search, filter, modal)

### Definition of Done
- All 15 admin modules render correctly with new design
- Sidebar collapses on mobile into a drawer
- Active navigation state shows current page
- Breadcrumbs appear on all pages with depth > 1
- Print styles still work (reports print correctly)
- PWA functionality unchanged
- No TypeScript errors
- No broken API calls
- Korean text renders correctly throughout

---

## Guardrails

### Must Have
- Sidebar navigation replacing top navbar
- Design tokens in CSS variables
- Breadcrumb component
- Active nav indicator
- Consistent color system
- Mobile responsive sidebar (drawer)
- Preserved print styles
- WCAG AA minimum contrast ratios

### Must NOT Have
- Backend/API changes
- New npm dependencies for UI framework (no shadcn, no MUI - pure Tailwind)
- Dark mode (out of scope for v1)
- Breaking changes to URL structure
- Changes to authentication flow
- Changes to data fetching patterns

---

## Task Flow and Dependencies

```
Phase 1: Foundation (sequential)
  T1 Design Tokens ──> T2 Sidebar Component ──> T3 Layout Integration
                                                       |
Phase 2: Navigation (after T3)                         v
  T4 Breadcrumbs ──────────────────────────────> T5 Active Nav State
                                                       |
Phase 3: Components (parallel, after T1)               v
  T6 Login Page ─────┐
  T7 UI Components ──┤── (all parallel) 
  T8 Modal/Footer ───┘
                                                       |
Phase 4: Pages (parallel, after T3+T4)                 v
  T9 Dashboard ──────┐
  T10 List Pages ────┤── (all parallel)
  T11 Detail Pages ──┘
                                                       |
Phase 5: Polish (after all above)                      v
  T12 Print Styles ──> T13 Final QA
```

---

## Detailed Tasks

---

### T1: Design Token System

**Priority**: CRITICAL - everything depends on this
**Dependencies**: None
**Parallelizable**: No (foundation for all other tasks)
**Category**: `visual-engineering`
**Agent**: `oh-my-claudecode:executor` (sonnet)
**Skills**: `frontend-ui-ux`
**Estimated scope**: 1 file (major rewrite)

**File**: `frontend/src/app/globals.css`

**Acceptance Criteria**:
- CSS custom properties defined for all semantic colors
- Tailwind CSS 4 `@theme` block maps variables to utility classes
- Print styles preserved unchanged
- Existing animation keyframes preserved

**CRITICAL: Tailwind CSS 4 Syntax**
- This project uses Tailwind CSS v4.1.18 with `@tailwindcss/postcss`
- Must use `@theme inline { ... }` (NOT `@theme { ... }`)
- The `inline` keyword is REQUIRED for CSS variable resolution chains
- Verify after implementation: `npm run build` must succeed and utility classes like `bg-surface`, `text-text` must generate

**Detailed Changes**:

Replace the minimal `:root` block and existing `@theme inline` block with a comprehensive design token system:

```css
@theme inline {
  /* --- Color Tokens --- */
  --color-primary: #0F172A;          /* slate-900 - primary brand */
  --color-primary-light: #1E293B;    /* slate-800 */
  --color-secondary: #334155;        /* slate-700 */
  --color-secondary-light: #475569;  /* slate-600 */
  
  --color-accent: #0369A1;           /* blue-700 - CTA/links */
  --color-accent-hover: #075985;     /* blue-800 */
  --color-accent-light: #E0F2FE;    /* blue-50 - accent backgrounds */
  --color-accent-muted: #BAE6FD;    /* blue-200 */
  
  --color-surface: #FFFFFF;          /* card/panel backgrounds */
  --color-surface-raised: #F8FAFC;   /* slate-50 - page background */
  --color-surface-sunken: #F1F5F9;   /* slate-100 - inset areas */
  --color-surface-hover: #E2E8F0;    /* slate-200 - hover states */
  
  --color-border: #CBD5E1;           /* slate-300 */
  --color-border-light: #E2E8F0;     /* slate-200 */
  --color-border-strong: #94A3B8;    /* slate-400 */
  
  --color-text: #020617;             /* slate-950 - primary text */
  --color-text-secondary: #334155;   /* slate-700 - secondary text */
  --color-text-muted: #64748B;       /* slate-500 - muted/helper */
  --color-text-on-primary: #FFFFFF;  /* text on primary bg */
  --color-text-on-accent: #FFFFFF;   /* text on accent bg */
  
  /* Status colors */
  --color-success: #15803D;          /* green-700 */
  --color-success-bg: #F0FDF4;       /* green-50 */
  --color-success-border: #BBF7D0;   /* green-200 */
  
  --color-warning: #A16207;          /* yellow-700 */
  --color-warning-bg: #FEFCE8;       /* yellow-50 */
  --color-warning-border: #FEF08A;   /* yellow-200 */
  
  --color-danger: #B91C1C;           /* red-700 */
  --color-danger-bg: #FEF2F2;        /* red-50 */
  --color-danger-border: #FECACA;    /* red-200 */
  
  --color-info: #0369A1;             /* blue-700 */
  --color-info-bg: #F0F9FF;          /* blue-50 */
  --color-info-border: #BAE6FD;      /* blue-200 */
  
  /* --- Typography --- */
  --font-sans: 'Geist', system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  
  /* --- Spacing --- */
  --space-page: 1.5rem;       /* page-level padding */
  --space-section: 1.25rem;   /* between sections */
  --space-card: 1.25rem;      /* inside cards */
  --space-inline: 0.75rem;    /* between inline elements */
  
  /* --- Shadows --- */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08);
  --shadow-dropdown: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-modal: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* --- Borders --- */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  /* --- Layout --- */
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 64px;
  --header-height: 56px;
  
  /* --- Focus --- */
  --ring-width: 3px;
  --ring-color: #0369A1;
  --ring-offset: 2px;
}
```

Also add base layer utilities:
```css
@layer base {
  *:focus-visible {
    outline: var(--ring-width) solid var(--ring-color);
    outline-offset: var(--ring-offset);
  }
  
  /* Skip link for accessibility */
  .skip-link {
    position: absolute;
    top: -100%;
    left: 1rem;
    z-index: 100;
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: var(--color-text-on-primary);
    border-radius: var(--radius-md);
    transition: top 0.2s;
  }
  .skip-link:focus {
    top: 0.5rem;
  }
}
```

**Mandatory Verification After T1**:
```bash
cd frontend && npm run build
```
- Must exit 0
- Must NOT show "Unknown theme value" or "Cannot apply unknown utility class" errors
- Quick test: create a temporary `<div className="bg-surface text-text">test</div>` and verify it renders with correct colors

---

### T2: Sidebar Navigation Component

**Priority**: CRITICAL
**Dependencies**: T1 (design tokens)
**Parallelizable**: No (T3 depends on this)
**Category**: `visual-engineering`
**Agent**: `oh-my-claudecode:designer` (sonnet)
**Skills**: `frontend-ui-ux`
**Estimated scope**: 1 new file (~350 lines)

**File**: `frontend/src/components/ui/sidebar.tsx` (NEW)

**Acceptance Criteria**:
- Client component with `"use client"` directive
- Collapsible sidebar (expanded/collapsed toggle)
- Mobile: off-canvas drawer with overlay backdrop
- Active route highlighting using `usePathname()`
- Three nav groups matching current: 운영관리, 문서관리, 시스템
- Group headings that collapse/expand
- Logout button at bottom
- KRIHS logo/branding at top
- Smooth transitions for expand/collapse
- Keyboard navigable (Tab, Enter, Escape)
- Touch targets >= 44x44px
- Uses design tokens from T1

**Component API**:
```typescript
// Sidebar state persisted in localStorage
interface SidebarProps {
  children?: React.ReactNode;
}

// Internal state
// - isExpanded: boolean (desktop collapse toggle)
// - isMobileOpen: boolean (mobile drawer)
// - expandedGroups: Set<string> (which nav groups are open)

// Navigation structure (hardcoded, matching current admin-header.tsx):
const NAV_GROUPS = [
  {
    label: '운영관리',
    icon: ClipboardIcon,  // Use inline SVG icons, no new dependency
    items: [
      { label: '사업관리', href: '/contracts' },
      { label: '작업관리', href: '/tasks' },
      { label: '예방점검', href: '/inspections' },
      { label: '변경/장애', href: '/events' },
      { label: '티켓', href: '/tickets' },
      { label: '인력관리', href: '/workforce' },
    ]
  },
  {
    label: '문서관리',
    icon: DocumentIcon,
    items: [
      { label: 'SOP', href: '/sop' },
      { label: 'SLA', href: '/sla' },
      { label: '지식베이스', href: '/kb' },
      { label: '보고서', href: '/reports' },
    ]
  },
  {
    label: '시스템',
    icon: CogIcon,
    items: [
      { label: '장비관리', href: '/equipments' },
      { label: '사용자', href: '/users' },
      { label: 'AI 예측', href: '/predictions' },
      { label: 'QR 스캔', href: '/scan' },
    ]
  }
];
```

**Layout behavior**:
- Desktop (md+): Sidebar fixed left, content area to the right with `margin-left`
- Collapsed: Only icons visible (64px wide), tooltip on hover for label
- Mobile (<md): Hidden by default, hamburger button reveals drawer with backdrop overlay
- Transition: `width` and `margin-left` with 200ms ease

---

### T3: Admin Layout Integration

**Priority**: CRITICAL
**Dependencies**: T1 + T2
**Parallelizable**: No (T4, T5, T9-T11 depend on this)
**Category**: `visual-engineering`
**Agent**: `oh-my-claudecode:executor` (sonnet)
**Skills**: `frontend-ui-ux`
**Estimated scope**: 2 files

**Files**:
- `frontend/src/app/(admin)/layout.tsx` (modify)
- `frontend/src/components/admin-header.tsx` (major modify or deprecate)

**Acceptance Criteria**:
- Admin layout uses Sidebar instead of AdminHeader
- Content area takes remaining width beside sidebar
- Skip link added before sidebar for accessibility
- `<main>` has `id="main-content"` for skip link target
- Footer remains at bottom of content area (not full width)
- ErrorBoundary still wraps children
- Mobile hamburger trigger is part of a slim top bar (mobile only)
- Print styles hide sidebar entirely

**New layout structure**:
```tsx
// frontend/src/app/(admin)/layout.tsx
<div className="min-h-screen bg-surface-raised flex">
  <a href="#main-content" className="skip-link">본문으로 건너뛰기</a>
  <Sidebar />
  <div className="flex-1 flex flex-col min-h-screen transition-all duration-200 md:ml-[var(--sidebar-width)]">
    {/* Mobile top bar - only shows on mobile */}
    <div className="md:hidden h-14 bg-surface border-b border-border flex items-center px-4">
      <SidebarMobileTrigger />
      <span className="ml-3 font-semibold text-text">CSTOM</span>
    </div>
    <main id="main-content" className="flex-1 p-6">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </main>
    <Footer />
  </div>
</div>
```

**AdminHeader disposition**:
- Keep the file but gut it: remove all navigation
- Or better: delete the dropdown navigation entirely, keep only as a reference file
- The sidebar completely replaces AdminHeader's navigation role
- The mobile top bar in layout.tsx replaces the mobile hamburger

---

### T4: Breadcrumb Component

**Priority**: HIGH
**Dependencies**: T1 (design tokens). Note: T4 does NOT depend on T3 because breadcrumbs derive routes from URL path, not from layout structure. The route-label map is hardcoded in this component.
**Parallelizable**: Yes (can run parallel with T2 after T1)
**Category**: `quick`
**Agent**: `oh-my-claudecode:executor-low` (haiku)
**Skills**: `frontend-ui-ux`
**Estimated scope**: 1 new file (~80 lines)

**File**: `frontend/src/components/ui/breadcrumb.tsx` (NEW)

**Acceptance Criteria**:
- Client component using `usePathname()`
- Auto-generates breadcrumbs from URL path
- Korean labels for all known routes
- Separator: `>` or `/` character (not icon, for simplicity)
- Last item is current page (not a link, bold)
- First item is always "홈" linking to `/dashboard`
- Accessible: `<nav aria-label="breadcrumb">` with `<ol>`
- Dynamic segments (e.g., `[contractId]`) show "상세" or fetched name

**Route label map**:
```typescript
const ROUTE_LABELS: Record<string, string> = {
  dashboard: '대시보드',
  contracts: '사업관리',
  tasks: '작업관리',
  inspections: '예방점검',
  events: '변경/장애',
  tickets: '티켓',
  workforce: '인력관리',
  sop: 'SOP',
  sla: 'SLA',
  kb: '지식베이스',
  reports: '보고서',
  equipments: '장비관리',
  users: '사용자',
  predictions: 'AI 예측',
  scan: 'QR 스캔',
  new: '신규',
  edit: '수정',
};
```

---

### T5: Active Navigation State

**Priority**: HIGH
**Dependencies**: T2 (sidebar), T3 (layout integration)
**Parallelizable**: No
**Category**: `quick`
**Agent**: `oh-my-claudecode:executor-low` (haiku)
**Estimated scope**: Modification within sidebar.tsx

**File**: `frontend/src/components/ui/sidebar.tsx` (modify from T2)

**Acceptance Criteria**:
- Current route highlighted with accent-light background + accent left border
- Parent group auto-expanded when child route is active
- Active item text uses accent color
- Non-active items use text-secondary color
- Hover state: surface-hover background

**Implementation note**: This may already be built into T2 if the sidebar component uses `usePathname()` for active state detection. If T2 already handles this fully, T5 becomes a verification-only task. The task exists to ensure it is explicitly verified and not overlooked.

---

### T6: Login Page Redesign

**Priority**: MEDIUM
**Dependencies**: T1 (design tokens)
**Parallelizable**: Yes (independent of T2/T3)
**Category**: `visual-engineering`
**Agent**: `oh-my-claudecode:designer` (sonnet)
**Skills**: `frontend-ui-ux`
**Estimated scope**: 1 file

**File**: `frontend/src/app/login/page.tsx`

**Acceptance Criteria**:
- Professional government institution login page
- KRIHS branding (국토연구원 logo area, system name)
- Left panel: institutional branding / illustration area
- Right panel: login form
- On mobile: single column, branding above form
- Uses design tokens (no hardcoded colors)
- Error states use danger token colors
- Loading state uses proper spinner (not text)
- Minimum touch target 44x44px for submit button
- Focus rings on inputs using design token
- Preserved: all existing form logic, API calls, error handling, redirect behavior

**Current form logic to preserve**:
```
- useState for email, password, error, loading
- handleLogin calls authApi.login()
- Stores tokens via setTokens()
- Redirects to /contracts on success
- Shows error message on failure
```

---

### T7: UI Component Improvements

**Priority**: MEDIUM
**Dependencies**: T1 (design tokens)
**Parallelizable**: Yes (independent of T2/T3)
**Category**: `visual-engineering`
**Agent**: `oh-my-claudecode:executor` (sonnet)
**Skills**: `frontend-ui-ux`
**Estimated scope**: 4 files

**Files**:
- `frontend/src/components/ui/skeleton.tsx` (modify)
- `frontend/src/components/ui/pagination.tsx` (modify)
- `frontend/src/components/ui/search-input.tsx` (modify)
- `frontend/src/components/ui/filter-select.tsx` (modify)

**Acceptance Criteria for each**:

**skeleton.tsx**:
- Use `bg-surface-sunken` instead of `bg-gray-200`
- Consistent border-radius using `rounded-md` token
- Skeleton for breadcrumb row added
- Ensure animation is subtle (reduce opacity range)

**pagination.tsx**:
- Active page uses accent color background
- Buttons use design token colors
- Disabled state uses text-muted
- Touch targets >= 44x44px on mobile
- Border uses border token

**search-input.tsx**:
- Border uses border token color
- Focus ring uses accent color (3px)
- Icon color uses text-muted
- Background uses surface token
- Placeholder text uses text-muted

**filter-select.tsx**:
- Same token treatment as search-input
- Dropdown arrow color uses text-muted
- Selected state readable with proper contrast
- Border uses border token

---

### T8: Modal and Footer Improvements

**Priority**: MEDIUM
**Dependencies**: T1 (design tokens)
**Parallelizable**: Yes (independent of T2/T3)
**Category**: `quick`
**Agent**: `oh-my-claudecode:executor-low` (haiku)
**Estimated scope**: 3 files

**Files**:
- `frontend/src/components/modal.tsx` (modify)
- `frontend/src/components/confirm-modal.tsx` (modify)
- `frontend/src/components/footer.tsx` (modify)

**Acceptance Criteria**:

**modal.tsx**:
- Header background: surface-sunken
- Border: border token
- Shadow: shadow-modal token
- Close button: proper focus ring
- Title: text-text color

**confirm-modal.tsx**:
- Destructive button: danger token colors
- Normal button: accent token colors
- Cancel button: surface-hover background with border

**footer.tsx**:
- Background: surface (white)
- Border-top: border token
- Text: text-muted color
- Add copyright text: "KRIHS 국토연구원 CSTOM" 
- Reduce vertical padding (currently looks spacious)

---

### T9: Dashboard Redesign

**Priority**: HIGH
**Dependencies**: T1 + T3 (needs design tokens and new layout)
**Parallelizable**: Yes (parallel with T10, T11)
**Category**: `visual-engineering`
**Agent**: `oh-my-claudecode:designer` (sonnet)
**Skills**: `frontend-ui-ux`
**Estimated scope**: 1 file

**File**: `frontend/src/app/(admin)/dashboard/page.tsx`

**Acceptance Criteria**:
- Add Breadcrumb at top
- KPI cards: Executive style with large number, trend indicator, subtle icon
- KPI cards use semantic status colors (success for good, warning for attention, danger for bad)
- Cards have left-border accent color for visual distinction
- Period selector uses design tokens
- Charts maintain Recharts usage but update colors to design token palette
- Stats grid uses consistent card style
- Data tables use consistent header styling
- All text uses token colors (no hardcoded gray-600 etc.)
- Preserved: all data fetching, API calls, chart logic, period selector logic

**Dashboard layout with sidebar**:
```
[Sidebar] | [Breadcrumb: 홈 > 대시보드        ]
          | [KPI Card][KPI Card][KPI Card][KPI Card]
          | [Pie Chart        ][Bar Chart         ]
          | [Stats: 5 mini cards                  ]
          | [Table: Contracts ][Table: Incidents  ]
          | [Table: Equipment ][Table: Tasks      ]
```

---

### T10: List Page Template Update

**Priority**: HIGH
**Dependencies**: T1 + T3 + T4 (needs tokens, layout, breadcrumbs)
**Parallelizable**: Yes (parallel with T9, T11)
**Category**: `visual-engineering`
**Agent**: `oh-my-claudecode:executor` (sonnet)
**Skills**: `frontend-ui-ux`
**Estimated scope**: 6-10 files (update pattern across all list pages)

**Files** (all list pages follow same pattern - update ALL):
- `frontend/src/app/(admin)/contracts/page.tsx`
- `frontend/src/app/(admin)/tasks/page.tsx`
- `frontend/src/app/(admin)/inspections/page.tsx`
- `frontend/src/app/(admin)/events/page.tsx`
- `frontend/src/app/(admin)/tickets/page.tsx`
- `frontend/src/app/(admin)/workforce/page.tsx`
- `frontend/src/app/(admin)/sop/page.tsx`
- `frontend/src/app/(admin)/sla/page.tsx`
- `frontend/src/app/(admin)/kb/page.tsx`
- `frontend/src/app/(admin)/reports/page.tsx`
- `frontend/src/app/(admin)/equipments/page.tsx`
- `frontend/src/app/(admin)/users/page.tsx`
- `frontend/src/app/(admin)/predictions/page.tsx`

**Acceptance Criteria**:
- Add `<Breadcrumb />` at top of every page
- Page title: `text-2xl font-semibold text-text` (not `text-black font-bold`)
- Cards: `bg-surface rounded-lg shadow-card border border-border-light p-5`
- Table headers: `bg-surface-sunken text-text-secondary text-sm font-medium`
- Table rows: `border-b border-border-light hover:bg-surface-sunken`
- Status badges: use semantic status token colors
- "New" button: `bg-accent text-text-on-accent hover:bg-accent-hover`
- Empty state: centered with muted text and icon
- All hardcoded colors replaced with design token classes
- Mobile card view also updated with tokens
- Preserved: ALL data fetching, filtering, pagination, search logic

**Strategy**: Update `contracts/page.tsx` first as reference, then apply same pattern to all other list pages. Most changes are class-name swaps.

---

### T11: Detail Page Template Update

**Priority**: HIGH
**Dependencies**: T1 + T3 + T4 (needs tokens, layout, breadcrumbs)
**Parallelizable**: Yes (parallel with T9, T10)
**Category**: `visual-engineering`
**Agent**: `oh-my-claudecode:executor` (sonnet)
**Skills**: `frontend-ui-ux`
**Estimated scope**: Variable (all detail/edit/new pages)

**Files** (representative - apply to all `[id]/page.tsx` and `new/page.tsx` patterns):
- `frontend/src/app/(admin)/contracts/[contractId]/page.tsx`
- `frontend/src/app/(admin)/contracts/[contractId]/edit/page.tsx`
- `frontend/src/app/(admin)/contracts/new/page.tsx`
- All other module detail/edit/new pages following same pattern

**Acceptance Criteria**:
- Add `<Breadcrumb />` at top (e.g., 홈 > 사업관리 > 상세)
- Detail header: title + status badge in a card with border-l-4 accent
- Field labels: `text-sm font-medium text-text-secondary`
- Field values: `text-base text-text`
- Cards: consistent token-based styling
- Action buttons: accent for primary, surface-hover for secondary, danger for delete
- Back link: text-accent with hover underline
- Form inputs on edit/new: border-border, focus:ring-accent, bg-surface
- All hardcoded colors replaced
- Preserved: ALL form logic, validation, API calls, redirects

---

### T12: Print Style Preservation

**Priority**: HIGH
**Dependencies**: T1 through T11 (after all visual changes)
**Parallelizable**: No (verification task)
**Category**: `quick`
**Agent**: `oh-my-claudecode:executor-low` (haiku)
**Estimated scope**: 1 file

**File**: `frontend/src/app/globals.css` (modify print section)

**Acceptance Criteria**:
- Sidebar hidden on print: add `data-sidebar` attribute to sidebar root element, then `.sidebar, [data-sidebar] { display: none !important; }`
- Breadcrumb visible on print (provides context)
- Content area takes full width on print: `margin-left: 0 !important`
- Mobile top bar hidden on print
- All existing print rules preserved (A4 margins, hidden buttons, compact spacing)
- Test: verify report pages render correctly in print preview

---

### T13: Final QA and Verification

**Priority**: CRITICAL
**Dependencies**: T1 through T12 (ALL tasks)
**Parallelizable**: No (final gate)
**Category**: `ultrabrain`
**Agent**: `oh-my-claudecode:architect` (opus)
**Estimated scope**: Verification only (no file changes expected)

**Acceptance Criteria**:
- `tsc --noEmit` passes with zero errors
- `npm run build` succeeds
- All 15 admin modules load without errors
- Sidebar navigation works: expand, collapse, mobile drawer
- Active state highlights correct page
- Breadcrumbs show on all pages
- Login page renders correctly
- Dashboard KPI cards display data
- Print preview shows content without sidebar
- Mobile responsive: sidebar drawer works
- All buttons, links, modals function correctly
- No hardcoded color classes remaining (no `text-gray-600`, `bg-white` etc. in page files)
- Design tokens used consistently

**Verification commands**:
```bash
cd frontend && npx tsc --noEmit
cd frontend && npm run build
```

---

## Parallelization Strategy

### Wave 1: Foundation (Sequential)
```
T1 (Design Tokens) 
  -> T2 (Sidebar Component)
    -> T3 (Layout Integration)
```
**Estimated**: 3 sequential tasks, moderate complexity each

### Wave 2: Components (All Parallel - after T1 completes)
```
T4 (Breadcrumbs)     ]
T6 (Login Page)      ] -- all can run simultaneously
T7 (UI Components)   ] -- they only depend on T1
T8 (Modal/Footer)    ]
```
**Note**: T4 can start as soon as T1 is done, even before T2/T3

### Wave 3: Pages (All Parallel - after T3 + T4 complete)
```
T9 (Dashboard)       ]
T10 (List Pages)     ] -- all can run simultaneously
T11 (Detail Pages)   ]
```
**Note**: These need the sidebar layout (T3) and breadcrumbs (T4) to be ready

### Wave 4: Sequential (Final)
```
T5 (Active Nav State) -- verify/enhance, quick
  -> T12 (Print Styles) -- update after all visual changes
    -> T13 (Final QA) -- must be last
```

### Optimal Execution Order
```
Step 1: T1                              [1 agent]
Step 2: T2 + T4 + T6 + T7 + T8         [5 agents parallel]
Step 3: T3                              [1 agent, needs T2]
Step 4: T5 + T9 + T10 + T11            [4 agents parallel]
Step 5: T12                             [1 agent]
Step 6: T13                             [1 agent]
```

Total: 6 sequential steps with significant parallelism in steps 2 and 4.

---

## Commit Strategy

### Commit 1: Design foundation
- T1: Design tokens in globals.css

### Commit 2: Navigation system
- T2: Sidebar component
- T3: Layout integration
- T5: Active nav state

### Commit 3: Shared components
- T4: Breadcrumbs
- T7: UI component improvements
- T8: Modal/Footer improvements

### Commit 4: Login page
- T6: Login redesign

### Commit 5: Dashboard
- T9: Dashboard redesign

### Commit 6: All pages
- T10: List page updates
- T11: Detail page updates

### Commit 7: Polish
- T12: Print styles
- Any remaining fixes from T13

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Build passes | `npm run build` exits 0 |
| Type-safe | `tsc --noEmit` exits 0 |
| All modules accessible | 15 sidebar links all render pages |
| Active nav works | Visiting /contracts highlights 사업관리 |
| Breadcrumbs work | /contracts/1/edit shows 홈 > 사업관리 > 상세 > 수정 |
| Mobile works | Sidebar drawer opens/closes on mobile |
| Print works | Report pages print without sidebar |
| No regressions | All buttons, forms, modals, search, filter, pagination work |
| Design consistency | No hardcoded gray/blue colors in page files |
| Accessibility | Focus rings visible, skip link works, ARIA labels present |
| Korean UI | All navigation labels, breadcrumbs, UI text in Korean |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tailwind v4 @theme syntax incompatibility | Medium | High | Test T1 tokens early, verify utility class generation |
| Sidebar breaks mobile layout | Low | High | Test mobile drawer separately in T2 before integration |
| Print styles break after sidebar | Medium | Medium | T12 explicitly handles print, test before commit |
| Too many pages to update | Low | Medium | Use pattern from contracts/page.tsx, apply consistently |
| Active nav state edge cases | Low | Low | T5 verifies all 15 routes explicitly |
| Dynamic breadcrumb segments | Low | Low | Default to "상세" for unrecognized dynamic segments |

---

## Metis Pre-Planning Review

### Issues Found and Resolved

1. **CRITICAL: Tailwind v4 `@theme` vs `@theme inline`** - Plan originally used `@theme { }` but the project requires `@theme inline { }`. Fixed in T1.

2. **HIGH: T1 needs build verification** - Added mandatory `npm run build` check after T1 to catch CSS generation failures early. Without this, all downstream tasks would silently fail.

3. **MEDIUM: T4 dependency clarification** - Metis flagged T4 might depend on T3. Analysis shows T4 (breadcrumbs) derives route structure from URL path parsing, not from layout. The route-label map is self-contained. Dependency stays as T1 only, enabling earlier parallelization.

4. **MEDIUM: Print style sidebar handling** - Added explicit `data-sidebar` attribute requirement to sidebar component so print styles can reliably target it.

5. **LOW: Missing file verification** - All files referenced in the plan have been verified to exist through codebase exploration (admin-header.tsx, footer.tsx, modal.tsx, confirm-modal.tsx, login/page.tsx, all UI components).
