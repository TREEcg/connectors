import { appendFile, writeFile } from 'fs/promises';
import { isAbsolute } from 'path';
import type { IStreamWriterFactory, IWriter } from '@treecg/connector-types';
import { fromSerializer } from '@treecg/connector-types';
import { FileConnectorType } from '..';
import type { IFileReaderConfig } from './StreamReader';

export interface IFileWriterConfig extends IFileReaderConfig { }

export async function startFileStreamWriter<T>(config: IFileWriterConfig,
  serializer?: (item: T) => string | PromiseLike<string>): Promise<IWriter<T>> {
  const ser = fromSerializer(serializer);
  const path = isAbsolute(config.path) ? config.path : `${process.cwd()}/${config.path}`;
  const encoding: BufferEncoding = <BufferEncoding>config.encoding || 'utf-8';

  if (!config.onReplace) {
    await writeFile(path, '', { encoding });
  }

  const push = async (item: T): Promise<void> => {
    const string = await ser(item);

    if (config.onReplace) {
      await writeFile(path, string, { encoding });
    } else {
      await appendFile(path, string, { encoding });
    }
  };

  return {
    push, async disconnect() { },
  };
}

export class FileStreamWriterFactory implements IStreamWriterFactory<IFileWriterConfig> {
  public readonly type = FileConnectorType;

  public build<T>(config: IFileWriterConfig,
    serializer?: (item: T) => string | PromiseLike<string>): Promise<IWriter<T>> {
    return startFileStreamWriter(config, serializer);
  }
}
