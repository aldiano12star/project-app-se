# DESIGN.md — Saba ExploIT UI Design System (Google Stitch Edition)

Pedoman visual tunggal (_Single Source of Truth_) untuk antarmuka Super App Saba ExploIT berbasis spesifikasi desain modern Google Stitch. Agen koding AI (Claude Code/Cursor) wajib mematuhi seluruh token dan aturan penataan gaya ini.

---

## 1. Design Tokens (YAML Front-Matter)

```yaml
system:
  name: "Saba ExploIT UI Engine (Stitch Standard)"
  version: "2.1.0"
  philosophy: "Decisive Technical, Friendly yet Decisive, Accessible, Zero-Jank Low-Spec Optimization"

tokens:
  colors:
    brand:
      primary: "#E11D2A"              # Saba ExploIT Vibrant Red (Logo Brand & Primary Container)
      primary-hover: "#BE123C"        # Crimson Red Darker
      primary-subtle: "#FFE4E6"       # Soft Red Tint (Light Mode Accent)
      primary-subtle-dark: "#4C0519"  # Deep Red Tint (Dark Mode Accent)
      on-primary: "#FFFFFF"

    neutral-light:
      surface-bg: "#F8FAFC"           # Soft Off-White (Slate 50 - Anti Glare)
      card-bg: "#FFFFFF"              # Pure White
      border: "#E2E8F0"               # Slate 200 (1px Crisp Solid)
      surface-container-low: "#F1F5F9"# Slate 100 / Surface Container Low
      surface-container: "#E2E8F0"    # Slate 200 / Progress Bar Background
      text-primary: "#0F172A"         # Deep Slate 900 (High Contrast)
      text-secondary: "#64748B"       # Slate 500
      text-muted: "#94A3B8"           # Slate 400

    neutral-dark:
      surface-bg: "#0B1120"           # Night Deep Slate (Anti-Eye Strain)
      card-bg: "#131C31"              # Elevated Slate Surface
      border: "#23304B"               # Slate 700 (Crisp Border)
      surface-container-low: "#1E293B"# Dark Slate Container Low
      surface-container: "#334155"    # Dark Slate Container
      text-primary: "#F8FAFC"         # Slate 50
      text-secondary: "#94A3B8"       # Slate 400
      text-muted: "#64748B"           # Slate 500

    semantic:
      success: "#16A34A"              # Hijau Lunas / Hadir
      success-subtle: "#DCFCE7"       # Background Pill Sukses Light
      success-subtle-dark: "#052E16"  # Background Pill Sukses Dark
      danger: "#DC2626"               # Merah Nunggak / Alpa
      danger-subtle: "#FEE2E2"        # Background Pill Nunggak Light
      danger-subtle-dark: "#450A0A"   # Background Pill Nunggak Dark
      warning: "#D97706"              # Amber Podium / Menunggu
      warning-subtle: "#FEF3C7"       # Background Pill Kuning Light
      warning-subtle-dark: "#451A03"  # Background Pill Kuning Dark
      info: "#2563EB"                 # Biru Info / Sesi Aktif
      info-subtle: "#EFF6FF"          # Background Pill Info Light
      info-subtle-dark: "#172554"     # Background Pill Info Dark

    divisions:
      programming:
        color: "#2563EB"
        bg-light: "#EFF6FF"
        bg-dark: "#1E3A8A33"
      design:
        color: "#9333EA"
        bg-light: "#FAF5FF"
        bg-dark: "#581C8733"
      photography:
        color: "#D97706"
        bg-light: "#FFFBEB"
        bg-dark: "#78350F33"
      cinematography:
        color: "#E11D2A"
        bg-light: "#FFF1F2"
        bg-dark: "#88133733"
      technopreneurship:
        color: "#059669"
        bg-light: "#ECFDF5"
        bg-dark: "#064E3B33"

    podium:
      gold:
        border: "#EAB308"
        bg-subtle: "#FEF08A26"
        accent: "#CA8A04"
      silver:
        border: "#94A3B8"
        bg-subtle: "#F1F5F9"
        accent: "#64748B"
      bronze:
        border: "#D97706"
        bg-subtle: "#FFEDD526"
        accent: "#B45309"

  geometry:
    radius:
      sm: "6px"                       # Input field mini, checkbox
      md: "8px"                       # Tombol utama, filter dropdown
      lg: "12px"                      # Card kontainer, modal dialog
      xl: "16px"                      # Hero widget & Podium card
      full: "9999px"                  # Pill badge, avatar lingkar
    spacing:
      density: "relaxed"              # Whitespace seimbang, touch-target lega
      touch-target-min: "44px"        # Akses jari jempol layar sentuh HP
```

---

## 2. Aturan Komponen Khusus (Stitch Reference)

### 2.1. Podium Top 3 Kontributor (2 - 1 - 3 Sturdy Layout)

- Kontainer flex horizontal dengan penyelarasan rata bawah: `flex items-end justify-center gap-3 pt-6 pb-2`.
- **Pilar Kiri (Peringkat 2 - Perak):** Lebar `w-28`, pilar kokoh `h-36 bg-surface-container-low border border-edge rounded-t-lg flex flex-col items-center justify-center p-2 shadow-sm`. Avatar berlingkar perak dengan medali 🥈.
- **Pilar Tengah (Peringkat 1 - Emas):** Paling tinggi, lebar `w-32`, pilar kokoh `h-44 bg-warning-subtle/40 dark:bg-amber-950/40 border-2 border-warning/60 dark:border-amber-600 rounded-t-lg flex flex-col items-center justify-center p-2 shadow-sm`. Avatar berlingkar merah Saba/emas dengan mahkota 👑 dan medali 🥇.
- **Pilar Kanan (Peringkat 3 - Perunggu):** Lebar `w-28`, pilar kokoh `h-28 bg-surface-container-low border border-edge rounded-t-lg flex flex-col items-center justify-center p-2 shadow-sm`. Avatar berlingkar perunggu dengan medali 🥉.

### 2.2. Header & Navigasi Mobile

- **TopHeader:** Sticky top `z-50`, `bg-card`, bayangan halus `shadow-[0_1px_8px_rgba(0,0,0,0.04)]`, touch target tombol 44px, avatar Google `referrerPolicy="no-referrer"`.
- **BottomNav:** Fixed bottom `z-50`, `bg-card`, bayangan halus `shadow-[0_-1px_8px_rgba(0,0,0,0.04)]`, indikator rute aktif tebal warna Saba Red, `min-h-[44px]` per item navigasi.
