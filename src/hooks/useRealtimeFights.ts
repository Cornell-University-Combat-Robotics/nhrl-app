import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../supabaseClient";

/** Subscribes to fights table Realtime; invalidates ['fights'] on any change. Unsubscribes on unmount. */
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
