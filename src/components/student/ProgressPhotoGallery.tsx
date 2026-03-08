import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useProgressPhotos } from "@/hooks/useProgressPhotos";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Camera, Loader2, ImageIcon } from "lucide-react";
import { format } from "date-fns";

const ProgressPhotoGallery = () => {
  const { t } = useTranslation("dashboard");
  const { photos, loading, uploadPhoto } = useProgressPhotos();
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [uploadCategory, setUploadCategory] = useState("front");
  const [uploadDate, setUploadDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredPhotos = filter === "all" ? photos : photos.filter((p) => p.category === filter);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadPhoto(file, uploadCategory, uploadDate);
    setUploading(false);
    setShowUpload(false);
  };

  const categories = [
    { value: "all", label: t("common:all") },
    { value: "front", label: t("front") },
    { value: "side", label: t("side") },
    { value: "back", label: t("back") },
  ];

  return (
    <div className="glass p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">{t("progress_photos")}</h2>
        <Button size="sm" variant="outline" onClick={() => setShowUpload(true)} className="h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
          {t("add_photo")}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              filter === cat.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <Camera className="w-8 h-8 text-muted-foreground mx-auto" strokeWidth={1.5} />
          <p className="font-semibold text-sm">{t("no_photos")}</p>
          <p className="text-xs text-muted-foreground">{t("no_photos_desc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
              <img
                src={photo.photo_url}
                alt={`${photo.category} - ${photo.date}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-white text-[10px] font-medium">{new Date(photo.date).toLocaleDateString()}</p>
                <p className="text-white/70 text-[9px]">{t(photo.category as any)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("add_photo")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("date")}</label>
              <Input type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("select_category")}</label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="front">{t("front")}</SelectItem>
                  <SelectItem value="side">{t("side")}</SelectItem>
                  <SelectItem value="back">{t("back")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <Button
              onClick={() => fileRef.current?.click()}
              className="w-full"
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ImageIcon className="w-4 h-4 mr-2" strokeWidth={1.5} />
              )}
              {t("upload_photo")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgressPhotoGallery;
