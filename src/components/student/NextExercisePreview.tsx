import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NextExercisePreviewProps {
  name: string | null;
  sets?: string;
  reps?: string;
}

const NextExercisePreview = forwardRef<HTMLDivElement, NextExercisePreviewProps>(({ name, sets, reps }, ref) => {
  if (!name) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-4 left-4 right-4 z-20 max-w-2xl mx-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 34px)' }}
      >
        <div className="bg-card/95 backdrop-blur-lg border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-md">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">À suivre</p>
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            {sets && reps && (
              <p className="text-xs text-muted-foreground">{sets}×{reps}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

NextExercisePreview.displayName = "NextExercisePreview";

export default NextExercisePreview;
