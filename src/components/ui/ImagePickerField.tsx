"use client";

import React, { useState, useRef, useId } from "react";
import Image from "next/image";
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { compressImageToWebP } from "@/lib/image-compression";

export interface ImagePickerFieldProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  aspectRatio?: "video" | "banner" | "square";
  helperText?: string;
}

export function ImagePickerField({
  value,
  onChange,
  label = "Foto / Banner",
  placeholder = "Sentuh untuk memilih foto dari galeri perangkat...",
  aspectRatio = "video",
  helperText = "Otomatis dikompresi ke format WebP ultra-ringan (< 40 KB) langsung di browsermu.",
}: ImagePickerFieldProps) {
  const inputId = useId();
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClass =
    aspectRatio === "banner"
      ? "aspect-[21/9]"
      : aspectRatio === "square"
      ? "aspect-square"
      : "aspect-video";

  // Tangani pemilihan berkas dari galeri / disk perangkat
  const handleFileSelected = async (file: File) => {
    setErrorMessage(null);

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Harap pilih berkas gambar (JPG, PNG, atau WebP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("Ukuran berkas melebihi batas 15 MB. Harap pilih foto lain.");
      return;
    }

    try {
      setIsCompressing(true);
      // 1. Kompresi gambar via Canvas ke format WebP ramah bandwidth (< 40 KB)
      const compressedBlob = await compressImageToWebP(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.75,
      });

      setIsCompressing(false);
      setIsUploading(true);

      // 2. Kirim ke Route Handler /api/upload
      const formData = new FormData();
      formData.append(
        "file",
        compressedBlob,
        (file.name || "photo").replace(/\.[^/.]+$/, "") + ".webp"
      );

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengunggah foto.");
      }

      onChange(data.url);
    } catch (err: any) {
      console.error("[ImagePickerField Error]:", err);
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses gambar.");
    } finally {
      setIsCompressing(false);
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange("");
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-primary" />
          <span>{label}</span>
        </label>
        <span className="text-xs text-ink-muted font-mono">
          Canvas → WebP
        </span>
      </div>

      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Pratinjau Jika Sudah Ada Gambar */}
      {value ? (
        <div
          className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden border border-edge bg-surface-container-low shadow-xs group`}
        >
          <Image
            src={value}
            alt="Pratinjau Foto"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform group-hover:scale-102 duration-300"
            unoptimized={true}
          />

          {/* Tombol X (Clear) Terpampang Jelas di Pojok Kanan Atas */}
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2.5 right-2.5 z-20 h-8 w-8 min-h-[32px] min-w-[32px] rounded-full bg-black/75 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer border border-white/20"
            title="Hapus gambar saat ini"
            aria-label="Hapus gambar saat ini"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Overlay Hover di Desktop */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
            <button
              type="button"
              onClick={handleClear}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer min-h-11"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hapus Foto</span>
            </button>
            <label
              htmlFor={inputId}
              className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer min-h-11"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Ganti Foto</span>
            </label>
          </div>
        </div>
      ) : (
        /* Upload Area Native Label */
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[140px] select-none ${
            isDragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-edge hover:border-primary/50 bg-surface-container-low/70 hover:bg-surface-container-low"
          }`}
        >
          {isCompressing || isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs font-bold text-ink">
                {isCompressing
                  ? "Mengompresi foto ke WebP..."
                  : "Mengunggah foto..."}
              </p>
              <span className="text-xs text-ink-muted">
                Memangkas ukuran berkas agar hemat kuota...
              </span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-ink">
                  {placeholder}
                </p>
                <p className="text-xs text-ink-muted">
                  Mendukung JPG, PNG, atau WebP dari ponsel atau komputer
                </p>
              </div>
            </>
          )}

          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            disabled={isCompressing || isUploading}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />
        </label>
      )}

      {helperText && (
        <p className="text-xs text-ink-muted leading-relaxed">
          💡 {helperText}
        </p>
      )}
    </div>
  );
}
