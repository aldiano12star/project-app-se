---
name: Decisive Technical
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#5d3f3d'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#926f6b'
  outline-variant: '#e7bdb9'
  surface-tint: '#c0001b'
  primary: '#b8001a'
  on-primary: '#ffffff'
  primary-container: '#e11d2a'
  on-primary-container: '#fff8f7'
  inverse-primary: '#ffb3ad'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#006747'
  on-tertiary: '#ffffff'
  tertiary-container: '#00835b'
  on-tertiary-container: '#e8fff0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#930012'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
  primary-hover: '#BE123C'
  primary-subtle: '#FFE4E6'
  primary-subtle-dark: '#4C0519'
  surface-bg-light: '#F8FAFC'
  card-bg-light: '#FFFFFF'
  border-light: '#E2E8F0'
  text-primary-light: '#0F172A'
  text-secondary-light: '#64748B'
  text-muted-light: '#94A3B8'
  surface-bg-dark: '#0B1120'
  card-bg-dark: '#131C31'
  border-dark: '#23304B'
  text-primary-dark: '#F8FAFC'
  text-secondary-dark: '#94A3B8'
  text-muted-dark: '#64748B'
  success: '#16A34A'
  success-subtle: '#DCFCE7'
  danger: '#DC2626'
  danger-subtle: '#FEE2E2'
  warning: '#D97706'
  warning-subtle: '#FEF3C7'
  info: '#2563EB'
  info-subtle: '#DBEAFE'
  div-programming: '#2563EB'
  div-programming-bg-light: '#EFF6FF'
  div-design: '#9333EA'
  div-design-bg-light: '#FAF5FF'
  div-photography: '#D97706'
  div-photography-bg-light: '#FFFBEB'
  div-cinematography: '#E11D2A'
  div-cinematography-bg-light: '#FFF1F2'
  div-technopreneurship: '#059669'
  div-technopreneurship-bg-light: '#ECFDF5'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: '1.25'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: '1.35'
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 0.938rem
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: '1.45'
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: '1.35'
  label-sm:
    fontFamily: Inter
    fontSize: 0.813rem
    fontWeight: '500'
    lineHeight: '1.4'
  caption:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

# DESIGN.md — Saba ExploIT Design System & UI Specification

## 1. Design Tokens (YAML Front-Matter)

```yaml
system:
  name: "Saba ExploIT UI Engine"
  version: "1.0.0"
  philosophy: "Friendly yet Decisive, Accessible, Zero-Jank Low-Spec Optimization"

tokens:
  colors:
    brand:
      primary: "#E11D2A"          # Saba ExploIT Vibrant Red (Logo Brand)
      primary-hover: "#BE123C"    # Crimson Red Darker
      primary-subtle: "#FFE4E6"   # Soft Red Tint (Light Mode Accent)
      primary-subtle-dark: "#4C0519" # Deep Red Tint (Dark Mode Accent)

    neutral-light:
      surface-bg: "#F8FAFC"       # Soft Off-White (Slate 50 - Anti Glare)
      card-bg: "#FFFFFF"          # Pure White
      border: "#E2E8F0"           # Slate 200 (1px Crisp Solid)
      text-primary: "#0F172A"     # Deep Slate 900 (High Contrast)
      text-secondary: "#64748B"   # Slate 500
      text-muted: "#94A3B8"       # Slate 400

    neutral-dark:
      surface-bg: "#0B1120"       # Night Deep Slate (Anti-Eye Strain)
      card-bg: "#131C31"          # Elevated Slate Surface
      border: "#23304B"           # Slate 700 (Crisp Border)
      text-primary: "#F8FAFC"     # Slate 50
      text-secondary: "#94A3B8"   # Slate 400
      text-muted: "#64748B"       # Slate 500

    semantic:
      success: "#16A34A"          # Hijau Lunas / Hadir
      success-subtle: "#DCFCE7"   # Background Pill Sukses
      danger: "#DC2626"           # Merah Nunggak / Alpa / Hapus
      danger-subtle: "#FEE2E2"    # Background Pill Nunggak
      warning: "#D97706"          # Kuning Menunggu / Izin
      warning-subtle: "#FEF3C7"   # Background Pill Kuning
      info: "#2563EB"             # Biru Info / Pengumuman
      info-subtle: "#DBEAFE"      # Background Pill Info

    divisions:
      programming:
        color: "#2563EB"          # Blue
        bg-light: "#EFF6FF"
        bg-dark: "#1E3A8A33"
      design:
        color: "#9333EA"          # Purple
        bg-light: "#FAF5FF"
        bg-dark: "#581C8733"
      photography:
        color: "#D97706"          # Amber
        bg-light: "#FFFBEB"
        bg-dark: "#78350F33"
      cinematography:
        color: "#E11D2A"          # Saba Red
        bg-light: "#FFF1F2"
        bg-dark: "#88133733"
      technopreneurship:
        color: "#059669"          # Emerald
        bg-light: "#ECFDF5"
        bg-dark: "#064E3B33"

  geometry:
    radius:
      sm: "6px"                   # Input field mini, checkbox
      md: "8px"                   # Tombol utama, filter dropdown
      lg: "12px"                  # Card kontainer, modal dialog
      full: "9999px"              # Pill badge, avatar lingkar
    spacing:
      density: "relaxed"          # Whitespace seimbang, touch-target lega
      base-grid: "4px"            # 4px, 8px, 12px, 16px, 20px, 24px
      touch-target-min: "44px"    # Akses jari jempol layar sentuh HP

  typography:
    font-sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    scale:
      h1: "1.5rem / 1.3"          # 24px (Mobile Header)
      h2: "1.25rem / 1.35"        # 20px (Card Title)
      h3: "1.125rem / 1.4"        # 18px (Section Title)
      body: "0.938rem / 1.5"      # 15px (Bacaan utama nyaman)
      caption: "0.813rem / 1.4"   # 13px (Metadata & badge)
```