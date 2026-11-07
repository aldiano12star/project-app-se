"use client";

import React, { useState, useRef, useTransition } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Link as LinkIcon,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { compressImageToWebP } from "@/lib/image-compression";
import { parseGoogleDriveUrl } from "@/lib/drive-parser";

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
  placeholder = "Pilih foto dari perangkat atau masukkan link Google Drive...",
  aspectRatio = "video",
  helperText = "Otomatis dikompresi ke WebP ultra-ringan atau gunakan tautan berbagi Google Drive.",
}: ImagePickerFieldProps) {
  const [activeTab, setActiveTab] = useState<"FILE" | "URL">("FILE");
  const [urlInput, setUrlInput] = useState("");
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

    try {
      setIsCompressing(true);
      // 1. Kompresi ke format WebP ramah bandwidth (< 40 KB)
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
        file.name.replace(/\.[^/.]+$/, "") + ".webp"
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

  // Tangani input URL / Google Drive link
  const handleApplyUrl = () => {
    setErrorMessage(null);
    if (!urlInput.trim()) return;

    // Otomatis ubah Google Drive link ke direct CDN
    const convertedUrl = parseGoogleDriveUrl(urlInput.trim());
    onChange(convertedUrl);
    setUrlInput("");
  };

  const handleClear = () => {
    onChange("");
    setUrlInput("");
    setErrorMessage(null);
  };

  return (
    <div className="space-y-2">
      {/* Label & Tab Selector */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-primary" />
          {label}
        </label>

        {!value && (
          <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-edge text-[11px] font-medium">
            <button
              type="button"
              onClick={() => {
                setActiveTab("FILE");
                setErrorMessage(null);
              }}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                activeTab === "FILE"
                  ? "bg-primary text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <UploadCloud className="w-3 h-3" />
              Perangkat
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("URL");
                setErrorMessage(null);
              }}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                activeTab === "URL"
                  ? "bg-primary text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <LinkIcon className="w-3 h-3" />
              Google Drive
            </button>
          </div>
        )}
      </div>

      {/* Jika sudah ada nilai gambar, tampilkan Pratinjau Card */}
      {value ? (
        <div
          className={`relative w-full ${aspectClass} rounded-xl overflow-hidden border border-edge bg-surface-container-low shadow-xs group`}
        >
          <Image
            src={value}
            alt="Pratinjau Foto"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform group-hover:scale-102 duration-300"
            unoptimized={value.startsWith("data:")}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 bg-rose-500/90 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              Hapus Foto
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-primary/90 hover:bg-primary text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Ganti Berkas
            </button>
          </div>
        </div>
      ) : activeTab === "FILE" ? (
        /* Tab 1: Upload File dari Perangkat */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!isCompressing && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
            isDragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-edge hover:border-primary/50 bg-surface-container-low hover:bg-surface-container"
          }`}
        >
          {isCompressing || isUploading ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs font-medium text-ink">
                {isCompressing
                  ? "Mengompresi gambar ke WebP..."
                  : "Mengunggah gambar ke cloud..."}
              </p>
              <span className="text-[10px] text-ink-muted">
                Memangkas ukuran berkas agar hemat kuota...
              </span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">
                  Sentuh untuk memilih foto dari Galeri / Komputer
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Mendukung JPG, PNG, atau WebP (Drag & Drop juga didukung)
                </p>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />
        </div>
      ) : (
        /* Tab 2: Masukkan Link Google Drive / Image URL */
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyUrl();
                  }
                }}
                placeholder="https://drive.google.com/file/d/... atau URL gambar"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-container-low border border-edge text-ink placeholder:text-ink-muted focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
              <LinkIcon className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
            </div>
            <button
              type="button"
              onClick={handleApplyUrl}
              disabled={!urlInput.trim()}
              className="px-3.5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-xs shrink-0"
            >
              Terapkan
            </button>
          </div>
          <p className="text-[10px] text-ink-muted flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            Tautan berbagi Google Drive otomatis dikonversi ke link direct CDN.
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-rose-500 bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Helper text */}
      {!errorMessage && helperText && !value && (
        <p className="text-[10px] text-ink-muted">{helperText}</p>
      )}
    </div>
  );
}
