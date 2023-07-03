import type * as rdf from "@rdfjs/types";
import { FileConnectorType } from "@treecg/connector-file";
import { HTTPConnectorType } from "@treecg/connector-http";
import type { KafkaReaderConfig } from "@treecg/connector-kafka";
import { KafkaConnectorType } from "@treecg/connector-kafka";
import type { BrokerConfig, ConsumerConfig } from "@treecg/connector-kafka/lib/Common";
import type { Typed } from "@treecg/connector-types";
import { WSConnectorType } from "@treecg/connector-ws";
import { RDF } from "@treecg/types";
import type { FileReaderConfig, HttpReaderConfig, MatchFunction, ReaderConfig, WsReaderConfig } from "..";
import type { MatchFunctionObject } from "./connectorAll";
import { getOne, parseBool } from "./util";
import { CONN } from "./voc";

export async function loadReaderConfig(subject: rdf.Term, match: MatchFunction): Promise<Typed<ReaderConfig>> {
    const matchObject: MatchFunctionObject = async (sub, pred, obj) => {
        const out = await match(sub, pred, obj);
        return out.map(x => x.object);
    };

    const types = await matchObject(subject, RDF.terms.type, null);

    if (types.length !== 1) {
        throw new Error(`Expected exactly 1 rdf:type, found ${types.length}`);
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

    throw new Error(`Type not supported ${types[0].value}`);
}

async function objToKafkaConfig(subj: rdf.Term, match: MatchFunctionObject): Promise<KafkaReaderConfig> {
    const out = <KafkaReaderConfig>{};
    out.topic = <{ fromBeginning?: boolean; name: string }>{};
    out.consumer = <ConsumerConfig>{};
    out.broker = <BrokerConfig>{};

    const topics = await match(subj, CONN.terms.kafkaTopic, null);
    const brokers = await match(subj, CONN.terms.kafkaBroker, null);
    const groups = await match(subj, CONN.terms.kafkaGroup, null);
    const fromBeginning = await match(subj, CONN.terms.kafkaFromBeginning, null);

    out.topic.name = getOne("kafkaTopic", topics).value;
    out.topic.fromBeginning = parseBool(fromBeginning[0]?.value);

    out.broker.hosts = brokers.map(x => x.value);
    out.consumer.groupId = getOne("kafkaGroup", groups).value;

    return out;
}

async function objToHTTPConfig(subj: rdf.Term, match: MatchFunctionObject): Promise<HttpReaderConfig> {
    const portOption = await match(subj, CONN.terms.httpPort, null);
    if (portOption.length > 0) {
        return {
            port: Number.parseInt(portOption[0].value, 10),
            host: "0.0.0.0",
        };
    }

    const uris = await match(subj, CONN.terms.httpEndpoint, null);
    const uri = getOne("httpPort or httpEndpoint", uris);
    const parsed = new URL(uri.value);

    return {
        port: Number.parseInt(parsed.port, 10),
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
    if (portOption.length > 0) {
        return {
            port: Number.parseInt(portOption[0].value, 10),
            host: "0.0.0.0",
        };
    }

    const uris = await match(subject, CONN.terms.wsUri, null);
    const uri = getOne("wsUri or wsPort", uris);
    const parsed = new URL(uri.value);

    return {
        port: Number.parseInt(parsed.port, 10),
        host: parsed.host,
    };
}

