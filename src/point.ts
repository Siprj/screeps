export class Point {
    public x: number = 0;
    public y: number = 0;
}

export function roomPositionToPoint(roomPos: RoomPosition): Point
{ 
    let point = new Point();
    point.x = roomPos.x;
    point.y = roomPos.y;
    return point;
}

