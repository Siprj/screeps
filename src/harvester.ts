namespace Harvester {

    export const enum RoleHarvesterState {
        WAITING = 0,
        SUPPLYING_SPAWN,
        MOVING_TO_SPAWN,
        SUPPLYING_EXTENSION,
        HARVESTING
    };

    function processHarvesting(creep: Creep) {
        creep.memory.state = RoleHarvesterState.WAITING;
        console.log("Processing Harvesting");
        let sources = creep.room.find(FIND_SOURCES);
        creep.memory.pokus = sources[0];
        if (creep.harvest(creep.memory.pokus) === ERR_NOT_IN_RANGE) {
            // TODO: Moving should have it"s own state
            creep.moveTo(creep.memory.pokus);
            return;
        }

        // TODO: Decide where to go (spawn/extension)
        if (creep.carry.energy >= creep.carryCapacity) {
            let targets = creep.room.find<Structure>(FIND_STRUCTURES, {
                filter: (structure: Structure) => {
                    return (structure.structureType === STRUCTURE_SPAWN);
                }
            });
            creep.memory.path = creep.pos.findPathTo(targets[0].pos);
            creep.memory.targetPos = targets[0].pos;
            creep.memory.state = RoleHarvesterState.MOVING_TO_SPAWN;
        }
    }

    function processMowingToSpawn(creep: Creep) {
        console.log("Processing MovingToSPawn");
        console.log("Path length: " + creep.memory.path);
        let res = creep.moveByPath(creep.memory.path);
        console.log("Res: " + res);
        console.log("Pokus pos: " + creep.pos);
        console.log("Pokus targetPos: " + creep.memory.targetPos.x);
        let pos = creep.memory.targetPos;
        console.log("Pokus: " + creep.pos.isNearTo(pos.x, pos.y));
        if (creep.pos.isNearTo(pos.x, pos.y)) {
            creep.memory.state = RoleHarvesterState.SUPPLYING_SPAWN;
        }
        else
        {
            switch (res) {
                case OK:
                    // code
                    break;
                case ERR_NOT_OWNER:
                    // code
                    break;
                case ERR_BUSY:
                    // code
                    break;
                case ERR_NOT_FOUND:
                    creep.memory.path = creep.pos.findPathTo(pos.x, pos.y);
                    break;
                case ERR_INVALID_ARGS:
                    // code
                    break;
                case ERR_TIRED:
                    // code
                    break;
                case ERR_NO_BODYPART:
                    // code
                    break;

                default:
                // code
            }
        }
    }

    function processSupplyingSpawn(creep: Creep) {
        console.log("Processing SupplyingSpawn");
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
        console.log("Processing SupplyingExtensio");
        creep.memory.state = RoleHarvesterState.WAITING;
    }

    function processWaiting(creep: Creep) {
        console.log("Processing Waiting!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.log("Processing Waiting");
        console.log("creep.room.energyAvailable: " + creep.room.energyAvailable);
        console.log("creep.room.energyCapacityAvailable: " + creep.room.energyCapacityAvailable);
        if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
            console.log("Make creep harvest");
            console.log("Creep state befor change: " + creep.memory.state);
            let sources = creep.room.find(FIND_SOURCES);
            creep.memory.pokus = sources[0];
            console.log("Creep pokus set to source: " + creep.memory.pokus);
            creep.memory.state = RoleHarvesterState.HARVESTING;
            console.log("Creep state after change: " + creep.memory.state);
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
                processHarvesting(creep);
                break;

            case RoleHarvesterState.MOVING_TO_SPAWN:
                processMowingToSpawn(creep);
                break;

            default:
                processWaiting(creep);
                break;
        }
    }

} // End Harvesert module
