
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
    if (moveToTargetInRangeOf(creep, 1) === true)
    {
        creep.memory.state = RoleUpgraderState.HARVESTING;
    }
}

/**
 * Move creap to it's destination and stops in range.
 * Some hiden (in creap local memory) parameters:
 * * Target is given by internal creep memory creep.memory.targetPos;
 * * Precalculated path is store in creep.memory.path;
 * * Previous creap position is stored in creep.memory.path;
 *
 * @param creep Creep creep which should move.
 * @param range number how close to the target the creep needs to get.
 * @returns true if is is at it's destinatio, false if not.
 */
function moveToTargetInRangeOf(creep: Creep, range: number): boolean
{
    console.log(creep.name + "moveToTargetInRangeOf");
    // console.log(creep.name + "Processing MowingToSource");
    // console.log("Path: " + creep.memory.path);
    // console.log("Res: " + res);
    // console.log("Pokus pos: " + creep.pos);
    // console.log("Pokus targetPos: " + creep.memory.targetPos.x);

    let targetPos = creep.memory.targetPos;
    // console.log("Pokus: " + creep.pos.isNearTo(targetPos.x, targetPos.y));

    // Object in memory are type of Object and there is no easy way how to
    // convert them back to original form/type. So there is small "shortcut" to
    // creating the RoomPosition object ;).
    let targetRoomPos =
        <RoomPosition> creep.room.getPositionAt(targetPos.x, targetPos.y);
    if (creep.pos.inRangeTo(targetRoomPos, range)) {
        return true;
    }
    else
    {
        // There is need to check previous creep position and current creep
        // position to prevent blocking the creap by another creep before him...
        // Because the function moveByPath() is not checking if folowint path is
        // blocked by another standing creap.
        if (creep.memory.previousPosition)
        {
            let prevPos = <RoomPosition> creep.memory.previousPosition;
            if (arePositionsEqual(prevPos, creep.pos))
            {
                console.log(creep.name + "recalculating the route");
                creep.memory.path = creep.pos.findPathTo(targetPos.x, targetPos.y);
            }
        }
        creep.memory.previousPosition = creep.pos;

        let res = creep.moveByPath(creep.memory.path);
        switch (res) {
            case OK:
                break;
            case ERR_NOT_OWNER:
                // TODO: This is critical error ...
                console.log("Critical ERROR: " + creep.name
                    + " moveToTargetInRangeOf: ERR_NOT_OWNER");
                break;
            case ERR_BUSY:
                // Creap is still being spowned....
                break;
            case ERR_NOT_FOUND:
                creep.memory.path = creep.pos.findPathTo(targetPos.x, targetPos.y);
                console.log(creep.name + " moveToTargetInRangeOf: ERR_NOT_FOUND");
                break;
            case ERR_INVALID_ARGS:
                // TODO: This is critical error maybe I shoud send some
                // notification.
                console.log("Critical ERROR: " + creep.name
                    + " moveToTargetInRangeOf: ERR_INVALID_ARGS");
                break;
            case ERR_TIRED:
                // TODO: This error code may be usefull in future. For example:
                //  * I want renge create to fite if it can't move...
                break;
            case ERR_NO_BODYPART:
                // TODO: This is similar to previous error code.
                break;

            default:
                // TODO: Critical error notification should be send.
                console.log("Critical ERROR: " + creep.name
                    + " moveToTargetInRangeOf: default");
        }
    }
    return false;
}

function processHarvesting(creep: Creep) {
    // console.log("Processing Harvesting");
    // There is multiple ways how to acquire source where is the creap suspse to
    // harvest:
    //    * Store source id and find source by id,
    //      see: http://support.screeps.com/hc/en-us/articles/203016382-Game#getObjectById
    //    * Use find() function for finding the sources and filter out the one
    //      with correct position,
    //      see: http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#look
    //    * Use lookAt() function to find out which object are available at the
    //      position and filter out the source,
    //      see: http://support.screeps.com/hc/en-us/articles/203079011-Room#lookAt
    let sources = <Source[]> creep.room.find(FIND_SOURCES,
        {filter: { pos: creep.memory.targetPos}});

    if (sources.length !== 0)
    {
        let source = sources[0];
        // TODO: Error handling !!!!!!!
        creep.harvest(source);
    }

    // TODO: Thing about next destination (this may be used done in some another
    // state).
    if (creep.carry.energy >= creep.carryCapacity) {
        if (creep.room.controller)
        {
            let target = <StructureController> creep.room.controller;
            creep.memory.path = creep.pos.findPathTo(target.pos);
            creep.memory.targetPos = target.pos;
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

function arePositionsEqual(p1: RoomPosition, p2: RoomPosition): boolean
{
    return (p1.x === p2.x && p1.y === p2.y && p1.roomName === p2.roomName);
}

function processMowingToController(creep: Creep) {
    console.log(creep.name + "Processing MowingToController");
    if (moveToTargetInRangeOf(creep, UPGRADING_RANGE) === true)
    {
        creep.memory.state = RoleUpgraderState.SUPPLYING_CONTROLLER;
    }
}

export function run(creep: Creep) {
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
