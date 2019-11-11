// Code taken from http://stackoverflow.com/a/19287714/7119146

import {Point} from "./point";

export function siralAroundPoint (n: number, spawnPos: Point): Point
{
    let pos = spiral((n * 2) + 1);
    pos.x += spawnPos.x;
    pos.y += spawnPos.y;
    return pos;
}

export function spiral(n: number): Point
{
    // given n an index in the squared spiral
    // p the sum of point in inner square
    // a the position on the current square
    // n = p + a

    let r = Math.floor((Math.sqrt(n + 1) - 1) / 2) + 1;

    // compute radius : inverse arithmetic sum of 8+16+24+...=
    let p = (8 * r * (r - 1)) / 2;
    // compute total point on radius -1 : arithmetic sum of 8+16+24+...

    let en = r * 2;
    // points by face

    let a = (1 + n - p) % (r * 8);
    // compute de position and shift it so the first is (-r,-r) but (-r+1,-r)
    // so square can connect

    let pos = new Point();
    switch (Math.floor(a / (r * 2)))
    {
        // find the face : 0 top, 1 right, 2, bottom, 3 left
        case 0:
            {
                pos.x = a - r;
                pos.y = -r;
            }
            break;
        case 1:
            {
                pos.x = r;
                pos.y = (a % en) - r;

            }
            break;
        case 2:
            {
                pos.x = r - (a % en);
                pos.y = r;
            }
            break;
        case 3:
            {
                pos.x = -r;
                pos.y = r - (a % en);
            }
            break;
        default:
          break;
    }
    return pos;
}

