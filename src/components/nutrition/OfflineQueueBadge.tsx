import { useEffect, useState } from "react";
import { WifiOff, CloudUpload } from "lucide-react";
import { onlineManager } from "@tanstack/react-query";
import { readPendingCount, subscribePending } from "@/lib/offline-queue";
import { cn } from "@/lib/utils";

/**
 * Compact badge shown next to the daily totals.
 * - Offline → "Hors ligne · X en attente" with WifiOff icon
 * - Online + pending → "Synchronisation… X" with CloudUpload icon
 * - Online + 0 pending → hidden
 */
const OfflineQueueBadge = () => {
  const [online, setOnline] = useState(onlineManager.isOnline());
  const [pending, setPending] = useState(0);

  useEffect(() => {
    readPendingCount().then(setPending);
    const unsubP = subscribePending(setPending);
    const unsubO = onlineManager.subscribe(() => setOnline(onlineManager.isOnline()));
    return () => { unsubP(); unsubO(); };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tabular-nums",
        !online
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
          : "bg-muted text-muted-foreground"
      )}
      role="status"
      aria-live="polite"
    >
      {!online ? <WifiOff className="w-3 h-3" /> : <CloudUpload className="w-3 h-3 animate-pulse" />}
      <span>
        {!online
          ? `Hors ligne${pending > 0 ? ` · ${pending} en attente` : ""}`
          : `Synchronisation… ${pending}`}
      </span>
    </div>
  );
};

export default OfflineQueueBadge;