import { runRole, spawHarvester, spawUpgrader} from "creeps";

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

    if (upgraders.length < 8 && mainSpawn.spawning == null && energyDeficit == 0)
    {
        spawUpgrader(mainSpawn);
    }
    else if (harvesters.length < 2 && mainSpawn.spawning == null && energyDeficit == 0)
    {
        spawHarvester(mainSpawn);
    }

    for (let creep in Game.creeps)
    {
        runRole(Game.creeps[creep]);
    }
}
