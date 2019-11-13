// example declaration file - remove these and add your own custom typings

interface WorkerMemory {}
interface BuilderMemory {}

interface CreepMemory
{
  role: string;
  working: boolean;
  designatedSource: string;
  roleMemory: WorkerMemory | BuilderMemory;
}

interface BuilderMemory
{
  role: string;
  working: boolean;
  workAction: number;
}

interface SpawnMemory {
    spawnCount: number,
    spiralN: number
}
