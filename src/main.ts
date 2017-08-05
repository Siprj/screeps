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

  // CONTROLLER_STRUCTURES: {
  //      "spawn": {0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 3},
  //      "extension": {0: 0, 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60},
  //      "link": {1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 3, 7: 4, 8: 6},
  //      "road": {0: 2500, 1: 2500, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500},
  //      "constructedWall": {1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500},
  //      "rampart": {1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500},
  //      "storage": {1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1},
  //      "tower": {1: 0, 2: 0, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 6},
  //      "observer": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1},
  //      "powerSpawn": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1},
  //      "extractor": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1},
  //      "terminal": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1},
  //      "lab": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 3, 7: 6, 8: 10},
  //      "container": {0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5},
  //      "nuker": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1}
  //  },

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

    Game.spawns["Spawn1"].memory.building = false;
    if (harvesters.length < 2)
    {
        let newName = Game.spawns["Spawn1"].createCreep([WORK, CARRY, MOVE, MOVE],
            undefined, {role: "harvester", state: 0});
        Game.spawns["Spawn1"].memory.building = true;
        console.log("Spawning new harvester: " + newName);
    }

    let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === "upgrader");
    console.log("Upgraders: " + upgraders.length);
    if (upgraders.length < 6 && Game.spawns["Spawn1"].memory.building === false)
    {
        let newName = Game.spawns["Spawn1"].createCreep([WORK, CARRY, MOVE, MOVE],
            undefined, {role: "upgrader", tate: 0});
        Game.spawns["Spawn1"].memory.building = true;
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
