export function arePositionsEqual(p1: RoomPosition, p2: RoomPosition): boolean
{
    return (p1.x === p2.x && p1.y === p2.y && p1.roomName === p2.roomName);
}
