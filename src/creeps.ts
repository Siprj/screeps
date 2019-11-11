
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

export function spawHarvester(spawn: StructureSpawn)
{
    const body = getHarvesterBodyParts(spawn.room.energyAvailable);
    let creepId = spawn.memory.spawnCount++;

    const source: Source[] = spawn.room.find<FIND_SOURCES>(FIND_SOURCES);
    spawn.spawnCreep(body, "hv" + creepId, {memory: createHarvesterMemory(source[0].id)});
}

export function spawUpgrader(spawn: StructureSpawn)
{
    const body = getHarvesterBodyParts(spawn.room.energyAvailable);
    let creepId = spawn.memory.spawnCount++;

    const source: Source[] = spawn.room.find<FIND_SOURCES>(FIND_SOURCES);
    spawn.spawnCreep(body, "up" + creepId, {memory: createUpgraderMemory(source[0].id)});
}

export function spawBuilder(spawn: StructureSpawn)
{
    const body = getHarvesterBodyParts(spawn.room.energyAvailable);
    let creepId = spawn.memory.spawnCount++;

    const source: Source[] = spawn.room.find<FIND_SOURCES>(FIND_SOURCES);
    spawn.spawnCreep(body, "bu" + creepId, {memory: createBuilderMemory(source[0].id)});
}

function createHarvesterMemory(sourceId: string): CreepMemory
{
    return {
          role: "harvester"
        , working: false
        , designatedSource : sourceId
        };
}

function createUpgraderMemory(sourceId: string): CreepMemory
{
    return {
          role: "upgrader"
        , working: false
        , designatedSource : sourceId
        };
}

function createBuilderMemory(sourceId: string): CreepMemory
{
    return {
          role: "builder"
        , working: false
        , designatedSource : sourceId
        };
}

export function getHarvesterBodyParts(availableEnergy: number): BodyPartConstant[]
{

    const harvesterBase: BodyPartConstant[] = [MOVE, MOVE, WORK, CARRY, CARRY];
    const harvesterBasePrice: number = 300;
    const n = _.floor(availableEnergy/harvesterBasePrice);


    let body: BodyPartConstant[] = _.flatten(_.times(n, _.constant(harvesterBase)));
    let remainingEnergy = availableEnergy - (harvesterBasePrice * n)

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

function runHarvester(creep:Creep)
{
    if (creep.memory.working)
    {
        if (creep.carry.energy == 0)
            creep.memory.working = false;
    }
    else
    {
        if (creep.carry.energy == creep.carryCapacity)
            creep.memory.working = true;
    }

    if (creep.memory.working)
    {
        let filterFunc = (structure: StructureSpawn | StructureExtension) : boolean =>
            {
                return (structure.structureType == STRUCTURE_EXTENSION 
                    || structure.structureType == STRUCTURE_SPAWN) 
                        && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        let spawnerAndExtensions = creep.room.find(FIND_STRUCTURES, {filter: filterFunc});
        if (spawnerAndExtensions.length == 0)
        {
            // TODO: Maybe move the creep somewhere
            //  or do some upgrading...
            return;
        }
        if (creep.transfer(spawnerAndExtensions[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
        {
            creep.moveTo(spawnerAndExtensions[0]);
        }
    }
    else
    {
        let source = Game.getObjectById<Source>(creep.memory.designatedSource);

        if (source == null)
        {
            console.log("ERROR can't find deisgnated source for creep: " + creep.name);
            return;
        }

        if (source.energy == 0 && creep.carry.energy == 0)
            creep.memory.working = true;

        if (creep.harvest(source) != OK)
            creep.moveTo(source);
    }
}

function runUpgrader(creep:Creep)
{
    if (creep.memory.working)
    {
        if (creep.carry.energy == 0)
            creep.memory.working = false;
    }
    else
    {
        if (creep.carry.energy == creep.carryCapacity)
            creep.memory.working = true;
    }

    if (creep.memory.working)
    {
        if (creep.room.controller == null)
        {
            console.log("ERROR: No controller was found!!!");
            return;
        }
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE)
        {
            creep.moveTo(creep.room.controller);
        }
    }
    else
    {
        let source = Game.getObjectById<Source>(creep.memory.designatedSource);

        if (source == null)
        {
            console.log("ERROR can't find deisgnated source for creep: " + creep.name);
            return;
        }

        if (source.energy == 0 && creep.carry.energy == 0)
            creep.memory.working = true;

        if (creep.harvest(source) != OK)
            creep.moveTo(source);
    }
}

function runBuilder(creep:Creep)
{
    if (creep.memory.working)
    {
        if (creep.carry.energy == 0)
            creep.memory.working = false;
    }
    else
    {
        if (creep.carry.energy == creep.carryCapacity)
            creep.memory.working = true;
    }

    if (creep.memory.working)
    {
        const constructionSites: ConstructionSite[] = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length > 0)
        {
            if (creep.build(constructionSites[0]) == ERR_NOT_IN_RANGE)
                creep.moveTo(constructionSites[0]);
        }
    }
    else
    {
        let source = Game.getObjectById<Source>(creep.memory.designatedSource);

        if (source == null)
        {
            console.log("ERROR can't find deisgnated source for creep: " + creep.name);
            return;
        }

        if (source.energy == 0 && creep.carry.energy == 0)
            creep.memory.working = true;

        if (creep.harvest(source) != OK)
            creep.moveTo(source);
    }
}

const creepRoles:{ [creepName: string]: (creep: Creep) => void } = {
    "harvester": runHarvester,
    "upgrader": runUpgrader,
    "builder": runBuilder
}

export function runRole(creep: Creep)
{
    let f = creepRoles[creep.memory.role];
    if (f == null)
    {
        console.log("ERROR role: " + creep.memory.role + " is unknowen!!!")
        return;
    }

    f(creep);
}

