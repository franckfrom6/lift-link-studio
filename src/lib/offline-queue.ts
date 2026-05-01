/**
 * Offline mutation queue (PR3).
 *
 * - We rely on TanStack Query's `networkMode: "offlineFirst"` and
 *   `onlineManager` for the heavy lifting (pause + retry on reconnect).
 * - We persist a tiny "pending count" + last sync error to IDB so the UI
 *   can show the "X modifications en attente" badge across reloads.
 * - Real serialization of paused mutations relies on
 *   `persistQueryClient` configured in App.tsx.
 *
 * Conflict policy: last-write-wins. When a mutation succeeds and the
 * server's `updated_at` is newer than the local snapshot we held when
 * we queued the change, we surface a non-blocking toast pointing the
 * user to the activity log.
 */
import { get, set, del } from "idb-keyval";
import { onlineManager } from "@tanstack/react-query";

const PENDING_KEY = "f6gym:nutrition:pending-count";

export async function readPendingCount(): Promise<number> {
  const v = (await get(PENDING_KEY)) as number | undefined;
  return typeof v === "number" ? v : 0;
}

export async function bumpPendingCount(delta: number) {
  const cur = await readPendingCount();
  const next = Math.max(0, cur + delta);
  if (next === 0) await del(PENDING_KEY);
  else await set(PENDING_KEY, next);
  // Notify listeners (badge) without forcing a full app re-render.
  window.dispatchEvent(new CustomEvent("nutrition:pending-changed", { detail: next }));
}

export function isOnline(): boolean {
  return onlineManager.isOnline();
}

/** Subscribe to pending-count updates. Returns unsubscribe. */
export function subscribePending(cb: (n: number) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<number>).detail);
  window.addEventListener("nutrition:pending-changed", handler as EventListener);
  return () => window.removeEventListener("nutrition:pending-changed", handler as EventListener);
}