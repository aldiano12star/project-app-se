"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  colorClass?: string;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface CustomSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md"; // "sm" untuk status tabel presensi, "md" untuk form input (default)
  searchable?: boolean; // Default otomatis true jika opsi > 5
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  id?: string;
  name?: string;
  required?: boolean;
  error?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih opsi...",
  label,
  disabled = false,
  size = "md",
  searchable,
  searchPlaceholder = "Cari...",
  className = "",
  triggerClassName = "",
  dropdownClassName = "",
  id,
  name,
  required,
  error,
}: CustomSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-aktifkan search jika opsi > 5, kecuali jika diatur manual
  const shouldSearch = searchable ?? options.length > 5;

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter opsi berdasarkan query pencarian
  const filteredOptions = shouldSearch
    ? options.filter((opt) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        const matchLabel = opt.label.toLowerCase().includes(query);
        const matchDesc = opt.description?.toLowerCase().includes(query);
        const matchBadge = opt.badge?.toLowerCase().includes(query);
        return matchLabel || matchDesc || matchBadge;
      })
    : options;

  // Tutup dropdown jika klik di luar komponen
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Fokuskan input pencarian saat panel terbuka
  useEffect(() => {
    if (isOpen && shouldSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen, shouldSearch]);

  const handleSelect = (option: CustomSelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  // Dimensi ukuran trigger
  const sizeClasses =
    size === "sm"
      ? "h-9 min-h-[36px] px-2.5 text-xs font-semibold rounded-lg"
      : "h-11 min-h-[44px] px-3.5 text-xs sm:text-sm font-medium rounded-xl";

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left ${className}`}
    >
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-ink mb-1.5"
        >
          {label} {required && <span className="text-primary">*</span>}
        </label>
      )}

      {/* Hidden input for HTML form submission compatibility */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2.5 transition-all outline-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hairline-border bg-surface-container-low/60 dark:bg-card hover:bg-surface-container-low active:scale-[0.99] text-ink ${
          isOpen
            ? "ring-2 ring-primary/20 border-primary shadow-xs"
            : error
            ? "border-rose-500 ring-1 ring-rose-500/20"
            : "hover:border-primary/50"
        } ${sizeClasses} ${triggerClassName}`}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1 truncate text-left">
          {selectedOption?.icon && (
            <selectedOption.icon className="w-4 h-4 shrink-0 text-ink-muted" />
          )}
          {selectedOption ? (
            <span
              className={`truncate ${
                selectedOption.colorClass || "text-ink font-semibold"
              }`}
            >
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-ink-muted truncate font-normal">
              {placeholder}
            </span>
          )}
        </span>

        <ChevronDown
          className={`w-4 h-4 shrink-0 text-ink-muted transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Integrated Inline / Anchored Listbox Panel */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute z-50 left-0 right-0 mt-1.5 rounded-2xl bg-card border border-edge shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 min-w-[200px] ${dropdownClassName}`}
        >
          {/* Kolom Pencarian Instan (jika > 5 item atau searchable) */}
          {shouldSearch && (
            <div className="p-2 border-b border-edge/80 bg-surface-container-low/40">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 pl-8 pr-7 rounded-lg bg-surface text-ink text-xs outline-hidden border border-edge focus:border-primary/60 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 p-1 text-ink-muted hover:text-ink cursor-pointer rounded-full"
                    aria-label="Hapus pencarian"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Daftar Item Opsi */}
          <div className="max-h-60 overflow-y-auto no-scrollbar p-1 divide-y divide-edge/30">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-ink-muted">
                Tidak ada pilihan yang cocok.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                const OptionIcon = opt.icon;

                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-left transition-colors cursor-pointer select-none ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-surface-container-low/80 text-ink"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {OptionIcon && (
                        <OptionIcon
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? "text-primary" : "text-ink-muted"
                          }`}
                        />
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs sm:text-sm break-words whitespace-normal leading-snug ${
                              isSelected
                                ? "font-bold text-primary"
                                : opt.colorClass || "font-medium text-ink"
                            }`}
                          >
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-surface-container text-ink-muted border border-edge shrink-0">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-[11px] text-ink-muted line-clamp-2 leading-tight">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Indikator Pilihan (Centang Elegan) */}
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-edge shrink-0 opacity-40" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}
