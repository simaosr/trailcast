export class DateService {
    /**
     * Format date to display in a more readable format
     * @param dateStr - Date string in ISO format
     * @returns Formatted date string (e.g., "24 Aug")
     */
    static formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return `${date.getDate()} ${date.toLocaleDateString(undefined, { month: 'short' })}`;
    }

    /**
     * Format time to 12-hour format with AM/PM
     * @param date - Date object
     * @returns Object containing formatted time and period
     */
    static formatTime(date: Date): { time: string; period: string } {
        return {
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            period: date.getHours() >= 12 ? 'PM' : 'AM'
        };
    }

    /**
     * Check if the given time is during night hours
     * @param date - Date object
     * @returns boolean indicating if it's night time
     */
    static isNightTime(date: Date): boolean {
        const hour = date.getHours();
        return hour >= 20 || hour <= 6;
    }
}
