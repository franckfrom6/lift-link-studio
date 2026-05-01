/**
 * Activity log for nutrition meal plans (PR3).
 *
 * - `useActivityLogger(planId)` returns a `log()` function that inserts a
 *   row into `activity_log` with the current user as actor.
 * - `useActivityFeed(planId, filters)` reads the timeline (newest first)
 *   with optional filtering by actor and action type.
 *
 * The log is fire-and-forget on mutations: if it fails (e.g. offline),
 * we don't block the user — the underlying data mutation already
 * carries the truth.
 */
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ActorRole = "coach" | "athlete";
export type EntityType = "plan" | "meal" | "meal_food";
export type ActionType =
  | "create_plan" | "update_plan" | "delete_plan"
  | "create_meal" | "rename_meal" | "delete_meal" | "duplicate_meal" | "reorder_meal"
  | "add_food" | "edit_food" | "remove_food" | "substitute_food" | "reorder_food";

export interface ActivityLogRow {
  id: string;
  plan_id: string;
  actor_id: string;
  actor_role: ActorRole;
  action_type: ActionType;
  entity_type: EntityType;
  entity_id: string | null;
  before_value: any;
  after_value: any;
  created_at: string;
}

export interface LogInput {
  actionType: ActionType;
  entityType: EntityType;
  entityId?: string | null;
  before?: any;
  after?: any;
}

export function useActivityLogger(planId: string | null, role: ActorRole) {
  const { user } = useAuth();
  return useCallback(
    async (input: LogInput) => {
      if (!planId || !user?.id) return;
      try {
        await supabase.from("activity_log").insert({
          plan_id: planId,
          actor_id: user.id,
          actor_role: role,
          action_type: input.actionType,
          entity_type: input.entityType,
          entity_id: input.entityId ?? null,
          before_value: input.before ?? null,
          after_value: input.after ?? null,
        });
      } catch {
        // swallow: history is best-effort, not blocking.
      }
    },
    [planId, role, user?.id]
  );
}

export interface FeedFilters {
  actor?: "me" | "other" | "all";
  actionTypes?: ActionType[];
}

export function useActivityFeed(planId: string | null, filters: FeedFilters = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["activity-log", planId, filters, user?.id],
    enabled: !!planId,
    staleTime: 10_000,
    queryFn: async (): Promise<ActivityLogRow[]> => {
      if (!planId) return [];
      let q = supabase
        .from("activity_log")
        .select("*")
        .eq("plan_id", planId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters.actor === "me" && user?.id) q = q.eq("actor_id", user.id);
      if (filters.actor === "other" && user?.id) q = q.neq("actor_id", user.id);
      if (filters.actionTypes?.length) q = q.in("action_type", filters.actionTypes);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ActivityLogRow[];
    },
  });
}