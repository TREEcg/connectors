import { EventStream, IFragmentInfo, IMember, IMetadata, IRecord } from "@connectors/types";

export type StreamType = { "data": IRecord, "metadata": IMetadata };
export type LDESStreamType = { "data": IMember, "metadata": EventStream, "fragment": IFragmentInfo };

export * from "./lib/StreamReader";
export * from "./lib/StreamWriter";