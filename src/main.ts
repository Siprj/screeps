import { runRole, spawHarvester, spawUpgrader} from "creeps";
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
    let harvesters = _.filter(Game.creeps, (creep: Creep) => {creep.memory.role == "harvester"});
    let upgraders = _.filter(Game.creeps, (creep: Creep) => {creep.memory.role == "upgrader"});

    if (harvesters.length < 2 && mainSpawn.spawning == null && energyDeficit == 0)
    {
        spawHarvester(mainSpawn);
    }
    else if (upgraders.length < 8 && mainSpawn.spawning == null && energyDeficit == 0)
    {
        spawUpgrader(mainSpawn);
    }

    for (let creep in Game.creeps)
    {
        runRole(Game.creeps[creep]);
    }

    let controller = mainSpawn.room.controller;
    if (controller == null)
        return;

    console.log("hm....");
    let extensions = _.filter(Game.structures, (structure: Structure) => structure.structureType == STRUCTURE_EXTENSION);
    console.log(extensions.length);
    console.log(CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][controller.level]);
    if (extensions.length < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][controller.level])
    {
        console.log("trying to build extensions");
        const spiralN = (mainSpawn.memory.spiralN == null) ? 0 : mainSpawn.memory.spiralN;
        mainSpawn.memory.spiralN = spiralN + 1;
        const pos = mainSpawn.pos;
        const point = siralAroundPoint(spiralN, roomPositionToPoint(pos));
        controller.room.createConstructionSite(point.x, point.y, STRUCTURE_EXTENSION);
    }
}
