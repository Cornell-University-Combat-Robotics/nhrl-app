import { Fight } from "@/src/db/fights";
import { parseCompetitionDate } from "@/src/utils/timeHelpers";
import { useMemo } from "react";

/**
 * Hook: builds sections from a flat list of fights for use with React Native's SectionList.
 * Groups fights by competition (lowercased); competitions with no name are grouped under "unspecified".
 * Sections are sorted reverse chronologically: newest year first (2026 → 2025 → 2024), then newest month first within each year (Dec → Nov → Oct). "Unspecified" is always last.
 * @param fights - Flat array of fights (e.g. from useFights().data).
 * @returns Array of `{ title: string; data: Fight[] }` for SectionList's `sections` prop. Memoized on `fights`.
 */
export function getSortedSections(fights: Fight[] | undefined) {
    const sections = useMemo(() => {
        if (!fights) return [];

        const grouped = fights.reduce((acc: any, fight: any) => {
            const comp = (fight.competition || 'unspecified').toLowerCase();
            if (!acc[comp]) {
                acc[comp] = [];
            }
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

        return sortedKeys.map(key => ({
            title: key,
            data: grouped[key]
        }));
    }, [fights]);

    return sections;
}