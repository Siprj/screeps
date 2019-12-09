
declare const enum CreepRole
{
    Worker = 1
}

declare const enum WorkerState
{
    Mining = 1,
    Moving = 2,
    Building = 3,
    Repairing = 4,
    Upgrading = 5,
    PickingUp = 6,
    Filling = 7,
}

interface WorkerMemory
{
    sourceId: string;

    state: WorkerState;
    targetId: string;
    targetPos: RoomPosition;
    targetPosDistance: number;
    nextState: WorkerState; // Next state in case the current state is move state.
    // Not ideal solution but hack.. I don't care.
}

interface CreepMemory
{
    role: CreepRole;
    roleMemory: WorkerMemory;
}

interface SpawnMemory
{
    spawnCount: number;
    spiralN: number;
}

interface RoomMemory
{
    workerCount: number;
    sourceCreepCount: {[sourceId: string]: number};
    sourceCreepRatio: {[sourceId: string]: number};
}
