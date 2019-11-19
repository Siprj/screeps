import { spawnBuilder, spawnHarvester, spawnUpgrader } from "creeps";

function initMemoryBySource
    ( sources: Source[]
    , memoryObj: { [spawnName: string]: number }
    , defaultValue: number)
{
    for (const source of sources)
    {
        if (!memoryObj[source.id])
        {
            memoryObj[source.id] = defaultValue;
        }
    }
}

function initCreepCount(memory: RoomMemory)
{
    if (!memory.harvesterCount)
    {
        memory.harvesterCount = 3;
    }
    if (!memory.builderCount)
    {
        memory.builderCount = 3;
    }
    if (!memory.upgraderCount)
    {
        memory.upgraderCount = 3;
    }
}

function sourceSortScore(source: Source, roomMemory: RoomMemory): number
{
    return (1 / roomMemory.sourceCreepRatio[source.id])
        * roomMemory.sourceCreepCount[source.id];
}

function getPreferedSource(roomMemory: RoomMemory, sources: Source[]): Source
{
    sources.sort((a: Source, b: Source) =>
        sourceSortScore(a, roomMemory) - sourceSortScore(b, roomMemory));
    return sources[0];
}

function recomputeSourceCountMemory(
    creeps: Creep[],
    sourceCreepCount: {[sourceId: string]: number})
{
    for (const sourceId in sourceCreepCount)
    {
        sourceCreepCount[sourceId] = 0;
    }

    for (const creep of creeps)
    {
        sourceCreepCount[creep.memory.roleMemory.sourceId]++;
    }
}

export function spawnIfNeeded(room: Room)
{
    const roomSpawns = room.find(FIND_MY_SPAWNS);
    const roomCreeps = room.find(FIND_MY_CREEPS);
    const harvesterCount = _.filter(roomCreeps,
        (creep: Creep) => creep.memory.role === "harvester").length;

    const upgraderCount = _.filter(roomCreeps,
        (creep: Creep) => creep.memory.role === "upgrader").length;

    const builderCount = _.filter(roomCreeps,
        (creep: Creep) => creep.memory.role === "builder").length;

    console.log("harvesterCount: " + harvesterCount);
    console.log("upgraderCount: " + upgraderCount);
    console.log("builderCount: " + builderCount);
    const energyDeficit = room.energyCapacityAvailable - room.energyAvailable;

    const spawn = roomSpawns[0];
    if (harvesterCount === 0 && spawn.spawning === null)
    {
        // Get emergency harvester...
        const sources: Source[] = room.find(FIND_SOURCES);
        spawnHarvester(spawn, sources[0]);
        return;
    }
    // if (Game.time % 50 === 0 && roomSpawns.length > 0)
    if (roomSpawns.length > 0 && energyDeficit === 0)
    {
        const sources: Source[] = room.find(FIND_SOURCES);
        initCreepCount(room.memory);
        if (!room.memory.sourceCreepCount)
        {
            room.memory.sourceCreepCount = {};
            initMemoryBySource(sources, room.memory.sourceCreepCount, 0);
        }
        if (!room.memory.sourceCreepRatio)
        {
            room.memory.sourceCreepRatio = {};
            initMemoryBySource(sources, room.memory.sourceCreepRatio, 1);
        }

        recomputeSourceCountMemory(roomCreeps, room.memory.sourceCreepCount);

        if (harvesterCount < room.memory.harvesterCount && spawn.spawning === null)
        {
            console.log("spawning harvester");
            const source = getPreferedSource(room.memory, sources);
            spawnHarvester(spawn, source);
            room.memory.sourceCreepCount[source.id]++;
        }
        else if (upgraderCount < room.memory.upgraderCount && spawn.spawning === null)
        {
            console.log("spawning upgrader");
            const source = getPreferedSource(room.memory, sources);
            spawnUpgrader(spawn, source);
            room.memory.sourceCreepCount[source.id]++;
        }
        else if (builderCount < room.memory.builderCount && spawn.spawning === null)
        {
            console.log("spawning builder");
            const source = getPreferedSource(room.memory, sources);
            spawnBuilder(spawn, source);
            room.memory.sourceCreepCount[source.id]++;
        }
    }
}
