import * as harvester from "./harvester";
import * as upgrader from "./upgrader";

function creepInit(creepRole: string): CreepMemory {
    return {
        role: creepRole,
        state: 0,
        path: [],
        targetPos: new RoomPosition(0, 0, "asdf"),
        previousPosition: new RoomPosition(0, 0, "asdf"),
        pathTick: 0
    };
}

function spawn(baseName: string, body: BodyPartConstant[], memory: CreepMemory | undefined)
{
    if(Memory.creepIdCounter === undefined)
        Memory.creepIdCounter = 0;
    else
        Memory.creepIdCounter++;
    if(Memory.creepIdCounter > 2000)
        Memory.creepIdCounter = 0;

    let newName = baseName + Memory.creepIdCounter.toString();
    console.log("Spawning new creep: " + newName);
    return Game.spawns["Spawn1"].createCreep(body, newName, memory);
}
// import upgrader = require("./upgrader");
/**
 * This function is executed *every tick*.
 *
 * @export
 */
export function loop()
{
    for (let name in Memory.creeps)
    {
        if (!Game.creeps[name])
        {
            // Maybe garbage collecting of some other stuff will be needed here.
            delete Memory.creeps[name];
            console.log("Clearing non-existing creep memory:", name);
        }
    }

    let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === "harvester");
    console.log("Harvesters: " + harvesters.length);

    let spawn_s = Game.spawns["Spawn1"];
    let initiateSpawn = false;
    if (harvesters.length < 2 && spawn_s.energy >= SPAWN_ENERGY_CAPACITY)
    {
        initiateSpawn = true;
        spawn("hv", [WORK, CARRY, MOVE, MOVE], creepInit("harvester"));
    }

    let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === "upgrader");
    console.log("Upgraders: " + upgraders.length);
    if (upgraders.length < 6
        && Game.spawns["Spawn1"].spawning === null
        && spawn_s.energy >= SPAWN_ENERGY_CAPACITY
        && !initiateSpawn)
    {
        spawn("up", [WORK, CARRY, MOVE, MOVE], creepInit("upgrader"));
    }

    for (let name in Game.creeps)
    {
        let creep = Game.creeps[name];
        if (creep.memory.role === "harvester")
        {
            harvester.run(creep);
        }
        if (creep.memory.role === "upgrader")
        {
            upgrader.run(creep);
        }
    }
}
