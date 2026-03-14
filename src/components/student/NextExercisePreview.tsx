import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NextExercisePreviewProps {
  name: string | null;
  sets?: string;
  reps?: string;
}

const NextExercisePreview = ({ name, sets, reps }: NextExercisePreviewProps) => {
  if (!name) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-4 left-4 right-4 z-20 max-w-2xl mx-auto"
      >
        <div className="bg-zinc-800/90 backdrop-blur-lg border border-zinc-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">À suivre</p>
            <p className="text-sm font-semibold text-zinc-200 truncate">{name}</p>
            {sets && reps && (
              <p className="text-xs text-zinc-400">{sets}×{reps}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NextExercisePreview;
