# UI & UX Specification: Modern Edge Publishing Platform & CMS

| Document Metadata | Specification |
| :--- | :--- |
| **System** | Modern Edge Publishing Platform with Gutenberg-Style Visual CMS |
| **Design System** | Tailwind CSS v4 Utility Tokens + Clean Editorial Typography |
| **Accessibility Target** | WCAG 2.1 Level AA Compliance |
| **Audience** | UI/UX Designers, Frontend Developers, Design Technologists |
| **Status** | Approved Design System & Interface Specification |

---

## 1. Design Tokens & Styling System

The application uses an editorial design language inspired by print journalism and modern digital publications. High typographic contrast, generous white space, and zero unnecessary visual clutter ensure optimal reading focus.

### 1.1 Color Palette

```text
Primary Brand (Slate / Charcoal)
- Slate-900: #0f172a (Primary text, dark headers, brand darks)
- Slate-800: #1e293b (Card headers, active nav items)
- Slate-600: #475569 (Secondary text, metadata, captions)
- Slate-400: #94a3b8 (Borders, placeholders, disabled states)
- Slate-100: #f1f5f9 (Subtle background cards, code block backgrounds)
- Slate-50:  #f8fafc (App background, reading canvas background)

Accent Colors (Indigo / Violet)
- Indigo-600: #4f46e5 (Primary buttons, link hovers, active focus rings)
- Indigo-700: #4338ca (Button active and hover state)
- Indigo-50:  #eef2ff (Badge backgrounds, alert tint)

System Status Colors
- Success (Emerald): #10b981 (Published badge, save confirmation)
- Warning (Amber):   #f59e0b (Draft badge, modified warning)
- Danger (Rose):     #f43f5e (Delete confirmation, error toast)
```

### 1.2 Typography Hierarchy

| Style Token | Font Family | Size (Desktop / Mobile) | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Title** | Sans-Serif / Serif | 48px / 32px | 1.15 | 800 (Bold) | Hero spotlight headline, reader article title |
| **Heading 2 (`H2`)** | Sans-Serif / Serif | 30px / 24px | 1.25 | 700 (Bold) | Major section headers, article subsections |
| **Heading 3 (`H3`)** | Sans-Serif | 22px / 18px | 1.35 | 600 (Semibold) | Subsection headers, card titles |
| **Body Reading** | Sans-Serif (System) | 18px / 16px | 1.75 | 400 (Regular) | Long-form article reading prose |
| **Metadata / Caption** | Sans-Serif | 14px / 13px | 1.5 | 500 (Medium) | Author bylines, published dates, category tags |
| **Code / Monospace** | JetBrains Mono / Fira | 14px / 13px | 1.6 | 400 (Regular) | Code blocks, inline code, terminal snippets |

---

## 2. Public Website UI Wireframes & Layouts

### 2.1 Global Header Navigation

```text
+---------------------------------------------------------------------------------------+
|  [Logo] AstroPress    Articles   Categories   About   Contact      [Search] [Login]   |
+---------------------------------------------------------------------------------------+
```
- **Height**: 64px sticky navigation bar with subtle backdrop blur (`backdrop-blur-md bg-white/80`).
- **Mobile Behavior**: Collapses to hamburger drawer icon (< 768px). Drawer opens with smooth slide-in animation.

### 2.2 Homepage Layout (`/`)

```text
+---------------------------------------------------------------------------------------+
| HERO SPOTLIGHT ARTICLE                                                                |
| +---------------------------------------------------+-------------------------------+ |
| | [FEATURED IMAGE: High-Res 16:9 Banner]            | Category Badge: "ENGINEERING" | |
| |                                                   | # Title: Next-Gen Edge Static | |
| |                                                   | Excerpt: How zero-JS reading  | |
| |                                                   | transforms Core Web Vitals... | |
| |                                                   | By Author Name • 5 min read   | |
| +---------------------------------------------------+-------------------------------+ |
+---------------------------------------------------------------------------------------+
| LATEST ARTICLES GRID (3 Columns)                    | SIDEBAR WIDGETS               |
| +------------------+ +------------------+ +--------+| +---------------------------+ |
| | [Card 1: Image]  | | [Card 2: Image]  | | [Card 3|| | [Search Box]              | |
| | Category Badge   | | Category Badge   | | Categor|| +---------------------------+ |
| | Post Title H3    | | Post Title H3    | | Post Ti|| | Top Categories (Pills)    | |
| | Date • Read Time | | Date • Read Time | | Date • || +---------------------------+ |
| +------------------+ +------------------+ +--------+| | Newsletter Subscribe Form | |
|                                                     | +---------------------------+ |
+---------------------------------------------------------------------------------------+
```

### 2.3 Long-Form Article Reading Surface (`/posts/[slug]`)

```text
+---------------------------------------------------------------------------------------+
| [Category Badge: "TUTORIAL"]                                                          |
| # Complete Guide to Building Edge-First Publishing Platforms                          |
| A step-by-step masterclass in high-performance CMS engineering and Git workflows.    |
| By Editorial Staff • Published October 30, 2026 • 8 min read                          |
+---------------------------------------------------------------------------------------+
| [FULL WIDTH FEATURED IMAGE: 1200 x 675px WebP with accessible alt text]              |
+----------------------------------------------------+----------------------------------+
| ARTICLE BODY (Prose width: max-w-3xl)              | STICKY SIDEBAR (Desktop >= 1024px|
|                                                    | +------------------------------+ |
| ## 1. The Need for Speed                           | | Table of Contents            | |
| In this section, we examine the overhead of legacy | | - 1. The Need for Speed      | |
| relational CMS queries...                          | | - 2. Block Architecture      | |
|                                                    | | - 3. Git Deployment          | |
| > "Static generation isn't an optimization;        | +------------------------------+ |
| > it's an architectural reset."                    | | Share Article:               | |
|                                                    | | [X/Twitter] [LinkedIn] [Copy]| |
| ## 2. Block Architecture                           | +------------------------------+ |
+----------------------------------------------------+----------------------------------+
| AUTHOR BIO CARD                                                                       |
| [Avatar] Jane Doe • Principal Software Architect                                      |
| Writing about distributed systems, edge runtimes, and developer tooling.              |
+---------------------------------------------------------------------------------------+
| RELATED STORIES (3-Column Card Grid)                                                  |
+---------------------------------------------------------------------------------------+
```

---

## 3. Custom Admin CMS Dashboard Interface (`/wpadmin/`)

### 3.1 Admin App Shell Layout

```text
+------------------+--------------------------------------------------------------------+
| [Logo] CMS Admin | Breadcrumbs: Posts > Edit Post #42               [User Profile v]  |
+------------------+--------------------------------------------------------------------+
| [=] Dashboard    | MAIN CONTENT CANVAS                                                |
| [*] Posts (All)  |                                                                    |
| [+] New Story    |                                                                    |
| [P] Pages        |                                                                    |
| [M] Media        |                                                                    |
| [C] Categories   |                                                                    |
| [A] Ads Manager  |                                                                    |
| [G] Git Deploy   |                                                                    |
| [S] Settings     |                                                                    |
+------------------+--------------------------------------------------------------------+
```

### 3.2 Responsive Behavior & Breakpoints

- **Desktop (>= 1024px)**: Fixed 240px navigation sidebar on the left. Dual-pane inspector sidebar visible on the right of the editor canvas.
- **Tablet (768px - 1023px)**: Collapsible sidebar navigation. The inspector sidebar becomes a toggleable sliding drawer.
- **Mobile (< 768px)**: Hidden slide-out navigation drawer with touch gesture support. Block inserter switches to a full-screen modal sheet. Minimum touch targets are strictly 44x44px.

---

## 4. Gutenberg Block Editor Interface Specification

### 4.1 Canvas & Inserter Layout

```text
+---------------------------------------------------------------------------------------+
| [<- Back]  [Undo / Redo]   [+ Add Block]           [Status: Draft]  [Preview]  [Save] |
+---------------------------------------------------------------------------------------+
|                                                    | INSPECTOR SIDEBAR (Width: 320px) |
|   Title: Enter article headline...                 | +------------------------------+ |
|                                                    | | [Document]   [Block]   [SEO] | |
|   +----------------------------------------------+ | +------------------------------+ |
|   | Paragraph block: Start writing your story or | | Slug:                          | |
|   | type '/' to choose a modular block...        | | [edge-first-publishing       ] | |
|   +----------------------------------------------+ | Status:                        | |
|   | [::] [^] [v] [ Heading (H2)                ] | | (o) Draft    ( ) Published     | |
|   | Subheading: Architectural Overview           | | Category:                      | |
|   +----------------------------------------------+ | [ Technology                 v]| |
|   | [+] Click to insert block                    | | Featured Image:                | |
|                                                    | | [ Drop image or choose URL ] | |
+----------------------------------------------------+----------------------------------+
```

### 4.2 Floating Toolbar & Block Controls

When any block is focused, a contextual floating toolbar appears immediately above it:
- **Heading**: Dropdown for `H2`, `H3`, `H4`, Text Alignment (Left, Center, Right), Anchor Link, Delete.
- **Paragraph**: Bold (`Ctrl+B`), Italic (`Ctrl+I`), Link (`Ctrl+K`), Strikethrough, Inline Code, Clear Formatting.
- **Image**: Replace Media, Alignment (Left, Center, Full-Width), Edit Alt Text, Caption Toggle.

---

## 5. Accessibility (a11y) & Usability Standards

1. **Color Contrast**: All text elements adhere to a minimum 4.5:1 contrast ratio against their background for regular text, and 3:1 for large text.
2. **Keyboard Navigation**:
   - `Tab` navigates through focusable inputs with visible indigo focus rings (`ring-2 ring-indigo-500 ring-offset-2`).
   - `Escape` closes any open modals, dropdown menus, or slide-out drawers.
   - Slash command (`/`) inside an empty paragraph instantly opens the block selector palette.
3. **Screen Readers**:
   - All interactive icons include descriptive `aria-label` tags.
   - Dynamic save notices use `aria-live="polite"` to announce status changes without shifting focus.
