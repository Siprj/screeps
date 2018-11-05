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
    const sources = creep.room.find(FIND_SOURCES);
    creep.harvest(sources[0]);

    // TODO: Decide where to go (spawn/extension)
    if (creep.carry.energy !== undefined)
    {
        if (creep.carry.energy >= creep.carryCapacity)
        {
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
}

function processMowingToSpawn(creep: Creep) {
    if (moveToTargetInRangeOf(creep, 1) === true)
    {
        creep.memory.state = RoleHarvesterState.SUPPLYING_SPAWN;
    }
}

function processSupplyingSpawn(creep: Creep) {
    const targets = creep.room.find<StructureSpawn | StructureExtension>(FIND_STRUCTURES, {
        filter: (structure: StructureSpawn | StructureExtension) => {
            return (structure.structureType === STRUCTURE_EXTENSION
                || structure.structureType === STRUCTURE_SPAWN) &&
                structure.energy < structure.energyCapacity;
        }
    });
    if (targets !== undefined)
    {
        if (targets.length > 0)
        {
            if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
            {
                creep.moveTo(targets[0]);
            }
        }
    }

    if (creep.carry[RESOURCE_ENERGY] === 0) {
        creep.memory.state = RoleHarvesterState.WAITING;
    }
}

function processSupplyingExtension(creep: Creep) {
    creep.memory.state = RoleHarvesterState.WAITING;
}

function processWaiting(creep: Creep) {
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
