
import {moveToTargetInRangeOf, prepareCreepMovement} from "./creep/movement";

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
    if (moveToTargetInRangeOf(creep, 1) === true)
    {
        creep.memory.state = RoleUpgraderState.HARVESTING;
    }
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
            prepareCreepMovement(creep, target.pos);
            creep.memory.state = RoleUpgraderState.MOVING_TO_CONTROLLER;
            processMowingToController(creep);
        }
        else
        {
            // TODO: After expanding to new rooms where is no controler think
            // about better handling.
            console.log("Critical ERROR: " + creep.name + " Room controller is null!!!!");
        }
    }
}

function processSupplyingController(creep: Creep) {

    if (creep.room.controller !== null)
    {
        creep.upgradeController(<StructureController> creep.room.controller);
    }
    else
    {
        // TODO: After expanding to new rooms where is no controler think
        // about better handling.
        console.log("Critical ERROR: " + creep.name + " Room controller is null!!!!");
    }

    if (creep.carry[RESOURCE_ENERGY] === 0) {
        creep.memory.state = RoleUpgraderState.WAITING;
        // TODO: Is it realy right to call wait after state change???
        processWaiting(creep);
    }
}

function processWaiting(creep: Creep) {
    // TODO: Acquire source based on it's load.
    let source = <Source> creep.room.find(FIND_SOURCES)[0];

    // Set destination position and precompute path to make the rest of movement
    // more efective.
    prepareCreepMovement(creep, source.pos);
    // Now lets move to source
    creep.memory.state = RoleUpgraderState.MOVING_TO_SOURCE;
    processMoveingToSource(creep);
}

function processMowingToController(creep: Creep) {
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
