'use strict';

import { readFile, writeFile, rename } from 'fs/promises';
import { SimpleStream } from '../';
async function sleep(ms: number): Promise<any> {
    return new Promise(res => setTimeout(res, ms));

}

describe('types/common', () => {
    test("SimpleStream", async () => {
        let ended2 = false;
        const stream = new SimpleStream<number>(async () => { ended2 = true; });
        const item: number[] = [];

        let ended = false;

        stream.data((x: number) => { item.push(x) });
        stream.on("end", () => { ended = true });

        stream.push(2);
        expect(item).toStrictEqual([2]);
        expect(stream.lastElement).toEqual(2);
        stream.on("data", async (x) => { await sleep(300); item.push(x); });
        stream.push(4);
        expect(item).toStrictEqual([2, 4]);
        expect(stream.lastElement).toEqual(4);
        await sleep(320);
        expect(item).toStrictEqual([2, 4, 4]);

        stream.end();
        expect(ended).toEqual(true);
        stream.disconnect();
        expect(ended2).toEqual(true);
    })
})

