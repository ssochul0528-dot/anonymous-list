export function getAttendanceTargetDate(now: Date = new Date(), gameDay: number = 3): Date {
    // gameDay: 0 (Sun) to 6 (Sat). Default 3 (Wed)
    const day = now.getDay();
    const hours = now.getHours();

    const target = new Date(now);
    target.setHours(0, 0, 0, 0);

    // Find this week's gameDay
    const diff = gameDay - day;
    target.setDate(now.getDate() + diff);

    // If today is gameDay and it's after 12:00, target is next week's gameDay
    if (day === gameDay && hours >= 12) {
        target.setDate(target.getDate() + 7);
    }
    // If today is after gameDay, target is next week's gameDay
    else if (day > gameDay) {
        target.setDate(target.getDate() + 7);
    }

    return target;
}

export function isAttendanceWindowOpen(now: Date = new Date(), gameDay: number = 3): boolean {
    const day = now.getDay();
    const hours = now.getHours();

    // Window: Opens GameDay 12:00 (for NEXT week), Closes (GameDay-1) 18:00 (for THIS week)
    // This is equivalent to saying it's CLOSED between (GameDay-1) 18:00 and GameDay 12:00

    const closeDay = (gameDay - 1 + 7) % 7;
    const openDay = gameDay;

    // 1. If it's the day before gameDay, closed after 18:00
    if (day === closeDay && hours >= 18) return false;

    // 2. If it's the gameDay itself, closed before 12:00
    if (day === openDay && hours < 12) return false;

    return true;
}

export function formatDate(date: Date): string {
    const months = date.getMonth() + 1;
    const days = date.getDate();
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekDay = weekDays[date.getDay()];
    return `${months}월 ${days}일 (${weekDay})`;
}
