interface UpgraderMemory
{
    working: boolean;
    sourceId: string;
}

interface HarvesterMemory
{
    working: boolean;
    sourceId: string;
}

interface BuilderMemory
{
    working: boolean;
    sourceId: string;
    targetId: string;
}

interface CreepMemory
{
  role: string;
  roleMemory: HarvesterMemory | UpgraderMemory | BuilderMemory;
}

interface SpawnMemory
{
    spawnCount: number;
    spiralN: number;
}

interface RoomMemory
{
    harvesterCount: number;
    builderCount: number;
    upgraderCount: number;
    sourceCreepCount: {[sourceId: string]: number};
    sourceCreepRatio: {[sourceId: string]: number};
}
