import { runRole, spawnHarvester, spawnUpgrader, spawnBuilder} from "creeps";
import { siralAroundPoint } from "ulam-spiral";
import { roomPositionToPoint } from "point";

export const loop = function ()
{
    console.log(`Current game tick is ${Game.time}`);

    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }

    let mainSpawn = Game.spawns["Spawn1"];
    let energyDeficit = mainSpawn.room.energyCapacityAvailable - mainSpawn.room.energyAvailable;
    let harvesterCount = _.reduce(Game.creeps, (n: number, creep: Creep) => { return creep.memory.role == "harvester" ? n + 1: n }, 0);
    let upgraderCount = _.reduce(Game.creeps, (n: number, creep: Creep) => { return creep.memory.role == "upgrader" ? n + 1: n }, 0);
    let builderCount = _.reduce(Game.creeps, (n: number, creep: Creep) => { return creep.memory.role == "builder" ? n + 1: n }, 0);

    console.log("harvesterCount: " + harvesterCount);
    console.log("upgraderCount: " + upgraderCount);
    console.log("builderCount: " + builderCount);

    if (harvesterCount < 2 && mainSpawn.spawning == null && energyDeficit == 0)
    {
        spawnHarvester(mainSpawn);
    }
    else if (upgraderCount < 2 && mainSpawn.spawning == null && energyDeficit == 0)
    {
        spawnUpgrader(mainSpawn);
    }
    else if (builderCount < 1 && mainSpawn.spawning == null && energyDeficit == 0)
    {
        spawnBuilder(mainSpawn);
    }

    for (let creep in Game.creeps)
    {
        runRole(Game.creeps[creep]);
    }

    let controller = mainSpawn.room.controller;
    if (controller == null)
        return;

    const extensionCount = _.reduce(Game.structures,
        ( n:number, structure: Structure) =>
            { return structure.structureType == STRUCTURE_EXTENSION ? n + 1: 1 }
        , 0);
    const extensionCSCount =
        _.filter(mainSpawn.room.find(FIND_CONSTRUCTION_SITES)
        , (cs: ConstructionSite) =>
            { return cs.structureType == STRUCTURE_EXTENSION; }
        ).length;
    console.log(extensionCount);
    console.log(extensionCSCount);
    if ((extensionCount + extensionCSCount) < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][controller.level])
    {
        const spiralN = (mainSpawn.memory.spiralN == null) ? 0 : mainSpawn.memory.spiralN;
        mainSpawn.memory.spiralN = spiralN + 1;
        const pos = mainSpawn.pos;
        const point = siralAroundPoint(spiralN, roomPositionToPoint(pos));
        controller.room.createConstructionSite(point.x, point.y, STRUCTURE_EXTENSION);
    }
}
