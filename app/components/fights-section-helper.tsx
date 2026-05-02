import { Fight } from "@/src/db/fights";
import { parseCompetitionDate } from "@/src/utils/timeHelpers";

/** Hardcoded "current" competition substring (lowercased). Sections whose title contains this (e.g. "NHRL march 2026 3lb") are shown when filter is "current". */
export const CURRENT_COMPETITION = "march 2026";

export type FightFilter = "current" | "past" | "all";

export type FightSection = { title: string; data: Fight[] };

/** Earlier `fight_time` (HH:MM:SS) first; empty/null last; then `fight_id` ascending. */
export function compareFightsByFightTimeAsc(a: Fight, b: Fight): number {
    const ta = a.fight_time?.trim() ?? "";
    const tb = b.fight_time?.trim() ?? "";
    if (!ta && !tb) return (a.fight_id ?? 0) - (b.fight_id ?? 0);
    if (!ta) return 1;
    if (!tb) return -1;
    const byTime = ta.localeCompare(tb);
    if (byTime !== 0) return byTime;
    return (a.fight_id ?? 0) - (b.fight_id ?? 0);
}

/**
 * Pure function: builds sections from a flat list of fights for SectionList.
 * Groups by competition (lowercased); "unspecified" last; sorted reverse chronologically (year then month).
 * Within each section, fights are sorted by `fight_time` ascending (earlier first).
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
        return dateA.getMonth() - dateB.getMonth();
    });

    let sections: FightSection[] = sortedKeys.map((key) => ({
        title: key,
        data: [...grouped[key]].sort(compareFightsByFightTimeAsc),
    }));

    if (filter === "current") {
        sections = sections.filter((s) => s.title.toLowerCase().includes(CURRENT_COMPETITION));
    } else if (filter === "past") {
        sections = sections.filter((s) => !s.title.toLowerCase().includes(CURRENT_COMPETITION));
    }

    return sections;
}