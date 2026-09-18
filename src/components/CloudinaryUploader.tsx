"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  UploadSimple,
  FilePdf,
  CircleNotch,
  X,
  CheckCircle,
  WarningCircle,
  Image as ImageIcon,
  ArrowSquareOut,
  GoogleLogo,
  Eye,
  Download,
} from "@phosphor-icons/react";
import { isValidImageSrc } from "@/lib/validation";
import {
  isGoogleDriveUrl,
  getGoogleDriveViewUrl,
  getGoogleDrivePreviewUrl,
  getGoogleDriveDownloadUrl,
} from "@/lib/googleDrive";
import { documentUrl } from "@/lib/documentUrl";
import { PdfModalViewer } from "@/components/PdfModalViewer";

interface CloudinaryUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onMultipleUpload?: (urls: string[]) => void;
  multiple?: boolean;
  folder?: string;
  accept?: string;
  label?: string;
  description?: string;
  buttonLabel?: string;
  maxSizeMb?: number;
}

export function CloudinaryUploader({
  value,
  onChange,
  onMultipleUpload,
  multiple = false,
  folder = "thorga_uploads",
  accept = "image/*,application/pdf",
  label = "Upload File",
  description,
  buttonLabel,
  maxSizeMb = 2,
}: CloudinaryUploaderProps) {
  const maxBytes = maxSizeMb * 1024 * 1024;
  const activeDescription =
    description ??
    `Images & PDF documents up to ${maxSizeMb}MB (or Google Drive link with no size limit)`;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGoogleDrive = isGoogleDriveUrl(value);
  const isPdf = isGoogleDrive || value?.toLowerCase().endsWith(".pdf") || value?.includes("/raw/upload/");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    setErrorMsg(null);

    const files = Array.from(rawFiles);

    // Multi-file upload path
    if (multiple && files.length > 1) {
      const validFiles: File[] = [];
      const oversizedFiles: string[] = [];

      for (const file of files) {
        if (file.size > maxBytes) {
          oversizedFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      }

      if (oversizedFiles.length > 0) {
        setErrorMsg(
          `${oversizedFiles.length} file(s) exceeded the ${maxSizeMb}MB limit and were skipped (${oversizedFiles.slice(0, 2).join(", ")}${oversizedFiles.length > 2 ? "..." : ""}). Tip: host large files on Google Drive and paste the link below.`
        );
      }

      if (validFiles.length === 0) {
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress({ current: 0, total: validFiles.length });

        const session =
          typeof window !== "undefined"
            ? JSON.parse(sessionStorage.getItem("thorga_admin_session") || localStorage.getItem("thorga_admin_session") || "{}")
            : null;
        const headers: Record<string, string> = {};
        if (session?.token) {
          headers["Authorization"] = `Bearer ${session.token}`;
        }

        const uploadedUrls: string[] = [];
        const failedFiles: string[] = [];

        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          setUploadProgress({ current: i + 1, total: validFiles.length });

          try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folder);

            const response = await fetch("/api/upload", {
              method: "POST",
              credentials: "include",
              headers,
              body: formData,
            });

            const data = await response.json();
            if (!response.ok || !data.url) {
              throw new Error(data.error || `Upload failed for ${file.name}`);
            }

            uploadedUrls.push(data.url);
          } catch (uploadErr) {
            console.error(`Upload error for ${file.name}:`, uploadErr);
            failedFiles.push(file.name);
          }
        }

        if (failedFiles.length > 0) {
          setErrorMsg(
            `Uploaded ${uploadedUrls.length} file(s). ${failedFiles.length} file(s) failed: ${failedFiles.slice(0, 2).join(", ")}`
          );
        }

        if (uploadedUrls.length > 0) {
          if (onMultipleUpload) {
            onMultipleUpload(uploadedUrls);
          }
          if (onChange) {
            onChange(uploadedUrls[0]);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error uploading files";
        setErrorMsg(message);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      return;
    }

    // Single file upload path
    const file = files[0];
    if (file.size > maxBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMsg(`File size (${sizeMb} MB) exceeds ${maxSizeMb}MB limit. Tip: Use Google Drive and paste the link below for files larger than ${maxSizeMb}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const session =
        typeof window !== "undefined"
          ? JSON.parse(sessionStorage.getItem("thorga_admin_session") || localStorage.getItem("thorga_admin_session") || "{}")
          : null;
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
        if (multiple && onMultipleUpload) {
          onMultipleUpload([data.url]);
        }
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

  const handleUrlInputChange = (inputVal: string) => {
    // If user inputs a Google Drive URL, clear any file size errors immediately
    if (isGoogleDriveUrl(inputVal)) {
      setErrorMsg(null);
    }
    onChange(inputVal);
  };

  const handleRemoveFile = async () => {
    if (value && value.includes("cloudinary.com")) {
      try {
        const session =
          typeof window !== "undefined"
            ? JSON.parse(sessionStorage.getItem("thorga_admin_session") || localStorage.getItem("thorga_admin_session") || "{}")
            : null;
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
    setErrorMsg(null);
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-fg">{label}</label>
        <span className="text-[10px] text-muted font-mono">{activeDescription}</span>
      </div>

      {/* Upload Drop/Button Area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={accept}
            multiple={multiple}
            className="hidden"
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-control border border-line bg-surface hover:bg-tint hover:border-accent text-fg text-xs font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-e1"
          >
            {isUploading ? (
              <>
                <CircleNotch size={14} className="animate-spin text-accent" />
                <span>
                  {uploadProgress
                    ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}...`
                    : "Uploading..."}
                </span>
              </>
            ) : (
              <>
                <UploadSimple size={14} className="text-accent" />
                <span>
                  {buttonLabel ||
                    (multiple
                      ? "Choose Photo(s) / File(s)"
                      : `Choose File (Max ${maxSizeMb}MB)`)}
                </span>
              </>
            )}
          </button>

          {value && (
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-2 rounded-control text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              title="Remove File / Clear Link"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* URL Manual Input Fallback (with Google Drive support) */}
        <div className="space-y-1">
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleUrlInputChange(e.target.value)}
            placeholder={
              isGoogleDrive
                ? "Google Drive Link Active"
                : isPdf
                ? "Or paste direct PDF URL or Google Drive link..."
                : "Or paste image, PDF, or Google Drive link..."
            }
            className="w-full px-3 py-1.5 rounded-control border border-line bg-ground text-fg text-xs focus:border-accent font-mono"
          />
          <div className="text-[10px] text-muted flex items-center gap-1">
            <span>💡</span>
            <span>
              Google Drive links bypass the {maxSizeMb}MB limit. Paste any view or share link.
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 rounded-control border border-danger/30 bg-danger/10 text-danger text-xs flex items-center gap-2">
            <WarningCircle size={14} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Current Preview */}
        {value && !errorMsg && (
          <div className="p-2.5 rounded-control border border-line bg-tint flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {isGoogleDrive ? (
                <div className="w-10 h-10 rounded-control bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                  <GoogleLogo size={22} weight="bold" />
                </div>
              ) : isPdf ? (
                <div className="w-10 h-10 rounded-control bg-danger/10 text-danger flex items-center justify-center flex-shrink-0">
                  <FilePdf size={22} weight="duotone" />
                </div>
              ) : isValidImageSrc(value) ? (
                <div className="relative w-10 h-10 rounded-control overflow-hidden border border-line flex-shrink-0 bg-surface flex items-center justify-center p-0.5">
                  <Image src={value} alt="Upload preview" fill sizes="40px" className="object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-control bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                  <ImageIcon size={22} weight="duotone" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-accent">
                  <CheckCircle size={12} weight="fill" />
                  <span>
                    {isGoogleDrive
                      ? "Google Drive Document Ready"
                      : isPdf
                      ? "PDF Document Ready"
                      : "Image File Ready"}
                  </span>
                </div>
                <div className="text-[10px] text-muted truncate font-mono">{value}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isGoogleDrive ? (
                <a
                  href={getGoogleDriveViewUrl(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-control bg-accent text-on-accent hover:bg-accent-hover text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-e1"
                  title="Google Drive मा PDF हेर्नुहोस्"
                >
                  <ArrowSquareOut size={14} />
                  <span>PDF हेर्नुहोस् (Drive)</span>
                </a>
              ) : isPdf ? (
                <button
                  type="button"
                  onClick={() => setShowPdfModal(true)}
                  className="px-2.5 py-1.5 rounded-control bg-accent text-on-accent hover:bg-accent-hover text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-e1 cursor-pointer"
                  title="PDF हेर्नुहोस् (View PDF)"
                >
                  <Eye size={14} />
                  <span>PDF हेर्नुहोस्</span>
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Interactive PDF Viewer Modal in CloudinaryUploader */}
      {showPdfModal && value && (
        <PdfModalViewer
          url={value}
          title={label || "PDF Document"}
          lang="ne"
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  );
}
