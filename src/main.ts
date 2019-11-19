import { runRole } from "creeps";
import { roomPositionToPoint } from "point";
import { spawnIfNeeded } from "spawning";
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

    spawnIfNeeded(mainSpawn.room);

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
            structure.structureType === STRUCTURE_EXTENSION ? n + 1 : n
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

    const towers: StructureTower[] = _.filter(mainSpawn.room.find<StructureTower>(FIND_MY_STRUCTURES),
            (structure: Structure) =>
            structure.structureType === STRUCTURE_TOWER
        );
    if (towers.length > 0)
    {
        const hostileCreeps: AnyCreep[] = mainSpawn.room.find(FIND_HOSTILE_CREEPS);
        const demagedStructures: Structure[] = mainSpawn.room.find(FIND_STRUCTURES
            , { filter: (s: Structure) => s.hits < s.hitsMax && s.hits < 100000}
            );
        for (const tower of towers)
        {
            if (hostileCreeps.length > 0)
            {
                tower.attack(hostileCreeps[0]);
            }
            else if (demagedStructures)
            {
                tower.repair(demagedStructures[0]);
            }
        }
    }
};
