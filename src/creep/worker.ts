

function createWorkerMemory(source: Source): CreepMemory
{
    return {
          role: CreepRole.Worker
        , roleMemory: {
            sourceId: source.id,
            state: WorkerState.Moving,
            targetId: "",
            targetPos: source.pos,
            targetPosDistance: 1,
            nextState: WorkerState.Mining
            }
        };
}

function addBodyPartIfPossible
    ( availableEnergy: number
    , bodyPart: BodyPartConstant
    , body: BodyPartConstant[]
    ) : number
{
    const bodyPartCost = BODYPART_COST[bodyPart];
    if (bodyPartCost <= availableEnergy)
    {
        body.push(bodyPart);
        return availableEnergy - bodyPartCost;
    }
    return availableEnergy;
}

function getWorkerMemory(creep: Creep): WorkerMemory
{
    return creep.memory.roleMemory as WorkerMemory;
}

function getWorkerBodyParts(availableEnergy: number): BodyPartConstant[]
{

    const workerBase: BodyPartConstant[] = [MOVE, MOVE, WORK, CARRY, CARRY];
    const workerBasePrice: number = 300;
    const n = _.floor(availableEnergy / workerBasePrice);

    const body: BodyPartConstant[] = _.flatten(_.times(n, _.constant(workerBase)));
    let remainingEnergy = availableEnergy - (workerBasePrice * n);

    while (remainingEnergy > 0)
    {
        if (remainingEnergy >= 200)
        {
            remainingEnergy = addBodyPartIfPossible(remainingEnergy, WORK, body);
            remainingEnergy = addBodyPartIfPossible(remainingEnergy, MOVE, body);
            remainingEnergy = addBodyPartIfPossible(remainingEnergy, CARRY, body);
        }
        else
        {
            remainingEnergy = addBodyPartIfPossible(remainingEnergy, MOVE, body);
            remainingEnergy = addBodyPartIfPossible(remainingEnergy, CARRY, body);
        }
    }

    return body;
}

export function spawnWorker(spawn: StructureSpawn, source: Source)
{
    const body = getWorkerBodyParts(spawn.room.energyAvailable);
    const creepId = spawn.memory.spawnCount++;

    spawn.spawnCreep(body, "w" + creepId, {memory: createWorkerMemory(source)});
}

function goGetEnergy(creep: Creep, workerMemory: WorkerMemory)
{
    const source = Game.getObjectById<Source>(workerMemory.sourceId);
    if (source)
    {
        workerMemory.targetPos = source.pos;
        workerMemory.targetPosDistance = 1;
        workerMemory.state = WorkerState.Moving;
        workerMemory.nextState = WorkerState.Mining;
        move(creep, workerMemory);
    }
    else
    {
        console.log("ERROR: Source somehow disappeared! Panic!!!!");
    }
}

function filMoveTo
    ( workerMemory: WorkerMemory
    , target: Structure | ConstructionSite
    , nextState: WorkerState
    , distance: number)
{
    workerMemory.nextState = nextState;
    workerMemory.state = WorkerState.Moving;
    workerMemory.targetPos = target.pos;
    workerMemory.targetId = target.id;
    workerMemory.targetPosDistance = distance;
}

function upgradeController(creep: Creep, workerMemory: WorkerMemory, always: boolean): boolean
{
    // Safety feature in case to much activities (building repairing).
    if (creep.room.controller)
    {
        if (creep.room.controller.ticksToDowngrade < 5000 || always)
        {
            filMoveTo(workerMemory, creep.room.controller, WorkerState.Upgrading, 3);
            return true;
        }
    }
    else
    {
        console.log("decideWhatToDoNext: ERROR: we don't have controller!!!");
    }
    return false;
}

function spawnAndExtensions(creep: Creep, workerMemory: WorkerMemory): boolean
{
    type StorageStructures = StructureSpawn | StructureExtension;
    const filterFunc = (structure: StorageStructures) : boolean =>
        {
            return (structure.structureType === STRUCTURE_EXTENSION
                || structure.structureType === STRUCTURE_SPAWN)
                    && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        };
    const spawnerAndExtensions =
        creep.pos.findClosestByRange<StorageStructures>(FIND_MY_STRUCTURES, {filter: filterFunc});
    if (spawnerAndExtensions)
    {
        filMoveTo(workerMemory, spawnerAndExtensions, WorkerState.Filling, 1);
        return true;
    }

    const filterFuncT = (structure: StructureTower) : boolean =>
        {
            return (structure.structureType === STRUCTURE_TOWER)
                    && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        };
    const towers =
        creep.pos.findClosestByRange<StorageStructures>(FIND_MY_STRUCTURES, {filter: filterFuncT});
    if (towers)
    {
        filMoveTo(workerMemory, towers, WorkerState.Filling, 1);
        return true;
    }

    return false;
}

function getDemagedStructure(creep: Creep): Structure | null
{
    // TODO: this here.. is not exactly effective...
    const constructionSites: ConstructionSite[] = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
    const filterF = (structure: Structure): boolean =>
    {
        if (constructionSites.length === 0)
        {
            return structure.hits < structure.hitsMax;
        }
        else
        {
            return structure.structureType === STRUCTURE_RAMPART
                ? (structure.hits < 10000)
                : structure.hits < structure.hitsMax;
        }
    };
    return creep.pos.findClosestByRange(FIND_STRUCTURES, { filter: filterF });
}

function repairStructures(creep: Creep, workerMemory: WorkerMemory): boolean
{
    const demagedStructure = getDemagedStructure(creep);

    if (demagedStructure)
    {
        filMoveTo(workerMemory, demagedStructure, WorkerState.Repairing, 3);
        return true;
    }

    return false;
}

function buildStructures(creep: Creep, workerMemory: WorkerMemory): boolean
{
    const constructionSite: (ConstructionSite | null) =
        creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);

    if (constructionSite)
    {
        filMoveTo(workerMemory, constructionSite, WorkerState.Building, 3);
        return true;
    }
    return false;
}

function decideWhatToDoNext(creep: Creep, workerMemory: WorkerMemory)
{
    if (upgradeController(creep, workerMemory, false))
    {
        return;
    }
    if (spawnAndExtensions(creep, workerMemory))
    {
        return;
    }
    if (repairStructures(creep, workerMemory))
    {
        return;
    }
    if (buildStructures(creep, workerMemory))
    {
        return;
    }
    if (upgradeController(creep, workerMemory, true))
    {
        return;
    }
}

function mine(creep: Creep, workerMemory: WorkerMemory)
{
    if (creep.carry.getFreeCapacity() > 0)
    {
        const source = Game.getObjectById<Source>(workerMemory.sourceId);
        if (source)
        {
            creep.harvest(source);
        }
        else
        {
            console.log("mining: cant retrieve source by it's id!");
        }
    }
    else
    {
        decideWhatToDoNext(creep, workerMemory);
    }
}

function upgrade(creep: Creep, workerMemory: WorkerMemory)
{
    if (creep.carry.getUsedCapacity(RESOURCE_ENERGY) > 0)
    {
        if (creep.room.controller)
        {
            creep.upgradeController(creep.room.controller);
        }
        else
        {
            console.log("upgrade: No upgredable controller in the room!");
            decideWhatToDoNext(creep, workerMemory);
        }
    }
    else
    {
        goGetEnergy(creep, workerMemory);
    }
}

function build(creep: Creep, workerMemory: WorkerMemory)
{
    if (creep.carry.getUsedCapacity(RESOURCE_ENERGY) > 0)
    {
        const constructionSite = Game.getObjectById<ConstructionSite>(workerMemory.targetId);
        if (constructionSite)
        {
            if (constructionSite.progressTotal - constructionSite.progress)
            {
                creep.build(constructionSite);
            }
            else
            {
                decideWhatToDoNext(creep, workerMemory);
            }
        }
        else
        {
            decideWhatToDoNext(creep, workerMemory);
        }
    }
    else
    {
        goGetEnergy(creep, workerMemory);
    }
}

function repair(creep: Creep, workerMemory: WorkerMemory)
{
    if (creep.carry.getUsedCapacity(RESOURCE_ENERGY) > 0)
    {
        const structure = Game.getObjectById<Structure>(workerMemory.targetId);
        if (structure)
        {
            if (structure.hitsMax - structure.hits)
            {
                creep.repair(structure);
            }
            else
            {
                decideWhatToDoNext(creep, workerMemory);
            }
        }
        else
        {
            console.log("repair: targetId is invalid!");
            decideWhatToDoNext(creep, workerMemory);
        }
    }
    else
    {
        goGetEnergy(creep, workerMemory);
    }
}

function move(creep: Creep, workerMemory: WorkerMemory)
{
    const pos = new RoomPosition
        ( workerMemory.targetPos.x
        , workerMemory.targetPos.y
        , workerMemory.targetPos.roomName);

    if (!creep.pos.inRangeTo(pos, workerMemory.targetPosDistance))
    {
        creep.moveTo(pos);
    }
    else
    {
        workerMemory.state = workerMemory.nextState;
        runWorkerF(creep, workerMemory);
    }
}

function pickUp(creep: Creep, workerMemory: WorkerMemory)
{
    console.log("PickingUp");
    // TODO: function body :D
    goGetEnergy(creep, workerMemory);
}

function fill(creep: Creep, workerMemory: WorkerMemory)
{
    const structure = Game.getObjectById<
        StructureExtension
        | StructureStorage
        | StructureSpawn>(workerMemory.targetId);
    if (structure)
    {
        for(const resourceType in creep.carry)
        {
            creep.transfer(structure, resourceType as ResourceConstant);
        }

        if (creep.carry.getUsedCapacity() - structure.store.getFreeCapacity() > 0)
        {
            decideWhatToDoNext(creep, workerMemory);
        }
        else
        {
            goGetEnergy(creep, workerMemory);
        }
    }
    else
    {
        console.log("fill: ERROR: can't fill target with this ID!!!");
    }
    goGetEnergy(creep, workerMemory);
}

function runWorkerF(creep: Creep, workerMemory: WorkerMemory)
{
    switch (workerMemory.state)
    {
        case WorkerState.Mining:
            mine(creep, workerMemory);
            break;
        case WorkerState.Moving:
            move(creep, workerMemory);
            break;
        case WorkerState.Building:
            build(creep, workerMemory);
            break;
        case WorkerState.Repairing:
            repair(creep, workerMemory);
            break;
        case WorkerState.Upgrading:
            upgrade(creep, workerMemory);
            break;
        case WorkerState.PickingUp:
            pickUp(creep, workerMemory);
            break;
        case WorkerState.Filling:
            fill(creep, workerMemory);
            break;
        default:
            console.log("runWorkerF: unknown state reached: " + workerMemory.state);
            // TODO: send email about unknown state reached
            break;
    }
}

export function runWorker(creep: Creep)
{
    const workerMemory = getWorkerMemory(creep);
    runWorkerF(creep, workerMemory);
}
