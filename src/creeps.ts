import { runWorker, spawnWorker } from "creep/worker";

export { spawnWorker };


export function runRole(creep: Creep)
{
    if(creep.memory.role == CreepRole.Worker)
    {
        runWorker(creep);
    }
    else
    {
        console.log("ERROR role: " + creep.memory.role + " is unknowen!!!");
    }
}
