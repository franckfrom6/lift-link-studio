import { Play, Search, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VideoLinkProps {
  videoUrl?: string | null;
  videoSearchQuery?: string | null;
  exerciseName: string;
  onUpdateUrl?: (url: string) => void;
  editable?: boolean;
}

const VideoLink = ({ videoUrl, videoSearchQuery, exerciseName, onUpdateUrl, editable = false }: VideoLinkProps) => {
  const [editing, setEditing] = useState(false);
  const [urlInput, setUrlInput] = useState(videoUrl || "");

  const handleSave = () => {
    onUpdateUrl?.(urlInput);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className="h-8 text-xs bg-surface"
        />
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleSave}>
          <Check className="w-3.5 h-3.5 text-success" strokeWidth={1.5} />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setEditing(false)}>
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </Button>
      </div>
    );
  }

  const searchUrl = videoSearchQuery
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(videoSearchQuery)}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName)}`;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {videoUrl ? (
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-tag-red/10 hover:bg-tag-red/20 text-tag-red px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <Play className="w-3 h-3" strokeWidth={1.5} />
          Voir la vidéo
        </a>
      ) : videoSearchQuery ? (
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-info-bg hover:bg-info/20 text-info px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <Search className="w-3 h-3" strokeWidth={1.5} />
          Chercher sur YouTube
        </a>
      ) : null}
      {editable && (
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="w-3 h-3" strokeWidth={1.5} />
          {videoUrl ? "Modifier" : "Ajouter vidéo"}
        </button>
      )}
    </div>
  );
};

export default VideoLink;
