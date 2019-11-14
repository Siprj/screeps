import { runRole, spawnBuilder, spawnHarvester, spawnUpgrader } from "creeps";
import { roomPositionToPoint } from "point";
import { siralAroundPoint } from "ulam-spiral";

export const loop = () =>
{
    console.log(`Current game tick is ${Game.time}`);

    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }

    const mainSpawn = Game.spawns["Spawn1"];
    const energyDeficit = mainSpawn.room.energyCapacityAvailable - mainSpawn.room.energyAvailable;
    const harvesterCount = _.reduce(Game.creeps,
        (n: number, creep: Creep) => creep.memory.role === "harvester" ? n + 1 : n, 0);
    const upgraderCount = _.reduce(Game.creeps,
        (n: number, creep: Creep) => creep.memory.role === "upgrader" ? n + 1 : n, 0);
    const builderCount = _.reduce(Game.creeps,
        (n: number, creep: Creep) => creep.memory.role === "builder" ? n + 1 : n, 0);

    console.log("harvesterCount: " + harvesterCount);
    console.log("upgraderCount: " + upgraderCount);
    console.log("builderCount: " + builderCount);

    if (harvesterCount < 2 && mainSpawn.spawning == null && energyDeficit === 0)
    {
        spawnHarvester(mainSpawn);
    }
    else if (upgraderCount < 2 && mainSpawn.spawning == null && energyDeficit === 0)
    {
        spawnUpgrader(mainSpawn);
    }
    else if (builderCount < 1 && mainSpawn.spawning == null && energyDeficit === 0)
    {
        spawnBuilder(mainSpawn);
    }

    for (const creep in Game.creeps)
    {
        runRole(Game.creeps[creep]);
    }

    const controller = mainSpawn.room.controller;
    if (controller == null)
    {
        return;
    }

    const extensionCount = _.reduce(Game.structures,
        ( n: number, structure: Structure) =>
            structure.structureType === STRUCTURE_EXTENSION ? n + 1 : 1
        , 0);
    const extensionCSCount =
        _.filter(mainSpawn.room.find(FIND_CONSTRUCTION_SITES)
        , (cs: ConstructionSite) =>
            cs.structureType === STRUCTURE_EXTENSION
        ).length;
    console.log(extensionCount);
    console.log(extensionCSCount);
    if ((extensionCount + extensionCSCount) < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][controller.level])
    {
        const spiralN = (mainSpawn.memory.spiralN === null) ? 0 : mainSpawn.memory.spiralN;
        mainSpawn.memory.spiralN = spiralN + 1;
        const pos = mainSpawn.pos;
        const point = siralAroundPoint(spiralN, roomPositionToPoint(pos));
        controller.room.createConstructionSite(point.x, point.y, STRUCTURE_EXTENSION);
    }

    const towers: Array<StructureTower> = _.filter(mainSpawn.room.find<StructureTower>(FIND_MY_STRUCTURES),
            (structure: Structure) =>
            structure.structureType === STRUCTURE_TOWER
        );
    if (towers.length > 0)
    {
        const hostileCreeps: Array<AnyCreep> = mainSpawn.room.find(FIND_HOSTILE_CREEPS);
        for (const tower of towers)
        {
            if (hostileCreeps.length > 0)
            {
                tower.attack(hostileCreeps[0]);
            }
        }
    }
};
