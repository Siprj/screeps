// example declaration file - remove these and add your own custom typings

interface UpgraderMemory
{
    working: boolean;
    designatedSource: string;
}

interface HarvesterMemory
{
    working: boolean;
    designatedSource: string;
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
    spawnCount: number,
    spiralN: number
}
