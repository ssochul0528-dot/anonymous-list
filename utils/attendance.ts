
export function getAttendanceTargetDate(now: Date = new Date()): Date {
    // Attendance window: Wed 12:00 to Tue 12:00
    // If now is before Tue 12:00, target is this week's Wednesday (if now is Mon) or upcoming Wednesday.
    // Actually, let's simplify: 
    // If now is after Wednesday 12:00, the target is the NEXT Wednesday.
    // If now is before Wednesday 12:00, the target is THIS Wednesday.

    const day = now.getDay(); // 0 (Sun) to 6 (Sat)
    const hours = now.getHours();

    const target = new Date(now);
    target.setHours(0, 0, 0, 0);

    // Find this week's Wednesday (3)
    const diff = 3 - day;
    target.setDate(now.getDate() + diff);

    // If today is Wednesday and it's after 12:00, target is next week's Wednesday
    if (day === 3 && hours >= 12) {
        target.setDate(target.getDate() + 7);
    }
    // If today is Thu, Fri, Sat, it's already past this week's window start, so target is next Wed
    else if (day > 3) {
        target.setDate(target.getDate() + 7);
    }

    return target;
}

export function isAttendanceWindowOpen(now: Date = new Date()): boolean {
    const day = now.getDay(); // 0 (Sun) to 6 (Sat)
    const hours = now.getHours();

    // Window: Wed 12:00 to Tue 18:00
    // Closed if:
    // 1. Tue after 18:00
    if (day === 2 && hours >= 18) return false;
    // 2. Wed before 12:00
    if (day === 3 && hours < 12) return false;

    // Otherwise open
    return true;
}

export function formatDate(date: Date): string {
    const months = date.getMonth() + 1;
    const days = date.getDate();
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekDay = weekDays[date.getDay()];
    return `${months}월 ${days}일 (${weekDay})`;
}
