
import { IActionRdfMetadataExtract, IActorRdfMetadataExtractOutput } from "@comunica/bus-rdf-metadata-extract";
import { Bus, IActorArgs, IActorTest } from "@comunica/core";
import type {Quad, Term} from '@rdfjs/types';
import { ActorRdfMetadataExtractTree } from "@treecg/actor-rdf-metadata-extract-tree";

namespace NS {
    export namespace Tree {
        export const NS: string = "https://w3id.org/tree#";
        export const Path = `${Tree.NS}path`;
        export const Member = `${Tree.NS}member`;
        export const Value = `${Tree.NS}value`;
        export const Node = `${Tree.NS}node`;
        export const View = `${Tree.NS}view`;
        export const Relation = `${Tree.NS}relation`;
    }

    export const Type: string = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

    export namespace LDES {
        export const NS: string = "https://w3id.org/ldes#";
        export const EventStream: string = `${NS}EventStream`
    }
}

type QuadMap = Record<string, Term[]>;
interface FooArgs extends IActorArgs<IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput> {
    bus: Bus<ActorRdfMetadataExtractTree, IActionRdfMetadataExtract, IActorTest, IActorRdfMetadataExtractOutput>;
    excluded: string[];
}

export class EventStreamMetadataExtractor extends ActorRdfMetadataExtractTree {
    private id?: string
    private readonly excluded: string[];
    constructor(args: FooArgs) {
        super(args);
        this.excluded = args.excluded;
    }

    async run(action: IActionRdfMetadataExtract): Promise<IActorRdfMetadataExtractOutput> {
        const data: Record<string, QuadMap> = {};
        const handler = this.id == undefined ? this.onDataFull(data) : this.onDataWithId(data, this.id);
        action.metadata.on("data", handler);

        const out = await super.run(action);

        out.metadata["mine"] = data[this.id!];
        return out;
    }

    private onDataFull(data: Record<string, QuadMap>): (quad: Quad) => void {
        return (quad: Quad) => {
            if (this.excluded.includes(quad.predicate.value)) return;
            this.addQuad(data, quad);

            if (quad.predicate.value == NS.Type && quad.object.value == NS.LDES.EventStream) {
                this.id = quad.subject.value;
            }
        };
    }

    private onDataWithId(data: Record<string, QuadMap>, id: string): (quad: Quad) => void {
        return (quad: Quad) => {
            if (this.excluded.includes(quad.predicate.value)) return;
            if (quad.subject.value == id) {
                this.addQuad(data, quad);
            }
        };
    }

    private addQuad(data: Record<string, QuadMap>, quad: Quad) {
        const subject = quad.subject.value;
        const predicate = quad.predicate.value;
        const subjectProperties = data[subject] || (data[subject] = {});
        const objects = subjectProperties[predicate] || (subjectProperties[predicate] = []);
        objects.push(quad.object);
    }
}