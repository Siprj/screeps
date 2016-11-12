import {arePositionsEqual} from "../utils";

const PATH_RECALC_TIME = 10;

function recalculatePath(creep: Creep, target: RoomPosition)
{
    creep.memory.path = creep.pos.findPathTo(target);
}

/**
 * Move creap to it's destination and stops in range.
 * Some hiden (in creap local memory) parameters:
 * * Target is given by internal creep memory creep.memory.targetPos
 * * Precalculated path is store in creep.memory.path
 * * Previous creap position is stored in creep.memory.path
 * * Tick when the path will be recalculated, sometimes the creeps go in to
 *   darknes :D. This tick is stored in creep.memory.pathTick
 *
 * @param creep Creep creep which should move.
 * @param range number how close to the target the creep needs to get.
 * @returns true if is is at it's destinatio, false if not.
 */
export function moveToTargetInRangeOf(creep: Creep, range: number): boolean
{
    console.log(creep.name + "moveToTargetInRangeOf");
    // console.log(creep.name + "Processing MowingToSource");
    // console.log("Path: " + creep.memory.path);
    // console.log("Res: " + res);
    // console.log("Pokus pos: " + creep.pos);
    // console.log("Pokus targetPos: " + creep.memory.targetPos.x);

    let targetPos = creep.memory.targetPos;
    // console.log("Pokus: " + creep.pos.isNearTo(targetPos.x, targetPos.y));

    // Object in memory are type of Object and there is no easy way how to
    // convert them back to original form/type. So there is small "shortcut" to
    // creating the RoomPosition object ;).
    let targetRoomPos = new RoomPosition(targetPos.x, targetPos.y, targetPos.roomName);
    if (creep.pos.inRangeTo(targetRoomPos, range)) {
        return true;
    }
    else
    {
        if (creep.memory.pathTick)
        {
            creep.memory.pathTick--;

            // There is need to check previous creep position and current creep
            // position to prevent blocking the creap by another creep before him...
            // Because the function moveByPath() is not checking if folowint path is
            // blocked by another standing creap.
            if (creep.memory.previousPosition)
            {
                // Sometimes it may happend that the creep walks of from current
                // room and if that happens we need to relalculate the path
                // because the previous path was sopose to led to room exit.
                if(creep.memory.previousPosition.roomName !== creep.pos.roomName)
                {
                    recalculatePath(creep, targetRoomPos);
                }
                else
                {
                    let prevPos = <RoomPosition> creep.memory.previousPosition;
                    if (arePositionsEqual(prevPos, creep.pos))
                    {
                        console.log(creep.name + "recalculating the route");
                        recalculatePath(creep, targetRoomPos);
                    }
                }
            }
        }
        else
        {
            recalculatePath(creep, targetRoomPos);
            creep.memory.pathTick = PATH_RECALC_TIME;
        }

        // Store current path for future movement checks.
        // Check if it is possible to move or the room exit was crossed.
        creep.memory.previousPosition = creep.pos;

        // Perfor the move it self.
        let res = creep.moveByPath(creep.memory.path);
        switch (res) {
            case OK:
                break;
            case ERR_NOT_OWNER:
                // TODO: This is critical error ...
                console.log("Critical ERROR: " + creep.name
                    + " moveToTargetInRangeOf: ERR_NOT_OWNER");
                break;
            case ERR_BUSY:
                // Creap is still being spowned....
                break;
            case ERR_NOT_FOUND:
                recalculatePath(creep, targetRoomPos);
                console.log(creep.name + " moveToTargetInRangeOf: ERR_NOT_FOUND");
                break;
            case ERR_INVALID_ARGS:
                // TODO: This is critical error maybe I shoud send some
                // notification.
                console.log("Critical ERROR: " + creep.name
                    + " moveToTargetInRangeOf: ERR_INVALID_ARGS");
                break;
            case ERR_TIRED:
                // TODO: This error code may be usefull in future. For example:
                //  * I want renge create to fite if it can't move...
                break;
            case ERR_NO_BODYPART:
                // TODO: This is similar to previous error code.
                break;

            default:
                // TODO: Critical error notification should be send.
                console.log("Critical ERROR: " + creep.name
                    + " moveToTargetInRangeOf: default");
        }
    }
    return false;
}
