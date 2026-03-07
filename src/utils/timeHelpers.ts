/**
 * Formats a time string for display (e.g. from "11:29:00" to "11:29")
 * Removes seconds if they are "00".
 * @param timeStr - Time string in format "HH:MM:SS" or similar
 * @returns Formatted time string
 */
export function formatTimeForDisplay(timeStr?: string | null): string {
    if (!timeStr) return "";

    // Check if string matches HH:MM:00
    if (timeStr.endsWith(":00")) {
        return timeStr.slice(0, -3);
    }

    return timeStr;
}

const MONTHS: { [key: string]: number } = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
};

/** Extract a 4-digit year from a string (e.g. "NHRL 2025" -> 2025). Returns 0 if none. */
function extractYear(compStr: string): number {
    const match = compStr.match(/\b(19|20)\d{2}\b/);
    return match ? parseInt(match[0], 10) : 0;
}

export function parseCompetitionDate(compStr?: string | null): Date {
    if (!compStr) return new Date(0);

    const trimmed = compStr.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
        const year = extractYear(trimmed);
        return year ? new Date(year, 11, 1) : new Date(0);
    }

    const monthStr = parts[0].toLowerCase().slice(0, 3);
    const yearStr = parts[1];
    const month = MONTHS[monthStr];
    let year = parseInt(yearStr, 10);
    if (isNaN(year)) year = extractYear(trimmed);

    if (!year) return new Date(0);
    const fullYear = year < 100 ? 2000 + year : year;
    const monthNum = month !== undefined ? month : 11;

    return new Date(fullYear, monthNum, 1);
}
