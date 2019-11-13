import { runBuilder, spawnBuilder } from "creep/builder";
import { runHarvester, spawnHarvester  } from "creep/harvester";
import { runUpgrader, spawnUpgrader } from "creep/upgrader";

export { spawnHarvester, spawnUpgrader, spawnBuilder };

const creepRoles: { [creepName: string]: (creep: Creep) => void } = {
    builder: runBuilder,
    harvester: runHarvester,
    upgrader: runUpgrader
};

export function runRole(creep: Creep)
{
    const f = creepRoles[creep.memory.role];
    if (f === null)
    {
        console.log("ERROR role: " + creep.memory.role + " is unknowen!!!");
        return;
    }

    f(creep);
}
