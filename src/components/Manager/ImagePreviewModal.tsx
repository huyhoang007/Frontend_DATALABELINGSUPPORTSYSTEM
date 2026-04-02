import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { datasetApi } from "../../api/datasetApi";
import { Card } from "../ui/Card";

interface ImageItem {
  itemId: number;
  fileUrl: string;
  fileName: string;
  fileType: string;
  width?: number;
  height?: number;
}

interface ImagePreviewModalProps {
  datasetId: number;
  datasetName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  datasetId,
  datasetName,
  isOpen,
  onClose,
}) => {
  const { t, i18n } = useTranslation(["manager", "common"]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen && datasetId) {
      loadImages();
    }
  }, [isOpen, datasetId]);

  const loadImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await datasetApi.getDatasetItems(datasetId);
      const items = Array.isArray(response) ? response : response?.data || [];
      setImages(items);
      setCurrentIndex(0);
    } catch (err: any) {
      setError(err?.message || t("manager:imagePreview.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  const totalImages = images.length;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex flex-col bg-background rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("manager:imagePreview.title")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{datasetName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl text-muted-foreground animate-spin block mb-2">
                  progress_activity
                </span>
                <p className="text-sm text-muted-foreground">
                  {t("manager:imagePreview.loading")}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl text-destructive block mb-2">
                  error
                </span>
                <p className="text-sm text-destructive">{error}</p>
                <button
                  onClick={loadImages}
                  className="mt-3 text-xs text-primary underline hover:no-underline"
                >
                  {t("common:actions.retry")}
                </button>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {t("manager:imagePreview.noImages")}
              </p>
            </div>
          ) : (
            <>
              {/* Main Preview Area */}
              <div className="flex-1 flex items-center justify-center bg-muted/20 p-6 relative min-h-0">
                {currentImage && (
                  <>
                    {/* Image */}
                    <div className="flex items-center justify-center max-w-full max-h-full">
                      <img
                        src={currentImage.fileUrl}
                        alt={currentImage.fileName}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='14' fill='%23999'%3EError%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>

                    {/* Navigation Buttons */}
                    {totalImages > 1 && (
                      <>
                        <button
                          onClick={handlePrevious}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                        >
                          <span className="material-symbols-outlined">
                            chevron_left
                          </span>
                        </button>
                        <button
                          onClick={handleNext}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                        >
                          <span className="material-symbols-outlined">
                            chevron_right
                          </span>
                        </button>
                      </>
                    )}

                    {/* Image Info */}
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-2 rounded text-xs">
                      <p className="font-medium truncate max-w-xs">
                        {currentImage.fileName}
                      </p>
                      {currentImage.width && currentImage.height && (
                        <p className="text-xs text-gray-300 mt-1">
                          {currentImage.width} × {currentImage.height}px
                        </p>
                      )}
                    </div>

                    {/* Counter */}
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-xs font-medium">
                      {currentIndex + 1} / {totalImages}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {totalImages > 1 && (
                <div className="border-t border-border/50 bg-muted/20 p-4 max-h-24 overflow-x-auto">
                  <div className="flex gap-2">
                    {images.map((img, idx) => (
                      <button
                        key={img.itemId}
                        onClick={() => handleThumbnailClick(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded border-2 transition-all overflow-hidden ${
                          idx === currentIndex
                            ? "border-primary shadow-lg"
                            : "border-border hover:border-muted-foreground hover:shadow"
                        }`}
                      >
                        <img
                          src={img.fileUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23e5e5e5' width='80' height='80'/%3E%3C/svg%3E";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && images.length > 0 && (
          <div className="border-t border-border/50 px-6 py-3 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("manager:imagePreview.showingImage", {
                current: currentIndex + 1,
                total: totalImages,
              })}
            </span>
            <span>{totalImages} {t("manager:imagePreview.images")}</span>
          </div>
        )}
      </div>
    </>
  );
};
