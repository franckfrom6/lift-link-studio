interface ExerciseVideoEmbedProps {
  exerciseName: string;
}

export function ExerciseVideoEmbed({ exerciseName }: ExerciseVideoEmbedProps) {
  const searchQuery = encodeURIComponent(`${exerciseName} exercise tutorial`);
  const embedUrl = `https://www.youtube.com/embed?listType=search&list=${searchQuery}&index=1`;

  return (
    <div className="w-full sm:max-w-2xl sm:mx-auto">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-md">
        <iframe
          src={embedUrl}
          title={`${exerciseName} tutorial`}
          className="absolute inset-0 w-full h-full"
          loading="lazy"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
      <p className="text-sm text-muted-foreground mt-2">Vidéo de démonstration</p>
    </div>
  );
}
