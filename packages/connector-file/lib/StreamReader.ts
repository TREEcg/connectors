import { createReadStream } from 'fs';
import { open, readFile, stat } from 'fs/promises';
import { isAbsolute } from 'path';
import { fromDeserializer, SimpleStream } from '@treecg/connector-types';
import type { IStream, IStreamReaderFactory } from '@treecg/connector-types';
import Watcher from 'watcher';
import { FileConnectorType } from '..';

interface ILocalError extends Error {
  code: string;
}

export interface IFileReaderConfig {
  path: string;
  onReplace: boolean;
  readFirstContent?: boolean;
  encoding?: string;
}

async function makeSureFileExists(path: string): Promise<void> {
  const handle = await open(path, 'a+');
  await handle.close();
}

async function getFileSize(path: string): Promise<number> {
  return (await stat(path)).size;
}

function readPart(path: string, start: number, end: number, encoding: BufferEncoding): Promise<string> {
  return new Promise(res => {
    const stream = createReadStream(path, { encoding, start, end });
    let buffer = '';
    stream.on('data', chunk => {
      buffer += chunk;
    });
    stream.on('close', () => res(buffer));
  });
}

export async function startFileStreamReader<T>(
  config: IFileReaderConfig,
  deserializer?: (message: string) => T | PromiseLike<T>,
): Promise<IStream<T>> {
  const des = fromDeserializer(deserializer);
  const path = isAbsolute(config.path) ? config.path : `${process.cwd()}/${config.path}`;
  const encoding: BufferEncoding = <BufferEncoding>config.encoding || 'utf-8';

  await makeSureFileExists(path);

  let currentPos = await getFileSize(path);

  const watcher = new Watcher(path, { debounce: 100 });
  const out = new SimpleStream<T>(async () => {
    watcher.close();
  });

  watcher.on('change', async path => {
    try {
      let content: string;
      if (config.onReplace) {
        content = await readFile(path, { encoding });
      } else {
        const newSize = await getFileSize(path);

        if (newSize <= currentPos) {
          currentPos = newSize;
          return;
        }

        content = await readPart(path, currentPos, newSize, encoding);
        currentPos = newSize;
      }

      out.push(await des(content)).catch(error => {
        throw error;
      });
    } catch (error: unknown) {
      if ((<ILocalError>error).code === 'ENOENT') {
        return;
      }
      throw error;
    }
  });

  await Promise.all([
    new Promise(res => watcher.on('add', res)),
    new Promise(res => watcher.on('ready', res)),
  ]);

  if (config.onReplace && config.readFirstContent) {
    console.log('reading first content');
    const content = await readFile(path, { encoding });
    out.push(await des(content)).catch(error => {
      throw error;
    });
  }

  return out;
}

export class FileStreamReaderFactory implements IStreamReaderFactory<IFileReaderConfig> {
  public readonly type = FileConnectorType;

  public build<T>(config: IFileReaderConfig,
    deserializer?: (message: string) => T | PromiseLike<T>): Promise<IStream<T>> {
    return startFileStreamReader(config, deserializer);
  }
}

