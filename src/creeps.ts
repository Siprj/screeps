import { spawnHarvester, runHarvester } from "creep/harvester"
import { spawnUpgrader, runUpgrader } from "creep/upgrader"
import { spawnBuilder, runBuilder } from "creep/builder"

export { spawnHarvester, spawnUpgrader, spawnBuilder };

const creepRoles:{ [creepName: string]: (creep: Creep) => void } = {
    "harvester": runHarvester,
    "upgrader": runUpgrader,
    "builder": runBuilder
}

export function runRole(creep: Creep)
{
    let f = creepRoles[creep.memory.role];
    if (f == null)
    {
        console.log("ERROR role: " + creep.memory.role + " is unknowen!!!")
        return;
    }

    f(creep);
}

