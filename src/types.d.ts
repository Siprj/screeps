// example declaration file - remove these and add your own custom typings

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
