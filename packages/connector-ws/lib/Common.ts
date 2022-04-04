
import { EventStream, IFragmentInfo, IMember, IMetadata, IRecord } from "@connectors/types";

export interface StreamType { "data": IRecord, "metadata": IMetadata };
export interface LDESStreamType { "data": IMember, "metadata": EventStream, "fragment": IFragmentInfo };