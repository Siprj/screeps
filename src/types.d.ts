interface CreepMemory {
    role: string;
    state: number;
    path: PathStep[];
    targetPos: RoomPosition;
    previousPosition: RoomPosition;
    pathTick: number;
}

interface Memory {
  building: string;
}

interface SpawnMemory {
  building: boolean;
}
