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

export function parseCompetitionDate(compStr?: string | null): Date {
    if (!compStr) return new Date(0);

    const parts = compStr.trim().split(" ");
    if (parts.length < 2) return new Date(0);

    const monthStr = parts[0].toLowerCase().slice(0, 3);
    const yearStr = parts[1];

    const months: { [key: string]: number } = {
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

    const month = months[monthStr];
    const year = parseInt(yearStr, 10);

    if (month === undefined || isNaN(year)) return new Date(0);

    const fullYear = year < 100 ? 2000 + year : year;

    return new Date(fullYear, month, 1);
}
