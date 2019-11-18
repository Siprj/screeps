
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

function getBuilderMemory(creep: Creep): BuilderMemory
{
    return creep.memory.roleMemory as BuilderMemory;
}

export function spawnBuilder(spawn: StructureSpawn, source: Source)
{
    const body = getHarvesterBodyParts(spawn.room.energyAvailable);
    const creepId = spawn.memory.spawnCount++;

    spawn.spawnCreep(body, "bu" + creepId, {memory: createBuilderMemory(source.id)});
}

function createBuilderMemory(sourceId: string): CreepMemory
{
    return {
          role: "builder"
        , roleMemory:
            { sourceId
            , targetId: ""
            , working: false
            }
        };
}

function getHarvesterBodyParts(availableEnergy: number): BodyPartConstant[]
{

    const harvesterBase: BodyPartConstant[] = [MOVE, MOVE, WORK, CARRY, CARRY];
    const harvesterBasePrice: number = 300;
    const n = _.floor(availableEnergy / harvesterBasePrice);

    const body: BodyPartConstant[] = _.flatten(_.times(n, _.constant(harvesterBase)));
    let remainingEnergy = availableEnergy - (harvesterBasePrice * n);

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

function getDemagedStructures(creep: Creep): Structure[]
{
    const demagedStructures = _.filter(creep.room.find(FIND_STRUCTURES)
        , (structure: Structure) => {
            return structure.hits < structure.hitsMax;
        });
    demagedStructures.sort((a, b) => a.hits - b.hits);
    return demagedStructures;
}

export function runBuilder(creep: Creep)
{
    const builderMemory = getBuilderMemory(creep);

    if (builderMemory.working)
    {
        if (creep.carry.energy === 0)
        {
            builderMemory.working = false;
        }
    }
    else
    {
        if (creep.carry.energy === creep.carryCapacity)
        {
            builderMemory.working = true;
        }
    }

    if (builderMemory.working)
    {
        const demagedStructures = getDemagedStructures(creep);
        if (demagedStructures.length > 0)
        {
            if (creep.repair(demagedStructures[0]) === ERR_NOT_IN_RANGE)
            {
                creep.moveTo(demagedStructures[0]);
            }

        }
        else
        {
            const constructionSites: ConstructionSite[] = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (constructionSites.length > 0)
            {
                if (creep.build(constructionSites[0]) === ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(constructionSites[0]);
                }
            }
        }
    }
    else
    {
        const source = Game.getObjectById<Source>(builderMemory.sourceId);

        if (source == null)
        {
            console.log("ERROR can't find deisgnated source for creep: " + creep.name);
            return;
        }

        if (source.energy === 0 && creep.carry.energy === 0)
        {
            builderMemory.working = true;
        }

        if (creep.harvest(source) !== OK)
        {
            creep.moveTo(source);
        }
    }
}
