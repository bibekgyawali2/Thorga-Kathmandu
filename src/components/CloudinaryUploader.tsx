"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UploadSimple, FilePdf, CircleNotch, X, CheckCircle, WarningCircle, Image as ImageIcon } from "@phosphor-icons/react";
import { isValidImageSrc } from "@/lib/validation";

interface CloudinaryUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  label?: string;
  description?: string;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export function CloudinaryUploader({
  value,
  onChange,
  folder = "thorga_uploads",
  accept = "image/*,application/pdf",
  label = "Upload File",
  description = "Images & PDF documents up to 2MB",
}: CloudinaryUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPdf = value?.toLowerCase().endsWith(".pdf") || value?.includes("/raw/upload/");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    // Client-side validation: Max 2MB
    if (file.size > MAX_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMsg(`File size (${sizeMb} MB) exceeds maximum allowed limit of 2MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const session = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("thorga_admin_session") || localStorage.getItem("thorga_admin_session") || "{}") : null;
      const headers: Record<string, string> = {};
      if (session?.token) {
        headers["Authorization"] = `Bearer ${session.token}`;
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (data.url) {
        onChange(data.url);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error uploading file";
      setErrorMsg(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = async () => {
    if (value && value.includes("cloudinary.com")) {
      try {
        const session = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("thorga_admin_session") || localStorage.getItem("thorga_admin_session") || "{}") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session?.token) {
          headers["Authorization"] = `Bearer ${session.token}`;
        }
        await fetch("/api/upload", {
          method: "DELETE",
          credentials: "include",
          headers,
          body: JSON.stringify({ url: value }),
        });
      } catch (err) {
        console.error("Failed to delete asset from Cloudinary:", err);
      }
    }
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-fg">{label}</label>
        <span className="text-[10px] text-muted font-mono">{description}</span>
      </div>

      {/* Upload Drop/Button Area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={accept}
            className="hidden"
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-control border border-line bg-surface hover:bg-tint hover:border-accent text-fg text-xs font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <CircleNotch size={14} className="animate-spin text-accent" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadSimple size={14} className="text-accent" />
                <span>Choose File (Max 2MB)</span>
              </>
            )}
          </button>

          {value && (
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-2 rounded-control text-danger hover:bg-danger/10 transition-colors"
              title="Remove and Delete File"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* URL Manual Input Fallback */}
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isPdf ? "Or paste direct PDF URL..." : "Or paste image URL..."}
          className="w-full px-3 py-1.5 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent"
        />

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 rounded-control border border-danger/30 bg-danger/10 text-danger text-xs flex items-center gap-2">
            <WarningCircle size={14} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Current Preview */}
        {value && !errorMsg && (
          <div className="p-2.5 rounded-control border border-line bg-tint flex items-center gap-3">
            {isPdf ? (
              <div className="w-10 h-10 rounded-control bg-danger/10 text-danger flex items-center justify-center flex-shrink-0">
                <FilePdf size={22} weight="duotone" />
              </div>
            ) : isValidImageSrc(value) ? (
              <div className="relative w-10 h-10 rounded-control overflow-hidden border border-line flex-shrink-0 bg-surface">
                <Image src={value} alt="Upload preview" fill sizes="40px" className="object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-control bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                <ImageIcon size={22} weight="duotone" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-accent">
                <CheckCircle size={12} weight="fill" />
                <span>{isPdf ? "PDF Document Ready" : "Image File Ready"}</span>
              </div>
              <div className="text-[10px] text-muted truncate font-mono">{value}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
