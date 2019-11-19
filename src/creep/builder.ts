
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
        const demagedStructure = getDemagedStructure(creep);
        if (demagedStructure)
        {
            if (creep.repair(demagedStructure) === ERR_NOT_IN_RANGE)
            {
                creep.moveTo(demagedStructure);
            }

        }
        else
        {
            const constructionSite: (ConstructionSite | null) =
                creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);

            if (constructionSite)
            {
                if (creep.build(constructionSite) === ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(constructionSite);
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
