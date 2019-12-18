import { spawnWorker } from "creeps";

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
    if (!memory.workerCount)
    {
        memory.workerCount = 10;
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
    const workerCount = _.filter(roomCreeps,
        (creep: Creep) => creep.memory.role === CreepRole.Worker).length;

    console.log("workerCount: " + workerCount);
    const energyDeficit = room.energyCapacityAvailable - room.energyAvailable;

    const spawn = roomSpawns[0];
    if (workerCount === 0 && spawn.spawning === null)
    {
        console.log("Spawing emergency creep!");
        // Get emergency harvester...
        const sources: Source[] = room.find(FIND_SOURCES);
        const source = getPreferedSource(room.memory, sources);
        spawnWorker(spawn, source);
        room.memory.sourceCreepCount[source.id]++;
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

        if (workerCount < room.memory.workerCount && spawn.spawning === null)
        {
            console.log("spawning harvester");
            const source = getPreferedSource(room.memory, sources);
            spawnWorker(spawn, source);
            room.memory.sourceCreepCount[source.id]++;
        }
    }
}
