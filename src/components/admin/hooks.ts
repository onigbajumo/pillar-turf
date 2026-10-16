"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/client";
import type { Bundle } from "@/lib/data";

export function useBundle(id: string) {
  return useQuery({ queryKey: ["t", id], queryFn: () => api<Bundle>(`/api/admin/tournaments/${id}`) });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ id: string; name: string; email: string; role: "owner" | "admin"; uploadsEnabled: boolean }>("/api/admin/me"),
    staleTime: 60_000,
  });
}

/** Runs a write, shows a toast, then refreshes the tournament. Resolves true on success. */
export function useRun(id: string) {
  const qc = useQueryClient();
  return async (fn: () => Promise<unknown>, success?: string) => {
    try {
      await fn();
      if (success) toast.success(success);
      await qc.invalidateQueries({ queryKey: ["t", id] });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    }
  };
}
