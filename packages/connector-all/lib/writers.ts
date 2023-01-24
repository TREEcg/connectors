import * as rdf from "@rdfjs/types";
import { FileConnectorType } from "@treecg/connector-file";
import { HTTPConnectorType } from "@treecg/connector-http";
import { KafkaConnectorType } from "@treecg/connector-kafka";
import { Typed } from "@treecg/connector-types";
import { WSConnectorType } from "@treecg/connector-ws";
import { RDF } from "@treecg/types";
import { MatchFunction } from "..";
import { FileWriterConfig, WriterConfig, WsWriterConfig, KafkaWriterConfig, HttpWriterConfig } from "./connector-all";
import { MatchFunctionObject } from "./connector-all";
import { getOne, parseBool } from "./util";
import { CONN } from "./voc";

export async function loadWriterConfig(subject: rdf.Term, match: MatchFunction): Promise<Typed<WriterConfig>> {
  const matchObject: MatchFunctionObject = async (s, p, o) => {
    const out = await match(s, p, o);
    return out.map(x => x.object);
  };
  const types = await matchObject(subject, RDF.terms.type, null);

  if (types.length !== 1) {
    throw `Expected exactly 1 rdf:type, found ${types.length}`;
  }

  switch (types[0].value) {
    case CONN.WsWriterChannel:
      return { type: WSConnectorType, config: await objToWsConfig(subject, matchObject) };

    case CONN.FileWriterChannel:
      return { type: FileConnectorType, config: await objToFileConfig(subject, matchObject) };

    case CONN.HttpWriterChannel:
      return { type: HTTPConnectorType, config: await objToHTTPConfig(subject, matchObject) };

    case CONN.KafkaWriterChannel:
      return { type: KafkaConnectorType, config: await objToKafkaConfig(subject, matchObject) };
  }

  throw `Type not supported ${types[0].value}`;
}

async function objToKafkaConfig(subj: rdf.Term, match: MatchFunctionObject): Promise<KafkaWriterConfig> {
  const out = {} as KafkaWriterConfig;
  // Types? What types
  out.topic = {} as { name: string };

  const topics = await match(subj, CONN.terms.kafkaTopic, null);
  const brokers = await match(subj, CONN.terms.kafkaBroker, null);

  out.topic.name = getOne("kafkaTopic", topics).value;
  out.broker = getOne("kafkaBroker", brokers).value;

  return out;
}

async function objToHTTPConfig(subj: rdf.Term, match: MatchFunctionObject): Promise<HttpWriterConfig> {
  const methods = await match(subj, CONN.terms.httpMethod, null);
  const uris = await match(subj, CONN.terms.httpEndpoint, null);

  return {
    method: getOne("httpMethod", methods).value,
    url: getOne("httpEndpoint", uris).value,
  }
}

async function objToFileConfig(subj: rdf.Term, match: MatchFunctionObject): Promise<FileWriterConfig> {
  const paths = await match(subj, CONN.terms.filePath, null);
  const path = getOne("filePath", paths).value;

  const onRepalce = (await match(subj, CONN.terms.fileOnReplace, null))[0]?.value || "false";
  const encoding = (await match(subj, CONN.terms.fileEncoding, null))[0]?.value;
  const readFirst = (await match(subj, CONN.terms.fileReadFirstContent, null))[0]?.value;

  return {
    path,
    onReplace: onRepalce ? parseBool(onRepalce) : false,
    readFirstContent: readFirst ? parseBool(readFirst) : undefined,
    encoding,
  };
}


async function objToWsConfig(subj: rdf.Term, match: MatchFunctionObject): Promise<WsWriterConfig> {
  const uris = await match(subj, CONN.terms.wsUri, null);

  return {
    url: getOne("wsUri", uris).value,
  };
}

