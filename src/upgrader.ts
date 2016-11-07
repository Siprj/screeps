
export const enum RoleUpgraderState {
    WAITING = 0,
    SUPPLYING_CONTROLLER = 1,
    MOVING_TO_CONTROLLER = 2,
    MOVING_TO_SOURCE = 3,
    HARVESTING = 4
};

const UPGRADING_RANGE = 3;

function processMoveingToSource(creep: Creep)
{
    console.log(creep.name + "Processing MowingToSource!!!!!");
    console.log(creep.name + "Processing MowingToSource");
    // console.log("Path: " + creep.memory.path);
    let res = creep.moveByPath(creep.memory.path);
    // console.log("Res: " + res);
    // console.log("Pokus pos: " + creep.pos);
    // console.log("Pokus targetPos: " + creep.memory.targetPos.x);
    let targetPos = creep.memory.targetPos;
    // console.log("Pokus: " + creep.pos.isNearTo(targetPos.x, targetPos.y));
    if (creep.pos.isNearTo(targetPos.x, targetPos.y)) {
        creep.memory.state = RoleUpgraderState.HARVESTING;
        processHarvesting(creep);
    }
    else {
        switch (res) {
            case OK:
                // code
                console.log(creep.name + " processMowingToController: OK");
                break;
            case ERR_NOT_OWNER:
                // code
                console.log(creep.name + " processMowingToController: ERR_NOT_OWNER");
                break;
            case ERR_BUSY:
                // code
                console.log(creep.name + " processMowingToController: ERR_BUSY");
                break;
            case ERR_NOT_FOUND:
                creep.memory.path = creep.pos.findPathTo(targetPos.x, targetPos.y);
                console.log(creep.name + " processMowingToController: ERR_NOT_FOUND");
                break;
            case ERR_INVALID_ARGS:
                // code
                console.log(creep.name + " processMowingToController: ERR_INVALID_ARGS");
                break;
            case ERR_TIRED:
                // code
                console.log(creep.name + " processMowingToController: ERR_TIRED");
                break;
            case ERR_NO_BODYPART:
                // code
                console.log(creep.name + " processMowingToController: ERR_NO_BODYPART");
                break;

            default:
            // code
                console.log(creep.name + " processMowingToController: default");
        }
    }
}

function processHarvesting(creep: Creep) {
    // console.log("Processing Harvesting");
    // There is moltiple ways how to acquire source where is the creap suspse to
    // harvest:
    //    * Store source id and find source by id,
    //      see: http://support.screeps.com/hc/en-us/articles/203016382-Game#getObjectById
    //    * Use find() function for finding the sources and filter out the one
    //      with correct position,
    //      see: http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#look
    //    * Use lookAt() function to find out which object are available at the
    //      position and filter out the source,
    //      see: http://support.screeps.com/hc/en-us/articles/203079011-Room#lookAt
    let sources = <Source[]> creep.room.find(FIND_SOURCES, {filter: { pos: creep.memory.targetPos}});
    // let source =
    if (sources.length !== 0)
    {
        let source = sources[0];
        // TODO: Error handling !!!!!!!
        creep.harvest(source);
    }

    // TODO: Thing about next destination (this may be used done in some another
    // state).
    if (creep.carry.energy >= creep.carryCapacity) {
        if (creep.room.controller !== null)
        {
            let targets = <StructureController> creep.room.controller;
            creep.memory.path = creep.pos.findPathTo(targets.pos);
            creep.memory.targetPos = targets.pos;
            creep.memory.state = RoleUpgraderState.MOVING_TO_CONTROLLER;
            processMowingToController(creep);
        }
        else
        {
            // TODO: After expanding to new rooms where is no controler think
            // about better handling.
            console.log(creep.name + "Room controller is null!!!!");
        }
    }
}

function processSupplyingController(creep: Creep) {
    console.log(creep.name + "Processing SupplyingController");

    if (creep.room.controller !== null)
    {
        creep.upgradeController(<StructureController> creep.room.controller);
    }
    else
    {
        // TODO: After expanding to new rooms where is no controler think
        // about better handling.
        console.log(creep.name + "Room controller is null!!!!");
    }

    if (creep.carry[RESOURCE_ENERGY] === 0) {
        creep.memory.state = RoleUpgraderState.WAITING;
        // TODO: Is it realy right to call wait after state change???
        processWaiting(creep);
    }
}

function processWaiting(creep: Creep) {
    console.log(creep.name + "Processing Waiting!!!!!!!!!");
    // console.log("creep.room.energyAvailable: " + creep.room.energyAvailable);
    // console.log("creep.room.energyCapacityAvailable: " + creep.room.energyCapacityAvailable);
    // console.log("Make creep harvest");
    // console.log("Creep state befor change: " + creep.memory.state);
    // TODO: Acquire source based on it's load.
    let source = <Source> creep.room.find(FIND_SOURCES)[0];

    // Set destination position and precompute path to make the rest of movement
    // more efective.
    let targetPos = source.pos;
    creep.memory.targetPos = targetPos;
    creep.memory.path = creep.pos.findPathTo(targetPos.x, targetPos.y);
    // console.log("Creep pokus set to source: " + creep.memory.path);

    // Now lets move to source
    creep.memory.state = RoleUpgraderState.MOVING_TO_SOURCE;
    processMoveingToSource(creep);
    // console.log("Creep state after change: " + creep.memory.state);
}

function processMowingToController(creep: Creep) {
    console.log(creep.name + "Processing MowingToController");
    // console.log("Path length: " + creep.memory.path);
    let res = creep.moveByPath(creep.memory.path);
    // console.log("Res: " + res);
    // console.log("Pokus pos: " + creep.pos);
    // console.log("Pokus targetPos: " + creep.memory.targetPos.x);
    let targetPos = creep.memory.targetPos;
    let targetRoomPos = <RoomPosition> creep.room.getPositionAt(targetPos.x, targetPos.y);
    console.log("Pokus: " + creep.pos.inRangeTo(targetRoomPos, UPGRADING_RANGE));
    if (creep.pos.inRangeTo(targetRoomPos, UPGRADING_RANGE)) {
        creep.memory.state = RoleUpgraderState.SUPPLYING_CONTROLLER;
        processHarvesting(creep);
    }
    else {
        switch (res) {
            case OK:
                // code
                console.log(creep.name + "processMowingToController: OK");
                break;
            case ERR_NOT_OWNER:
                // code
                console.log(creep.name + "processMowingToController: ERR_NOT_OWNER");
                break;
            case ERR_BUSY:
                // code
                console.log(creep.name + "processMowingToController: ERR_BUSY");
                break;
            case ERR_NOT_FOUND:
                console.log(creep.name + "processMowingToController: ERR_NOT_FOUND");
                creep.memory.path = creep.pos.findPathTo(targetRoomPos);
                break;
            case ERR_INVALID_ARGS:
                // code
                console.log(creep.name + "processMowingToController: ERR_INVALID_ARGS");
                break;
            case ERR_TIRED:
                // code
                console.log(creep.name + "processMowingToController: ERR_TIRED");
                break;
            case ERR_NO_BODYPART:
                // code
                console.log(creep.name + "processMowingToController: ERR_NO_BODYPART");
                break;

            default:
            // code
                console.log(creep.name + "processMowingToController: default");
        }
    }
}

export function run(creep: Creep) {

    // if (creep.memory.upgrading && creep.carry.energy === 0) {
    //     creep.memory.upgrading = false;
    //     creep.say("harvesting");
    // }
    // if (!creep.memory.upgrading && creep.carry.energy === creep.carryCapacity) {
    //     creep.memory.upgrading = true;
    //     creep.say("upgrading");
    // }
    //
    // if (creep.memory.upgrading) {
    //     if (creep.upgradeController(<StructureController> creep.room.controller) === ERR_NOT_IN_RANGE) {
    //         creep.moveTo(<StructureController> creep.room.controller);
    //     }
    // }
    // else {
    //     let sources = creep.room.find<Source>(FIND_SOURCES);
    //     if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
    //         creep.moveTo(sources[0]);
    //     }
    // }

    switch (creep.memory.state) {
        case RoleUpgraderState.HARVESTING:
            processHarvesting(creep);
            break;

        case RoleUpgraderState.SUPPLYING_CONTROLLER:
            processSupplyingController(creep);
            break;

        case RoleUpgraderState.WAITING:
            processWaiting(creep);
            break;

        case RoleUpgraderState.MOVING_TO_SOURCE:
            processMoveingToSource(creep);
            break;

        case RoleUpgraderState.MOVING_TO_CONTROLLER:
            processMowingToController(creep);
            break;

        default:
            processWaiting(creep);
            break;
    }
}
