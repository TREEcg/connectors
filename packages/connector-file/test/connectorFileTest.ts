'use strict';

import { readFile, writeFile, rename } from 'fs/promises';
import { FileStreamReaderFactory} from '../';
import { FileStreamWriterFactory } from '../lib/StreamWriter';
async function sleep(ms: number): Promise<any> {
    return new Promise(res => setTimeout(res, ms));

}

describe('connector-file', () => {
    test("reader", async () => {
        const factory = new FileStreamReaderFactory();
        const stream = await factory.build({path: "test.txt", onReplace: true, readFirstContent: false, encoding: "utf-8" }, x => <string>x);
        
        const elements: string[] = [];

        stream.data(x =>{ elements.push(x)});
        expect(stream.lastElement).not.toBeDefined();


        await writeFile("test.txt", "something", {encoding: "utf8"});
        await sleep(300);

        expect(stream.lastElement).toBeDefined();
        expect(stream.lastElement).toBe("something");
        expect(elements).toStrictEqual(["something"]);


        await writeFile("test.txt", "somethingelse", {encoding: "utf8"});
        await sleep(300);
        expect(stream.lastElement).toBeDefined();
        expect(stream.lastElement).toBe("somethingelse");
        expect(elements).toStrictEqual(["something", "somethingelse"]);

        await rename("test.txt", "test2.txt");
        await writeFile("test2.txt", "43", {encoding: "utf8"});
        await rename("test2.txt", "test.txt");
        await sleep(300);
        expect(elements).toStrictEqual(["something", "somethingelse", "43"]);


        await writeFile("test.txt", "foobar", {encoding: "utf8"});
        await sleep(200);
        expect(stream.lastElement).toBeDefined();
        expect(stream.lastElement).toBe("foobar");
        expect(elements).toStrictEqual(["something", "somethingelse", "43", "foobar"]);

        await stream.disconnect();
    })

    test("writer", async () => {
        const factory = new FileStreamWriterFactory();
        const writer = await factory.build({path: "test.txt", onReplace: true, readFirstContent: false, encoding: "utf-8" }, x => <string>x);

        let content = "";

        await writer.push("data");

        content = await readFile("test.txt", "utf8");
        expect(content).toBe("data");

        await writer.push("43");
        content = await readFile("test.txt", "utf8");
        expect(content).toBe("43");
        await writer.disconnect();
    });

    test("chained", async () => {
        const writerFactory = new FileStreamWriterFactory();
        const writer = await writerFactory.build({path: "test.txt", onReplace: true, readFirstContent: false, encoding: "utf-8" }, x => <string>x);
        const readerFactory = new FileStreamReaderFactory();
        const stream = await readerFactory.build({path: "test.txt", onReplace: true, readFirstContent: false, encoding: "utf-8" }, x => <string>x);

        const elements: string[] = [];
        stream.data(x =>{ elements.push(x)});

        await writer.push("data");
        await sleep(200);

        expect(elements).toStrictEqual(["data"]);

        await writer.push("43");
        await sleep(200);
        expect(elements).toStrictEqual(["data", "43"]);
        await stream.disconnect();
        await writer.disconnect();
    });
});
