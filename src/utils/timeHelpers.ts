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
