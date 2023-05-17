import type * as rdf from "@rdfjs/types";
import { FileConnectorType } from "@treecg/connector-file";
import { HTTPConnectorType } from "@treecg/connector-http";
import { KafkaConnectorType } from "@treecg/connector-kafka";
import type { BrokerConfig } from "@treecg/connector-kafka/lib/Common";
import type { Typed } from "@treecg/connector-types";
import { WSConnectorType } from "@treecg/connector-ws";
import { RDF } from "@treecg/types";
import type { MatchFunction } from "..";
import type {
    FileWriterConfig,
    WriterConfig,
    WsWriterConfig,
    KafkaWriterConfig,
    HttpWriterConfig,
    MatchFunctionObject,
} from "./connectorAll";
import { getOne, parseBool } from "./util";
import { CONN } from "./voc";

export async function loadWriterConfig(subject: rdf.Term, match: MatchFunction): Promise<Typed<WriterConfig>> {
    const matchObject: MatchFunctionObject = async (sub, pred, obj) => {
        const out = await match(sub, pred, obj);
        return out.map(x => x.object);
    };
    const types = await matchObject(subject, RDF.terms.type, null);

    if (types.length !== 1) {
        throw new Error(`Expected exactly 1 rdf:type, found ${types.length}`);
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

    throw new Error(`Type not supported ${types[0].value}`);
}

async function objToKafkaConfig(subj: rdf.Term, match: MatchFunctionObject): Promise<KafkaWriterConfig> {
    const out = <KafkaWriterConfig>{};
    // Types? What types
    out.topic = <{ name: string }>{};
    out.broker = <BrokerConfig>{};

    const topics = await match(subj, CONN.terms.kafkaTopic, null);
    const brokers = await match(subj, CONN.terms.kafkaBroker, null);

    out.topic.name = getOne("kafkaTopic", topics).value;
    out.broker.hosts = brokers.map(x => x.value);

    return out;
}

async function objToHTTPConfig(subj: rdf.Term, match: MatchFunctionObject): Promise<HttpWriterConfig> {
    const methods = await match(subj, CONN.terms.httpMethod, null);
    const uris = await match(subj, CONN.terms.httpEndpoint, null);

    return {
        method: getOne("httpMethod", methods).value,
        url: getOne("httpEndpoint", uris).value,
    };
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

