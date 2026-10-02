#!/usr/bin/env bash
# =============================================================
#  setup.sh — Claude Code Template Bootstrap
# -------------------------------------------------------------
#  Tujuan: Menyinkronkan skill dari sumber tunggal
#          (.agents/skills/) ke direktori symlink lain
#          (.claude/skills/, .pi/skills/).
#
#  Cara pakai:
#     chmod +x setup.sh     # pertama kali saja (sudah otomatis)
#     ./setup.sh            # jalankan sinkronisasi
#
#  Opsi:
#     ./setup.sh --verify   # hanya cek status tanpa ubah apapun
#     ./setup.sh --clean    # hapus symlink yang mati sebelum sync
# =============================================================

set -euo pipefail

# ---- Warna untuk output yang lebih mudah dibaca ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ---- Konfigurasi direktori ----
SOURCE_DIR=".agents/skills"
TARGETS=(".claude/skills" ".pi/skills")

# ---- Banner ----
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Claude Code Template — Skill Sync Bootstrap     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# ---- Parse argumen ----
MODE="sync"
for arg in "$@"; do
  case $arg in
    --verify)
      MODE="verify"
      shift
      ;;
    --clean)
      MODE="clean"
      shift
      ;;
    *)
      echo -e "${RED}✗ Opsi tidak dikenal: $arg${NC}"
      echo "  Gunakan: ./setup.sh [--verify|--clean]"
      exit 1
      ;;
  esac
done

# ---- Cek direktori sumber ----
if [ ! -d "$SOURCE_DIR" ]; then
  echo -e "${RED}✗ Direktori sumber '$SOURCE_DIR' tidak ditemukan!${NC}"
  echo "  Pastikan kamu menjalankan script dari root repositori template."
  exit 1
fi

# ---- Kumpulkan daftar skill ----
mapfile -t SKILLS < <(find "$SOURCE_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort)

if [ ${#SKILLS[@]} -eq 0 ]; then
  echo -e "${YELLOW}⚠ Tidak ada skill yang ditemukan di $SOURCE_DIR${NC}"
  exit 0
fi

echo -e "${GREEN}✓ Ditemukan ${#SKILLS[@]} skill di $SOURCE_DIR:${NC}"
for s in "${SKILLS[@]}"; do
  echo "   • $s"
done
echo ""

# ---- Fungsi: sync satu target ----
sync_target() {
  local target="$1"
  local created=0
  local skipped=0
  local fixed=0

  echo -e "${BLUE}→ Sinkronisasi ke: $target${NC}"

  # Buat direktori target kalau belum ada
  if [ ! -d "$target" ]; then
    mkdir -p "$target"
    echo "  ${GREEN}+${NC} Buat direktori $target"
  fi

  # Loop setiap skill
  for skill in "${SKILLS[@]}"; do
    local link_path="$target/$skill"
    local source_path="../../$SOURCE_DIR/$skill"

    if [ -L "$link_path" ]; then
      # Sudah ada symlink — cek target-nya valid
      local current_target
      current_target=$(readlink "$link_path")
      if [ "$current_target" = "$source_path" ]; then
        echo "  ${GREEN}✓${NC} $skill (sudah benar)"
        skipped=$((skipped + 1))
      else
        echo -e "  ${YELLOW}↻${NC} $skill (target lama: $current_target — diperbaiki)"
        rm "$link_path"
        ln -s "$source_path" "$link_path"
        fixed=$((fixed + 1))
      fi
    elif [ -e "$link_path" ]; then
      # Ada tapi bukan symlink (folder/file biasa) — skip & warning
      echo -e "  ${YELLOW}⚠${NC} $skill (bukan symlink — dilewati, hapus manual jika perlu)"
      skipped=$((skipped + 1))
    else
      # Belum ada — buat symlink
      ln -s "$source_path" "$link_path"
      echo "  ${GREEN}+${NC} $skill (dibuat)"
      created=$((created + 1))
    fi
  done

  echo -e "  ${BLUE}Ringkasan:${NC} dibuat=$created, dilewati=$skipped, diperbaiki=$fixed"
  echo ""
}

# ---- Fungsi: verifikasi saja ----
verify_only() {
  local ok=0
  local broken=0
  local missing=0

  for target in "${TARGETS[@]}"; do
    echo -e "${BLUE}→ Verifikasi: $target${NC}"
    if [ ! -d "$target" ]; then
      echo -e "  ${RED}✗${NC} Direktori $target tidak ada"
      ((missing++))
      continue
    fi

    for skill in "${SKILLS[@]}"; do
      local link_path="$target/$skill"
      if [ -L "$link_path" ] && [ -e "$link_path" ]; then
        echo "  ${GREEN}✓${NC} $skill"
        ((ok++))
      else
        echo -e "  ${RED}✗${NC} $skill (rusak / hilang)"
        ((broken++))
      fi
    done
    echo ""
  done

  echo -e "${BLUE}=== Total ===${NC} ok=$ok, rusak=$broken, direktori-hilang=$missing"
  if [ $broken -gt 0 ] || [ $missing -gt 0 ]; then
    exit 1
  fi
}

# ---- Fungsi: bersihkan symlink mati ----
clean_broken() {
  local removed=0

  echo -e "${BLUE}→ Membersihkan symlink yang mati...${NC}"
  for target in "${TARGETS[@]}"; do
    [ ! -d "$target" ] && continue
    while IFS= read -r -d '' link; do
      if [ ! -e "$link" ]; then
        echo "  ${RED}-${NC} Hapus: $link"
        rm "$link"
        ((removed++))
      fi
    done < <(find "$target" -mindepth 1 -maxdepth 1 -type l -print0)
  done

  echo -e "${BLUE}Selesai.${NC} Dihapus: $removed"
  echo ""
}

# ---- Main ----
case "$MODE" in
  verify)
    verify_only
    ;;
  clean)
    clean_broken
    for target in "${TARGETS[@]}"; do
      sync_target "$target"
    done
    ;;
  sync)
    for target in "${TARGETS[@]}"; do
      sync_target "$target"
    done
    ;;
esac

echo -e "${GREEN}✔ Selesai!${NC}"
echo ""
echo "Tips:"
echo "  • Untuk cek status saja: ${YELLOW}./setup.sh --verify${NC}"
echo "  • Untuk bersihkan broken link: ${YELLOW}./setup.sh --clean${NC}"
