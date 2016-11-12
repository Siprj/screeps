import {moveToTargetInRangeOf, prepareCreepMovement} from "./creep/movement";

export const enum RoleHarvesterState {
    WAITING = 0,
    SUPPLYING_SPAWN = 1,
    MOVING_TO_SPAWN = 2,
    MOVING_TO_SOURCE = 3,
    SUPPLYING_EXTENSION = 4,
    HARVESTING = 5
};

function processHarvesting(creep: Creep) {
    // console.log("Processing Harvesting");
    let sources = creep.room.find(FIND_SOURCES);
    creep.memory.pokus = sources[0];
    creep.harvest(creep.memory.pokus);

    // TODO: Decide where to go (spawn/extension)
    if (creep.carry.energy >= creep.carryCapacity) {
        let targets = creep.room.find<Structure>(FIND_STRUCTURES, {
            filter: (structure: Structure) => {
                return (structure.structureType === STRUCTURE_SPAWN);
            }
        });
        prepareCreepMovement(creep, targets[0].pos);
        creep.memory.state = RoleHarvesterState.MOVING_TO_SPAWN;
        processMowingToSpawn(creep);
    }
}

function processMowingToSpawn(creep: Creep) {
    if (moveToTargetInRangeOf(creep, 1) === true)
    {
        creep.memory.state = RoleHarvesterState.SUPPLYING_SPAWN;
    }
}

function processSupplyingSpawn(creep: Creep) {
    // console.log("Processing SupplyingSpawn");
    let targets = creep.room.find<StructureSpawn>(FIND_STRUCTURES, {
        filter: (structure: StructureSpawn) => {
            return (structure.structureType === STRUCTURE_EXTENSION
                || structure.structureType === STRUCTURE_SPAWN) &&
                structure.energy < structure.energyCapacity;
        }
    });
    if (targets.length > 0) {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0]);
        }
    }

    if (creep.carry[RESOURCE_ENERGY] === 0) {
        creep.memory.state = RoleHarvesterState.WAITING;
    }
}

function processSupplyingExtension(creep: Creep) {
    // console.log("Processing SupplyingExtensio");
    creep.memory.state = RoleHarvesterState.WAITING;
}

function processWaiting(creep: Creep) {
    // console.log("Processing Waiting!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    // console.log("Processing Waiting");
    // console.log("creep.room.energyAvailable: " + creep.room.energyAvailable);
    // console.log("creep.room.energyCapacityAvailable: " + creep.room.energyCapacityAvailable);
    if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
        // TODO: Acquire source based on it's load.
        let source = <Source> creep.room.find(FIND_SOURCES)[0];

        // Set destination position and precompute path to make the rest of movement
        // more efective.
        prepareCreepMovement(creep, source.pos);
        // Now lets move to source
        creep.memory.state = RoleHarvesterState.MOVING_TO_SOURCE;
        processMowingToSource(creep);
    }
}

function processMowingToSource(creep: Creep)
{
    console.log(creep.name + "Processing MowingToSource!!!!!");
    console.log(creep.name + "Processing MowingToSource");
    if (moveToTargetInRangeOf(creep, 1) === true)
    {
        creep.memory.state = RoleHarvesterState.HARVESTING;
    }
}

export function run(creep: Creep) {

    switch (creep.memory.state) {
        case RoleHarvesterState.HARVESTING:
            processHarvesting(creep);
            break;

        case RoleHarvesterState.SUPPLYING_SPAWN:
            processSupplyingSpawn(creep);
            break;

        case RoleHarvesterState.SUPPLYING_EXTENSION:
            processSupplyingExtension(creep);
            break;

        case RoleHarvesterState.WAITING:
            processWaiting(creep);
            break;

        case RoleHarvesterState.MOVING_TO_SPAWN:
            processMowingToSpawn(creep);
            break;

        case RoleHarvesterState.MOVING_TO_SOURCE:
            processMowingToSource(creep);
            break;

        default:
            processWaiting(creep);
            break;
    }
}
