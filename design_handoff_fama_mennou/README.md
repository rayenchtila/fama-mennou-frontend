# Handoff: Fama Mennou — Premium SaaS Marketplace UI

## Overview
Fama Mennou is an all-in-one freelance ecosystem for Tunisia that connects **freelancers**, **clients**, and **online courses**. This package documents a high-fidelity UI/UX redesign covering the marketing home page, two marketplace pages (Hire Freelancers, Find Clients), a Courses catalog, Login, Sign up (with a Client/Freelancer role split), a Messaging inbox, and a Create-Course modal — all in a single dark "indigo" theme.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes that show the intended look, layout, and behavior. They are **not production code to copy directly**.

The HTML is authored as a "Design Component" (a custom streaming template format with an `<x-dc>` body and a `<script type="text/x-dc">` logic class). **Do not try to reuse that runtime.** The task is to **recreate these designs in the target codebase's existing environment** (e.g. React + Tailwind, Vue, Next.js) using its established components, patterns, and conventions. If no front-end environment exists yet, pick the most appropriate framework (React + Tailwind is a natural fit here) and implement the designs there.

A fully self-contained, offline-openable version is included (`Fama Mennou Light.html`) — open it in any browser to click through every screen and inspect exact rendering.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, gradients, shadows, hover states, and interactions are all specified. Recreate the UI pixel-closely using the codebase's existing libraries. Exact hex values and measurements are listed in **Design Tokens** below.

---

## Global Layout & Chrome

- **App shell**: single-page app with a client-side `page` state switching between views. Max content width **1200px** (marketplace pages use **1060px**, course catalog **1140px**), centered, horizontal padding **28px**.
- **Background** (applied to the whole app, every page): a layered radial + linear gradient on a near-black indigo base:
  ```
  radial-gradient(960px 540px at 14% -6%, rgba(124,108,246,.22), transparent 60%),
  radial-gradient(860px 540px at 96% -2%, rgba(58,140,224,.16), transparent 60%),
  linear-gradient(180deg, #100d28 0%, #0a0817 58%)
  ```
- **Header** (sticky, `top:0`, `z-index:50`, height **66px**): translucent `rgba(12,10,30,.72)` with `backdrop-filter: blur(16px)` and a `1px` bottom border `rgba(255,255,255,.08)`. Left: logo glow image (38px) + "Fama Mennou" wordmark (Fama in `#f4f3fb`, " Mennou" in `#9b8cff`). Center-left nav: Hire Freelancers / Find Clients / Courses. Right: a message icon button (40px, with a `#9b8cff` unread dot), "Log in" text button, and a filled "Sign up" button.
- **Header/Footer are hidden on the Login and Sign up pages** (full-screen auth). Controlled by a `showChrome = page !== 'login' && page !== 'signup'` flag.
- **Footer**: 4-column grid (`1.6fr 1fr 1fr 1fr`, gap 36px) on `rgba(8,6,18,.5)` with a top border; brand blurb + Platform / Company / Support link columns; bottom copyright row.

---

## Screens / Views

### 1. Home (marketing landing)
**Purpose:** convert visitors into freelancers/clients/learners.
**Layout:** stacked centered sections, each `max-width:1140px`, vertical rhythm **72px** between sections.
Sections in order:
1. **Hero** — centered, max-width 880px. Pill badge ("All-in-one freelance ecosystem in Tunisia") → H1 (`clamp(34px,5.4vw,56px)`, weight 800, letter-spacing -.03em) with the second line in a gradient text fill (`linear-gradient(110deg,#9b8cff,#6c8cf6 60%,#3ec2e8)`) → subtitle → a search block: a 3-way segmented toggle (Freelancers / Services / Courses) above a pill search input with a filled Search button → 3 CTA buttons (primary "Hire Freelancers", outline "Find Clients", outline "Learn Skills") → an inline stat row (2,400+ freelancers · 850+ clients · 4.9 avg rating).
2. **3 Action Cards** — grid `repeat(auto-fit,minmax(280px,1fr))`, gap 20px. Each card: `#16142e` bg, `1px rgba(255,255,255,.08)` border, radius 16px, padding 26px, an icon tile (48px, `rgba(124,108,246,.16)` bg), title, description, and a "→" link. Hover: lift `translateY(-3px)`, indigo border, shadow.
3. **How it works** — 3 numbered steps in a centered flex row with **decorative arrows between the badges** (see Interactions → "Step arrows"). Each step: a 46px rounded-square number badge (`#7c6cf6`, white text), title, one-line description. Cards `min-width:200px;max-width:260px`.
4. **Featured freelancers** — section header (title + "View all" pill button) over a grid `repeat(auto-fit,minmax(300px,1fr))` of freelancer cards (avatar circle with initials, name + verified shield, role, star rating, skill chips, "Responds in Xh", rate "TND/h").
5. **Trending projects** — grid `repeat(auto-fit,minmax(330px,1fr))` of project cards (client avatar + name + verified, title, budget, duration, tag chips, proposals count, "Apply" button).
6. **Courses preview** — grid `repeat(auto-fit,minmax(250px,1fr))` of course cards (gradient cover with category + play glyph, title, instructor, rating · students, price).
7. **Testimonials** — grid `repeat(auto-fit,minmax(280px,1fr))`; each: 5 star glyphs, quote, avatar + name + title.
8. **FAQ** — max-width 760px, an accordion of 5 items (see Interactions → "FAQ accordion").
9. **Final CTA** — full-width rounded (24px) panel with a bright `linear-gradient(135deg,#6c5cf6,#7d5cf0 45%,#3a8ce0)` background, white H2, two buttons.

### 2. Hire Freelancers (marketplace)
**Purpose:** browse/filter verified freelancers.
**Layout:** max-width 1060px. Eyebrow label "MARKETPLACE · FREELANCERS" → H1 → subtitle → search pill → result count.
- **Sticky filter bar** (`top:66px`, bg `#0c0a1e`): a horizontal row of **category chips** (All, Design, Development, Marketing, Writing, Video, Finance) on the left; a styled `<select>` sort dropdown (Top rated / Newest / Lowest rate) on the right.
- **Freelancer rows** (text-first list, not cards): each row is a flex group, separated by `1px rgba(255,255,255,.07)` bottom borders, padding `24px 4px`, hover bg `rgba(255,255,255,.025)`. Left: 52px avatar circle. Middle (`flex:1;min-width:260px`): name (17px/700) + "Verified" badge + location + "Since YYYY" + star rating, then role (14.5px/600), then a one-line description, then skill chips. Right column (`min-width:168px`, right-aligned): availability dot + label, "rate TND/h", a "Message" outline button + "Hire" filled button, and "View profile" / "Review" text links.

### 3. Find Clients (projects marketplace)
**Purpose:** freelancers browse open projects and apply.
**Layout:** max-width 1060px, same header pattern with eyebrow "MARKETPLACE · PROJECTS". Sticky filter bar with category chips (All, Technology, Design, Marketing, E-commerce, Education, Finance) + sort select (Newest / Highest budget / Top rated).
- **Project cards** (stacked, gap 14px): `#16142e` bg, radius 16px, padding `22px 24px`. Top row: client avatar (38px rounded) + name + Verified badge + location, with "Posted Xd ago" pushed right. Then project title (18px/700), description, a meta row (budget with coin icon · budget type, duration with clock icon, level with chart icon, proposals count), then a footer row: tag chips on the left, "Save" outline + "Apply" filled buttons on the right.

### 4. Courses (catalog)
**Purpose:** browse and enroll in courses; instructors can create one.
**Layout:** centered hero (max-width 780px) with a count pill, gradient H1, search input, and a filled **"Create a course"** button, plus a 3-stat row (Courses / Categories / Instructors).
- **Sticky filter bar**: category chips (All, Design, Development, Marketing, Business, Music, Photography, Finance, Health, Other) on the left; **Free/Paid/All** price chips on the right. Both actively filter the grid.
- **Course grid**: `repeat(auto-fill,minmax(270px,1fr))`, gap 20px. Each card: a 138px gradient cover with a category tag (top-left), a price tag (top-right, white pill, "Free" or "N TND"), and a centered play glyph; body has title (min-height 42px), instructor row (28px avatar + name), a meta row (rating · students · lessons), and a footer (large price + "Enroll" button). Hover lifts the card.
- **Empty state**: when filters match nothing, a centered icon badge + "No courses found" + helper text.

### 5. Login
**Purpose:** returning users sign in. **Chrome hidden.**
**Layout:** full-viewport centered. A **glass card** (max-width 430px): `background: rgba(20,17,44,.5)`, `1px rgba(255,255,255,.09)` border, radius 22px, padding `38px 34px`, `backdrop-filter: blur(20px)`, shadow `0 40px 90px -40px rgba(0,0,0,.85)` plus an inset top sheen `inset 0 1px 0 rgba(255,255,255,.06)`.
Contents: H2 "Welcome back" + an inline enter/login icon (`#9b8cff`); subtitle; a **Log in / Sign up segmented toggle**; email field (with mail icon), password field (with lock icon + show/hide eye toggle), "Forgot password?" link; a clickable **"I'm not a robot" reCAPTCHA-style checkbox**; a full-width "Log in" button; a terms line.

### 6. Sign up
**Purpose:** new users register as a **Client** or **Freelancer**. **Chrome hidden.**
**Layout:** same glass card (max-width 460px), top-aligned, padded for scroll.
- H2 = "Join as a client" or "Join as a freelancer" (driven by role) + an inline icon (briefcase for client, trending-up for freelancer); Log in / Sign up toggle.
- **"I AM JOINING AS"** — two big role buttons: **Client** and **Freelancer** (selected one is indigo-tinted with `rgba(124,108,246,.6)` border + `#c7baff` text). Below: a one-line role hint.
- Common fields: Last name / First name (2-col), Email, Password / Confirm password (2-col), Date of birth, **Gender** (Male/Female toggle buttons).
- **Freelancer-only fields** (conditionally shown when role = Freelancer):
  - **Type** — a Freelancer / Instructor toggle (selected shows a ✓ check + indigo tint).
  - **Region** — a `<select>` of governorates (Tunis, Ariana, Sfax, Sousse, Bizerte).
  - **Your skills** text input, **Short bio** textarea.
- **National Identity Card (CIN)** section: a divider label, helper text, and two dashed upload drop-zones (Front side / Back side) with a camera icon.
- Full-width "Create account" button + terms line.

### 7. Messages (inbox)
**Purpose:** chat between users.
**Layout:** max-width 1240px. Title row ("Messages" + chat icon). A 2-column panel (`grid-template-columns: 320px 1fr`) inside a `#13112a` rounded-18px bordered container, height `72vh` (min 520px), overflow hidden.
- **Left (conversation list)**: a search input, then selectable conversation rows — 44px avatar (with online dot), name + timestamp, last-message preview + optional unread count badge. The active row has a `#7c6cf6` left border and tinted bg.
- **Right (thread)**: header with the active contact (avatar, name, online/offline status, a "⋯" menu button); a scrollable message area with chat bubbles (mine = `#7c6cf6` white text, right-aligned, tail bottom-right; theirs = `#1d1a3a`, left-aligned, tail bottom-left), each with a timestamp; a composer footer with an attach button, a text input, and a filled send button.

### 8. Create Course (modal)
**Purpose:** instructors publish a course.
**Layout:** fixed overlay (`rgba(6,5,16,.7)` + blur). Centered modal card (max-width 560px, `#15132e`, radius 20px): header (icon tile + "Create a course" + close X); body with Course title input, Description textarea, a dashed "Choose a photo" drop-zone, a 2-col row (Category select + Price TND input), an info note ("platform retains **6%** commission, you receive **94%**"), and Cancel / "Create course" buttons.

---

## Interactions & Behavior
- **Page navigation**: header nav + in-page CTAs set a single `page` state; `window.scrollTo(0,0)` on every navigation. Pages: `home`, `freelancers`, `clients`, `courses`, `login`, `signup`, `messages`.
- **Hero search toggle / Auth toggle / Role / Gender / Type / Price / Category chips**: all are single-select toggles. Selected = filled or indigo-tinted; unselected = transparent/muted. Transitions ~180ms.
- **Category + price filters** (Freelancers, Clients, Courses): actively filter the visible list/grid; result counts update live; empty state shown when zero matches.
- **FAQ accordion**: clicking a question toggles it open (only one open at a time; first open by default). Open item gets an indigo border; the chevron icon rotates 180°.
- **Password show/hide**: eye button toggles the password input `type` between `password` and `text`.
- **reCAPTCHA checkbox**: clicking toggles a checked state (indigo fill + white check, border highlight).
- **Step arrows** ("How it works"): decorative SVG flèches between the numbered badges — a dotted tail leading into a chevron, in `#9b8cff` with a soft glow. **These are tweakable** (see Design Tokens → Tweakable props): show/hide, size (48–220px, default ~96px wide), and color.
- **Hover states**: cards lift (`translateY(-3px)`) with an indigo border + shadow; buttons brighten/darken (~`#6a5cf0` on primary hover); nav items get a faint bg.
- **Transitions**: 150–200ms on background/border/color/transform; keep motion subtle.
- **Responsive**: every grid uses `auto-fit/auto-fill minmax(...)`, so columns collapse gracefully; flex groups use `flex-wrap`. Headings use `clamp()`. The Messages 2-col panel should stack on narrow screens (recommended: collapse to list → thread navigation under ~720px).

## State Management
Single component state object:
- `page` — current view (see list above).
- `searchType` — hero search toggle (`freelancers` | `services` | `courses`).
- `flCat`, `clCat`, `courseCat` — active category filter per marketplace/catalog (default `'All'`).
- `coursePrice` — `'All' | 'Free' | 'Paid'`.
- `openFaq` — index of the open FAQ item (`-1` = none).
- `showPwd` — password visibility (login).
- `captcha` — reCAPTCHA checked.
- `signupRole` — `'client' | 'freelancer'` (drives heading, icon, and conditional fields).
- `signupGender` — `'' | 'M' | 'F'`.
- `flType` — `'freelancer' | 'instructor'` (freelancer-only Type toggle).
- `createCourseOpen` — modal visibility.
- `activeMsg` — index of the selected conversation.

Data is currently static placeholder arrays (freelancers, projects, courses, testimonials, FAQs, conversations, message thread). In production these become API fetches. Selected-state styling for every toggle should be **derived from state and applied to the active element directly** (don't rely on a value computed one render behind — recompute per render).

## Design Tokens

**Colors**
- Base background: `#0a0817`; secondary dark `#100d28`; sticky-bar bg `#0c0a1e`.
- Surface / cards: `#16142e`; inputs `#15122c`; modal `#15132e`; messages panel `#13112a`; received bubble `#1d1a3a`; glass card `rgba(20,17,44,.5)`.
- Primary accent: `#7c6cf6` (hover `#6a5cf0`); lighter accent text `#9b8cff`; tint text `#c7baff` / `#b9aeff`.
- Gradient accent (text & covers): `linear-gradient(110deg,#9b8cff,#6c8cf6 60%,#3ec2e8)`; CTA panel `linear-gradient(135deg,#6c5cf6,#7d5cf0 45%,#3a8ce0)`.
- Text: primary `#fbfbff` / `#f4f3fb`; body `#a7abc8`; muted `#7e82a0`; faint `#62668a`.
- Borders: `rgba(255,255,255,.08)` (standard), `rgba(255,255,255,.12)` (inputs), indigo focus/active `rgba(124,108,246,.5–.6)`.
- Required-field asterisk: `#f06aa0`.
- Avatar tints (cycled): bg `rgba(124,108,246,.22)` fg `#c7baff`; bg `rgba(168,85,247,.22)` fg `#e2bcff`; bg `rgba(79,110,247,.22)` fg `#b7c6ff`.

**Typography**
- Font family: **Plus Jakarta Sans** (Google Fonts), weights 400/500/600/700/800. System sans fallback.
- Scale: H1 `clamp(34px,5.4vw,56px)`/800; section H2 `clamp(22px,3.2vw,29px)`/800; auth H2 28px/800; card titles 15–18px/700; body 14–16px; meta 12.5–13.5px. Headings letter-spacing -.02 to -.03em.

**Spacing**: 28px page gutter; 72px section rhythm; card padding 22–26px; input height 46–48px; gaps 8–20px.

**Radius**: buttons/inputs/chips 9–14px; cards 16px; glass/modals 20–22px; pills/avatars 50% or 999px.

**Shadows**: primary button `0 6px 16px -5px rgba(124,108,246,.7)`; card hover `0 18px 40px -16px rgba(0,0,0,.6)`; glass card `0 40px 90px -40px rgba(0,0,0,.85)` + inset top sheen; CTA panel `0 28px 64px -26px rgba(108,92,246,.8)`.

**Tweakable props** (declared on the design component; expose as configurable props in production):
- `showStepArrows` (boolean, default true)
- `stepArrowSize` (int, 48–220, default 96)
- `stepArrowColor` (color, default `#9b8cff`)

## Assets
- `assets/logo-glow.png` — the glowing "infinity" brand mark (transparent background), used in the header (38px) and footer (30px). Included in this bundle.
- **Icons**: all UI icons are inline SVGs in a consistent minimal stroke style (stroke-width ~1.8–2, rounded caps/joins), Stripe/Linear-flavored. Reproduce with your icon library of choice (Lucide is the closest match) or copy the inline SVG paths from the HTML.
- **No raster imagery** beyond the logo: course covers, avatars, and project thumbnails are CSS gradients + initials placeholders. Production should swap in real uploaded images where the design shows a cover/avatar.
- **Fonts**: Plus Jakarta Sans via Google Fonts.

## Files
- `Fama Mennou Light.dc.html` — the source design (Design Component format). Read this for exact markup, inline styles, and the logic class (state + data + handlers).
- `Fama Mennou Light.html` — self-contained, offline-openable build. Open in a browser to click through all screens and inspect rendering.
- `assets/logo-glow.png` — brand logo asset.
- `screenshots/` — rendered reference images of each screen:
  - `home.png` — marketing landing (hero)
  - `freelancers.png` — Hire Freelancers marketplace
  - `clients.png` — Find Clients / projects
  - `courses.png` — Courses catalog
  - `login.png` — Login (glass card)
  - `signup-client.png` — Sign up, Client role
  - `signup-freelancer.png` — Sign up, Freelancer role (conditional Type/Region/skills fields)
  - `messages.png` — Messaging inbox
  - `create-course-modal.png` — Create Course modal

> Note: there is also a separate earlier **dark French** variant (`Fama Mennou.dc.html`) in the project; this handoff documents the current English indigo system (`Fama Mennou Light`).
