/**
 * Formats epoch timestamp (seconds) to time string for PostgreSQL TIME type
 * @param timestamp - Epoch timestamp in seconds
 * @returns Formatted time string in HH:MM:SS format (24-hour, e.g., "13:16:28")
 */
export function formatTime(timestamp: number): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp * 1000);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
