
function createUpgraderMemory(sourceId: string): CreepMemory
{
    return {
          role: "upgrader"
        , roleMemory: {
              sourceId
            , working: false
            }
        };
}

function getUpgraderMemory(creep: Creep): UpgraderMemory
{
    return creep.memory.roleMemory as UpgraderMemory;
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

export function spawnUpgrader(spawn: StructureSpawn, source: Source)
{
    const body = getHarvesterBodyParts(spawn.room.energyAvailable);
    const creepId = spawn.memory.spawnCount++;

    spawn.spawnCreep(body, "up" + creepId, {memory: createUpgraderMemory(source.id)});
}

export function runUpgrader(creep: Creep)
{
    const upgraderMemory = getUpgraderMemory(creep);
    if (upgraderMemory.working)
    {
        if (creep.carry.energy === 0)
        {
            upgraderMemory.working = false;
        }
    }
    else
    {
        if (creep.carry.energy === creep.carryCapacity)
        {
            upgraderMemory.working = true;
        }
    }

    if (upgraderMemory.working)
    {
        if (creep.room.controller == null)
        {
            console.log("ERROR: No controller was found!!!");
            return;
        }
        if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE)
        {
            creep.moveTo(creep.room.controller);
        }
    }
    else
    {
        const source = Game.getObjectById<Source>(upgraderMemory.sourceId);

        if (source == null)
        {
            console.log("ERROR can't find deisgnated source for creep: " + creep.name);
            return;
        }

        if (source.energy === 0 && creep.carry.energy === 0)
        {
            upgraderMemory.working = true;
        }

        if (creep.harvest(source) !== OK)
        {
            creep.moveTo(source);
        }
    }
}
