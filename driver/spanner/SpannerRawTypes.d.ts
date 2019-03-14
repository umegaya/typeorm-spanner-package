import { Table } from "../../schema-builder/table/Table";
import { TableColumn } from "../../schema-builder/table/TableColumn";
export interface SpannerExtendColumnSchema {
    default?: any;
    generatorStorategy?: "uuid" | "increment";
    generator?: () => any;
}
export interface SpannerExtendSchemas {
    [table: string]: {
        [column: string]: SpannerExtendColumnSchema;
    };
}
export interface SpannerExtendColumnSchemaSource {
    type: string;
    value: string;
}
export interface SpannerExtendSchemaSources {
    [table: string]: {
        [column: string]: SpannerExtendColumnSchemaSource;
    };
}
export interface SpannerDatabase {
    handle: any;
    tables: {
        [key: string]: Table;
    };
    /**
     * extra schema information
     */
    schemas: SpannerExtendSchemas | null;
}
export interface SpannerExtendedColumnProps {
    databaseName: string;
    default?: any;
    isNullable?: boolean;
    generationStrategy?: "uuid" | "increment";
}
export declare class SpannerExtendedColumnPropsFromTableColumn implements SpannerExtendedColumnProps {
    databaseName: string;
    constructor(c: TableColumn);
}
export interface SpannerExtendedTableProps {
    name: string;
    columns: SpannerExtendedColumnProps[];
}
