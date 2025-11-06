// File: app/page.jsx
"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  UploadCloud,
  Download,
  Trash2,
  Loader2,
  Image,
  Package,
} from "lucide-react";

export default function HomePage() {
  const [files, setFiles] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [preset, setPreset] = useState("instagram");
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  const onDrop = (acceptedFiles) => {
    setFiles(acceptedFiles);
    setProcessedImages([]);
    setProcessingStatus("");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".png", ".jpg"] },
    multiple: true,
  });

  const handleProcessImages = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProcessedImages([]);
    let processed = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingStatus(
        `Processing ${i + 1} of ${files.length}: ${file.name}`
      );

      const formData = new FormData();
      formData.append("file", file);
      formData.append("preset", preset);
      formData.append("quality", String(quality));

      try {
        const response = await fetch("/api/optimize", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Processing failed");

        const result = await response.json();
        processed.push(result);
        setProcessedImages([...processed]);
      } catch (error) {}
    }

    setIsProcessing(false);
    setProcessingStatus(`Processed ${files.length} images.`);
  };

  const handleDownloadZip = () => {
    if (processedImages.length === 0) return;

    const zip = new JSZip();
    processedImages.forEach((img) => {
      const base64Data = img.processedImage.split(",")[1];
      zip.file(img.fileName.replace(/\.[^/.]+$/, ".jpg"), base64Data, {
        base64: true,
      });
    });

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "optimized-images.zip");
    });
  };

  const removeImage = (fileName) => {
    setProcessedImages(processedImages.filter((p) => p.fileName !== fileName));
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const totalOriginalSize = processedImages.reduce(
    (acc, img) => acc + (img.originalSize || 0),
    0
  );
  const totalNewSize = processedImages.reduce(
    (acc, img) => acc + (img.newSize || 0),
    0
  );
  const totalSaved = totalOriginalSize - totalNewSize;

  const totalSavedPercent =
    totalOriginalSize > 0
      ? Math.round((totalSaved / totalOriginalSize) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* --- HEADER --- */}
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            Batch Image Optimizer
          </h1>
          <p className="text-lg text-slate-600 mt-2">
            Resize, compress, and pack your images in seconds.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {/* --- UPLOAD CARD --- */}
            <div
              {...getRootProps()}
              className={`relative bg-white p-6 rounded-xl shadow-sm border-2 border-dashed transition-all cursor-pointer 
                hover:border-[#0070f3] ${
                  isDragActive
                    ? "border-[#0070f3] bg-blue-50/50"
                    : "border-slate-300"
                }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center text-center">
                <UploadCloud
                  className={`w-16 h-16 ${
                    isDragActive ? "text-[#0070f3]" : "text-slate-400"
                  }`}
                />
                <p className="mt-4 text-lg font-semibold text-slate-700">
                  {isDragActive ? "Drop files now!" : "Drag & drop files here"}
                </p>
                <p className="text-slate-500">or click to select</p>
                {files.length > 0 && !isProcessing && (
                  <p className="mt-2 text-sm font-medium text-green-600">
                    {files.length} {files.length === 1 ? "file" : "files"}{" "}
                    selected.
                  </p>
                )}
              </div>
            </div>

            {/* --- SETTINGS CARD --- */}
            {files.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
                <h2 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-3">
                  Settings
                </h2>
                {/* Preset */}
                <div className="space-y-2">
                  <label
                    htmlFor="preset"
                    className="text-sm font-medium text-slate-700"
                  >
                    Resize Preset
                  </label>
                  <select
                    id="preset"
                    value={preset}
                    onChange={(e) => setPreset(e.target.value)}
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-[#0070f3] focus:ring-2 focus:ring-[#0070f3]/50"
                  >
                    <option value="instagram">Instagram (1080x1080)</option>
                    <option value="story">Story (1080x1920)</option>
                    <option value="twitter">Twitter (1200x675)</option>
                    <option value="original">Keep Original Dimensions</option>
                  </select>
                </div>
                {/* Quality */}
                <div className="space-y-3">
                  <label
                    htmlFor="quality"
                    className="flex justify-between text-sm font-medium text-slate-700"
                  >
                    <span>JPEG Quality</span>
                    <span className="font-bold text-[#0070f3]">{quality}%</span>
                  </label>
                  <input
                    id="quality"
                    type="range"
                    min="60"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))} // This class uses the custom styles from globals.css // accent-color is a fallback for non-Webkit browsers
                    className="w-full accent-[#0070f3]"
                  />
                </div>
                {/* Action Button */}
                <button
                  onClick={handleProcessImages}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 text-lg font-semibold text-white bg-[#0070f3] px-6 py-3 rounded-md shadow-sm transition hover:bg-[#0060d1] disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    `Process ${files.length} ${
                      files.length === 1 ? "Image" : "Images"
                    }`
                  )}
                </button>

                {processedImages.length > 0 && (
                  <button
                    onClick={() => {
                      setFiles([]);
                      setProcessedImages([]);
                      setProcessingStatus("");
                    }}
                    className="w-full text-sm text-slate-500 hover:text-red-600 transition"
                  >
                    Clear All & Start Over
                  </button>
                )}
              </div>
            )}
          </div>
          {/* --- COLUMN 2: RESULTS --- */}
          <div className="lg:col-span-2">
            {isProcessing && (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm">
                <Loader2 className="w-12 h-12 text-[#0070f3] animate-spin" />
                <p className="mt-4 text-slate-600">{processingStatus}</p>
              </div>
            )}

            {processedImages.length > 0 && !isProcessing && (
              <div className="space-y-6">
                {/* --- STATS & DOWNLOAD --- */}
                <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <h2 className="text-xl font-semibold text-slate-900">
                      Results
                    </h2>
                    <p className="text-slate-600">
                      Total Size: {formatBytes(totalOriginalSize)} →{" "}
                      <span className="font-semibold text-slate-800">
                        {formatBytes(totalNewSize)}
                      </span>
                    </p>
                    <p className="text-lg font-bold text-green-700">
                      You saved {formatBytes(totalSaved)} ({totalSavedPercent}%)
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadZip}
                    className="w-full md:w-auto flex items-center justify-center gap-2 text-lg font-semibold text-white bg-green-600 px-6 py-3 rounded-md shadow-sm transition hover:bg-green-700"
                  >
                    <Download />
                    Download All as ZIP
                  </button>
                </div>
                {/* --- IMAGE PREVIEW GRID --- */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {processedImages.map((img) => (
                    <div
                      key={img.fileName}
                      className="relative bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200 group"
                    >
                      <div className="aspect-square w-full bg-slate-100 p-1">
                        <img
                          src={img.processedImage}
                          alt={img.fileName}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="p-3">
                        <p
                          className="text-sm font-semibold text-slate-800 truncate"
                          title={img.fileName}
                        >
                          {img.fileName}
                        </p>
                        <span className="text-xs font-bold text-green-700">
                          (-
                          {img.originalSize
                            ? Math.round(
                                ((img.originalSize - img.newSize) /
                                  img.originalSize) *
                                  100
                              )
                            : 0}
                          %)
                        </span>
                      </div>
                      <button
                        onClick={() => removeImage(img.fileName)}
                        className="absolute top-2 right-2 p-1.5 bg-white/50 backdrop-blur-sm text-slate-600 rounded-full transition opacity-0 group-hover:opacity-100 hover:!bg-red-500 hover:!text-white"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {files.length > 0 &&
              !isProcessing &&
              processedImages.length === 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    Uploaded Images
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((file) => (
                      <div
                        key={file.name}
                        className="relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200 p-2"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-32 object-contain"
                        />
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatBytes(file.size)}
                        </p>
                        {/* --- Remove Button --- */}
                        <button
                          onClick={() =>
                            setFiles(files.filter((f) => f.name !== file.name))
                          }
                          className="absolute top-2 right-2 p-1.5 bg-white rounded-full hover:opacity-100 hover:!bg-red-500 hover:!text-white"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {files.length === 0 && (
              <div className="flex flex-col gap-4 items-center justify-center text-center p-10 h-full border-2 border-dashed border-slate-300 rounded-xl">
                <Image className="w-20 h-20 text-slate-300" />
                <div>
                  <p className="text-xl font-semibold text-slate-700">
                    Waiting for files...
                  </p>
                  <p className="text-slate-500 mt-1">
                    Upload your images to begin.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
