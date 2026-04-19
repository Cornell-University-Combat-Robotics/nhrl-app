//TODO: encapsulate this -- currently in both trackedRobots & upcomingFightCard & highlightedFight
export function getRobotPhotoURL(name: string) {
    const refinedName = name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    const baseUrlHead = "https://brettzone.nhrl.io/brettZone/getBotPic.php?bot=";
    const baseUrlTail = "&thumb=1";
    const url = baseUrlHead + encodeURIComponent(refinedName) + baseUrlTail;
    return url;
}