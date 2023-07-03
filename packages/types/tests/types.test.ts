import { describe, test, expect } from "@jest/globals";
import { SimpleStream } from "..";

async function sleep(ms: number): Promise<unknown> {
    return new Promise(res => setTimeout(res, ms));
}

describe("types/common", () => {
    test("SimpleStream", async () => {
        let ended2 = false;
        const stream = new SimpleStream<number>(async () => {
            ended2 = true;
        });
        const item: number[] = [];

        let ended = false;

        stream.data((x: number) => {
            item.push(x);
        });
        stream.on("end", () => {
            ended = true;
        });

        stream.push(2).catch(error => {
            throw error;
        });
        
        expect(item).toStrictEqual([2]);
        expect(stream.lastElement).toEqual(2);

        stream.on("data", async x => {
            await sleep(300);
            item.push(x);
        });
        stream.push(4).catch(error => {
            throw error;
        });

        expect(item).toStrictEqual([2, 4]);
        expect(stream.lastElement).toEqual(4);
        await sleep(320);
        expect(item).toStrictEqual([2, 4, 4]);

        await stream.end().catch(error => {
            throw error;
        });
        
        expect(ended).toEqual(true);
        stream.disconnect().catch(error => {
            throw error;
        });
        expect(ended2).toEqual(true);
    });
});

