// import harvester = require("./harvester");
import * as harvester from "./harvester";
import * as upgrader from "./upgrader";
// import upgrader = require("./upgrader");
/**
 * This function is executed *every tick*.
 *
 * @export
 */
export function loop()
{
  // Screeps system expects this "loop" method in main.js to run the
  // application. If we have this line, we can be sure that the globals are
  // bootstrapped properly and the game loop is executed.
  // http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture

    for (let name in Memory.creeps)
    {
        if (!Game.creeps[name])
        {
            delete Memory.creeps[name];
            console.log("Clearing non-existing creep memory:", name);
        }
    }
    let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === "harvester");
    console.log("Harvesters: " + harvesters.length);

    let building = false;

    if (harvesters.length < 2)
    {
        let newName = Game.spawns["Spawn1"].createCreep([WORK, CARRY, MOVE, MOVE],
            undefined, {role: "harvester", state: 0});
        console.log("Spawning new harvester: " + newName);
        building = true;
    }

    let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === "upgrader");
    console.log("Upgraders: " + upgraders.length);
    if (upgraders.length < 6 && !building)
    {
        let newName = Game.spawns["Spawn1"].createCreep([WORK, CARRY, MOVE, MOVE], undefined, {role: "upgrader"});
        console.log("Spawning new upgrader: " + newName);
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
