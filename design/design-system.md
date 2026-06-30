# Brainzy Design System

This document outlines the visual system, color tokens, typography, and responsive styling parameters used in the Brainzy application.

---

## 🎨 Color Palette & Themes

Brainzy supports two premium themes (Light and Dark mode) that transition color values smoothly across cards, typography, sidebars, and input controls.

### ☀️ Light Mode Tokens
- **Base Page Background**: `#f8f9ff` (soft blue-white gradient canvas)
- **Primary Brand Color**: `#004ac6` (bold academic blue)
- **Container Cards Background**: `#ffffff` (pure white)
- **Interactive States & Hover**: `#f8f9ff` (very light slate)
- **Borders & Dividers**: `#E2E8F0` (thin slate grey)
- **Typography - Titles**: `#0b1c30` (navy-black)
- **Typography - Secondary Description**: `#64748B` (slate grey)

### 🌙 Dark Mode Tokens (Screenshot Compliant)
- **Base Page Background**: `#121212` (premium dark charcoal grey)
- **Container Cards Background**: `#1e1e1e` (dark grey card panels)
- **Interactive States & Inputs**: `#262626` (medium grey buttons & input background)
- **Active Navigation Capsule**: `#3b82f6` (bright vivid blue active accents)
- **Borders & Dividers**: `#2a2a2a` (thin dark borders)
- **Typography - Titles**: `#ffffff` (pure white text)
- **Typography - Secondary Description**: `#a3a3a3` (muted description text)

---

## ✍️ Typography

- **Primary Font Family**: `Inter`, sans-serif (used for UI metrics, lists, forms, and general content)
- **Title Font Family**: `Hanken Grotesk`, sans-serif (used for titles and key brand elements)
- **Scale**:
  - `3xl` / `4xl` (e.g. `250 min` focus counters)
  - `xl` (tab content headers)
  - `xs` (general paragraph text, buttons)
  - `[10px]` (meta-data tags and detail tags)

---

## 📐 Layout & Responsive Grid

Brainzy uses a fluid grid structure scaling from small phones to large desktop screens, designed to fit cleanly inside a Lemma Desk panel.

- **Desktop Layout**: Side-by-side flex layout with a fixed left sidebar (`w-80` width) and a flexible scrollable canvas panel (`flex-1`).
- **Mobile/Tablet Layout**: Vertical stacked layout (`flex-col`) with sidebar elements wrapping full-width (`w-full`) and dynamic compact padding adjustments (`p-4` replacing `p-8` on smaller displays).
- **Responsive Classes**:
  - Main container: `flex-col md:flex-row`
  - Sidebar: `w-full md:w-80 border-b md:border-b-0 md:border-r`
  - Canvas panels: `p-4 md:p-8 rounded-2xl md:rounded-3xl`
  - Desk integration: Automatically fits within the parent iframe on Lemma.work.

