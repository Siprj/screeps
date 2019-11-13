// example declaration file - remove these and add your own custom typings

interface WorkerMemory {}
interface BuilderMemory {}
interface HarvesterMemory {}

interface CreepMemory
{
  role: string;
  roleMemory: WorkerMemory | BuilderMemory | HarvesterMemory;
}

interface BuilderMemory
{
  role: string;
  working: boolean;
  workAction: number;
}

interface SpawnMemory
{
    spawnCount: number,
    spiralN: number
}
