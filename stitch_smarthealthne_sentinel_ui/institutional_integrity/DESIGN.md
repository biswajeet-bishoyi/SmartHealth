---
name: Institutional Integrity
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#381300'
  on-tertiary: '#ffffff'
  tertiary-container: '#592300'
  on-tertiary-container: '#d8885c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#723610'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  h1:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  h2:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  h3:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  table-header:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  button:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  touch-target: 48px
  margin-mobile: 16px
  margin-desktop: 32px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for public health governance, prioritizing unwavering authority, accessibility, and clarity. The brand personality is **reliable, professional, and institutional**, designed to evoke a sense of safety and structured care for citizens and health officials alike.

The visual direction follows a **Corporate / Modern** aesthetic with high-utility influences. It avoids unnecessary ornamentation, focusing instead on data integrity and clear communication. The interface utilizes a "trust-first" layout, where information hierarchy is strictly enforced to ensure that critical health data is never missed. High-contrast elements and generous whitespace ensure the system remains functional under various field conditions, including low-light rural environments or high-glare outdoor settings.

## Colors

The palette is anchored by **Deep Navy**, representing the stability of a government institution. The semantic colors (Success, Warning, Danger, Critical) are the most critical tools for communication within the system.

- **Primary (Deep Navy):** Used for navigation, headers, and primary actions to establish authority.
- **Semantic Tiers:** Used strictly for risk assessment. Success (Emerald) denotes "LOW" risk, Warning (Amber) for "MEDIUM", Danger (Red) for "HIGH", and Critical (Maroon) for immediate intervention.
- **Backgrounds:** A clean, cool-toned gray (`#F8FAFC`) reduces eye strain during long administrative sessions, while pure white surfaces clearly delineate content areas.
- **Accessibility:** All color combinations must maintain a minimum contrast ratio of 4.5:1 for text and 3:1 for graphical elements against their respective backgrounds.

## Typography

This design system uses a dual-font approach to maximize readability. **Atkinson Hyperlegible Next** is used for headlines to ensure maximum character differentiation for visually impaired users, while **Inter** provides a systematic, neutral feel for high-density data and body text.

- **Scale:** For mobile devices, `display` and `h1` should scale down by 20% to prevent awkward line breaks.
- **Weight:** Use Semi-Bold (600) and Bold (700) sparingly to highlight key health indicators and primary navigation items.
- **Data Tables:** Use `body-sm` for table content and `table-header` (All Caps) to create clear vertical scan lines for health workers.

## Layout & Spacing

The system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The layout philosophy centers on vertical rhythm and clear content grouping.

- **Community Interface:** Uses a "stack" layout with wide margins and `stack-lg` spacing to prevent accidental taps. Elements are centered to guide the user's eye.
- **Admin/Health Worker Interface:** Uses a sidebar-driven layout with a "Compact" spacing mode. Data tables should expand to fill the horizontal width, utilizing `stack-sm` for internal row padding to maximize information density.
- **Touch Targets:** A strict 48px minimum height/width is enforced for all interactive elements (buttons, inputs, toggles) across all platforms.

## Elevation & Depth

This design system uses **Tonal Layers** supplemented by **low-contrast outlines** to create hierarchy without clutter.

1. **Level 0 (Base):** The background layer (`#F8FAFC`).
2. **Level 1 (Cards):** Surface color (`#FFFFFF`) with a 1px border (`#E2E8F0`). No shadow is used here to maintain a clean, professional look.
3. **Level 2 (Interaction):** Active cards or dropdowns use a very soft, diffused shadow (0px 4px 12px, 5% opacity black) to indicate prominence above the base grid.
4. **Level 3 (Modals):** High-priority alerts or critical risk overlays use a 10% black shadow with a 24px blur to focus all user attention on the action.

## Shapes

The shape language is **Soft (0.25rem)**, providing a modern but disciplined aesthetic. 

- **Inputs and Buttons:** Use the standard `rounded` (4px) to maintain a professional, architectural feel.
- **Status Badges:** Use `rounded-lg` (8px) to distinguish them from interactive buttons.
- **Cards:** Use `rounded-lg` (8px) to soften the large containers and make the UI feel approachable for community users.

## Components

### Buttons
- **Primary:** Deep Navy background, white text. Min-height 48px.
- **Ghost/Secondary:** Deep Navy outline, 1px thickness. Used for "Cancel" or "Back" actions.
- **Community-Specific:** Full-width buttons with leading icons for increased recognizability.

### Status Badges
- Used for Risk Levels. They must include both an icon (e.g., Check for Low, Triangle Alert for High) and text.
- **Backgrounds:** Use a 10% opacity tint of the semantic color with a 100% opacity solid text label.

### Accessible Forms
- **Labels:** Always persistent (never use placeholder-only labels).
- **Error States:** Use the Danger Red (#EF4444) for borders and helper text.
- **Focus State:** 2px solid Deep Navy ring with a 2px offset.

### Data Tables (Health Worker Role)
- High-density rows (40px height).
- Sticky headers for long scrolls.
- Alternating row stripes (Zebra striping) using `#F8FAFC` to assist in horizontal scanning of patient records.

### Navigation
- **Community:** Bottom tab bar for easy thumb reach. Large icons with labels.
- **Admin:** Persistent left-hand sidebar with collapsible categories and a breadcrumb trail for deep nested data paths.