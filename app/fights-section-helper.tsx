import { Fight } from "@/src/db/fights";
import { parseCompetitionDate } from "@/src/utils/timeHelpers";
import { useMemo } from "react";

/** Hardcoded "current" competition: only fights for this (lowercased) title are shown when filter is "current". */
export const CURRENT_COMPETITION = "march 2026";

export type FightFilter = "current" | "past" | "all";

/**
 * Hook: builds sections from a flat list of fights for use with React Native's SectionList.
 * Groups fights by competition (lowercased); competitions with no name are grouped under "unspecified".
 * Sections are sorted reverse chronologically: newest year first (2026 → 2025 → 2024), then newest month first within each year (Dec → Nov → Oct). "Unspecified" is always last.
 * @param fights - Flat array of fights (e.g. from useFights().data).
 * @param filter - "current" = only CURRENT_COMPETITION; "past" = exclude CURRENT_COMPETITION; "all" = no filter.
 * @returns Array of `{ title: string; data: Fight[] }` for SectionList's `sections` prop. Memoized on `fights` and `filter`.
 */
export function getSortedSections(fights: Fight[] | undefined, filter: FightFilter = "all") {
    return useMemo(() => {
        if (!fights) return [];

        const grouped = fights.reduce((acc: Record<string, Fight[]>, fight: Fight) => {
            const comp = (fight.competition || "unspecified").toLowerCase();
            if (!acc[comp]) acc[comp] = [];
            acc[comp].push(fight);
            return acc;
        }, {});

        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            if (a === 'unspecified') return 1;
            if (b === 'unspecified') return -1;

            const dateA = parseCompetitionDate(a);
            const dateB = parseCompetitionDate(b);
            const yearA = dateA.getFullYear();
            const yearB = dateB.getFullYear();
            if (yearB !== yearA) return yearB - yearA; // 2026 -> 2025 -> 2024
            return dateB.getMonth() - dateA.getMonth(); // Dec -> Nov -> Oct within year
        });

        let sections = sortedKeys.map((key) => ({
            title: key,
            data: grouped[key],
        }));

        if (filter === "current") {
            sections = sections.filter((s) => s.title.toLowerCase() === CURRENT_COMPETITION);
        } else if (filter === "past") {
            sections = sections.filter((s) => s.title.toLowerCase() !== CURRENT_COMPETITION);
        }

        return sections;
    }, [fights, filter]); // Memoize on fights and filter so recomputation runs only when these change.
}