import { OdataQuery } from "./OdataQuery";
export declare class ORequest {
    config: RequestInit;
    url: URL;
    constructor(url: URL | string, config: RequestInit);
    get fetch(): Promise<Response>;
    applyQuery(query?: OdataQuery): void;
}
