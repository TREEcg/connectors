
import * as rdf from "@rdfjs/types";
import { FileConnectorType } from "@treecg/connector-file";
import { HTTPConnectorType } from "@treecg/connector-http";
import { KafkaConnectorType, KafkaReaderConfig } from "@treecg/connector-kafka";
import { ConsumerConfig } from "@treecg/connector-kafka/lib/Common";
import { Typed } from "@treecg/connector-types";
import { WSConnectorType } from "@treecg/connector-ws";
import { RDF } from "@treecg/types";
import { FileReaderConfig, HttpReaderConfig, MatchFunction, ReaderConfig, WsReaderConfig } from "..";
import { MatchFunctionObject } from "./connector-all";
import { getOne, parseBool } from "./util";
import { CONN } from "./voc";

export async function loadReaderConfig(subject: rdf.Term, match: MatchFunction): Promise<Typed<ReaderConfig>> {
  const matchObject: MatchFunctionObject = async (s, p, o) => {
    const out = await match(s, p, o);
    return out.map(x => x.object);
  };

  const types = await matchObject(subject, RDF.terms.type, null);

  if (types.length !== 1) {
    throw `Expected exactly 1 rdf:type, found ${types.length}`;
  }

  console.log("Checking type", types[0]);
  switch (types[0].value) {
    case CONN.WsReaderChannel:
      return { type: WSConnectorType, config: await objToWsConfig(subject, matchObject) };

    case CONN.FileReaderChannel:
      return { type: FileConnectorType, config: await objToFileConfig(subject, matchObject) };

    case CONN.HttpReaderChannel:
      return { type: HTTPConnectorType, config: await objToHTTPConfig(subject, matchObject) };

    case CONN.KafkaReaderChannel:
      return { type: KafkaConnectorType, config: await objToKafkaConfig(subject, matchObject) };
  }

  throw `Type not supported ${types[0].value}`;
}

async function objToKafkaConfig(subj: rdf.Term, match: MatchFunctionObject): Promise<KafkaReaderConfig> {
  const out = {} as KafkaReaderConfig;
  out.topic = {} as { fromBeginning?: boolean, name: string };
  out.consumer = {} as ConsumerConfig;

  const topics = await match(subj, CONN.terms.kafkaTopic, null);
  const brokers = await match(subj, CONN.terms.kafkaBroker, null);
  const groups = await match(subj, CONN.terms.kafkaGroup, null);
  const fromBeginning = await match(subj, CONN.terms.kafkaFromBeginning, null);


  out.topic.name = getOne("kafkaTopic", topics).value;
  out.topic.fromBeginning = parseBool(fromBeginning[0]?.value);

  out.broker = getOne("kafkaBroker", brokers).value;
  out.consumer.groupId = getOne("kafkaGroup", groups).value;

  return out;
}

async function objToHTTPConfig(subj: rdf.Term, match: MatchFunctionObject): Promise<HttpReaderConfig> {
  const portOption = await match(subj, CONN.terms.httpPort, null);
  if (portOption.length !== 0) {
    return {
      port: parseInt(portOption[0].value),
      host: "0.0.0.0",
    }
  }

  const uris = await match(subj, CONN.terms.httpEndpoint, null);
  const uri = getOne("httpPort or httpEndpoint", uris);
  const parsed = new URL(uri.value);

  return {
    port: parseInt(parsed.port),
    host: parsed.host,
  };
}

async function objToFileConfig(subj: rdf.Term, match: MatchFunctionObject): Promise<FileReaderConfig> {
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


async function objToWsConfig(subject: rdf.Term, match: MatchFunctionObject): Promise<WsReaderConfig> {
  const portOption = await match(subject, CONN.terms.wsPort, null);
  if (portOption.length !== 0) {
    return {
      port: parseInt(portOption[0].value),
      host: "0.0.0.0",
    }
  }

  const uris = await match(subject, CONN.terms.wsUri, null);
  const uri = getOne("wsUri or wsPort", uris);
  const parsed = new URL(uri.value);

  return {
    port: parseInt(parsed.port),
    host: parsed.host,
  };
}


