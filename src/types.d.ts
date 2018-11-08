interface CreepMemory {
    role: string;
    state: number;
    path: PathStep[];
    targetPos: RoomPosition;
    previousPosition: RoomPosition;
    pathTick: number;
}

interface Memory {
    creepIdCounter: number
}

interface SpawnMemory {
}
