import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../supabaseClient";

/**
 * Subscribes to Supabase Realtime changes on the `fights` table.
 * When any INSERT, UPDATE, or DELETE occurs, it invalidates the
 * TanStack Query cache so fights data re-fetches automatically.
 */
export function useRealtimeFights() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel("fights-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "fights" },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["fights"] });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
}
