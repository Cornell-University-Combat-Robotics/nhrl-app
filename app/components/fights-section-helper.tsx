import { Fight } from "@/src/db/fights";
import { parseCompetitionDate } from "@/src/utils/timeHelpers";

/** Hardcoded "current" competition substring (lowercased). Sections whose title contains this (e.g. "NHRL march 2026 3lb") are shown when filter is "current". */
export const CURRENT_COMPETITION = "march 2026";

export type FightFilter = "current" | "past" | "all";

export type FightSection = { title: string; data: Fight[] };

/**
 * Pure function: builds sections from a flat list of fights for SectionList.
 * Groups by competition (lowercased); "unspecified" last; sorted reverse chronologically (year then month).
 * @param filter - "current" = only sections whose title contains CURRENT_COMPETITION; "past" = exclude those; "all" = no filter.
 */
export default function computeSortedSections(fights: Fight[] | undefined, filter: FightFilter = "all"): FightSection[] {
    if (!fights) return [];

    const grouped = fights.reduce((acc: Record<string, Fight[]>, fight: Fight) => {
        const comp = (fight.competition || "unspecified").toLowerCase();
        if (!acc[comp]) acc[comp] = [];
        acc[comp].push(fight);
        return acc;
    }, {});

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === "unspecified") return 1;
        if (b === "unspecified") return -1;
        const dateA = parseCompetitionDate(a);
        const dateB = parseCompetitionDate(b);
        const yearA = dateA.getFullYear();
        const yearB = dateB.getFullYear();
        if (yearB !== yearA) return yearB - yearA;
        return dateB.getMonth() - dateA.getMonth();
    });

    let sections: FightSection[] = sortedKeys.map((key) => ({
        title: key,
        data: grouped[key],
    }));

    if (filter === "current") {
        sections = sections.filter((s) => s.title.toLowerCase().includes(CURRENT_COMPETITION));
    } else if (filter === "past") {
        sections = sections.filter((s) => !s.title.toLowerCase().includes(CURRENT_COMPETITION));
    }

    return sections;
}