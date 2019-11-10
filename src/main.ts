import { ErrorMapper } from "ErrorMapper";
import { runRole } from "creeps";

export const loop = ErrorMapper.wrapLoop(() => {
    console.log(`Current game tick is ${Game.time}`);

    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }

    for (let creep in Game.creeps)
    {
        runRole(Game.creeps[creep]);
    }
});
