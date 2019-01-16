import { SpannerExtendSchemaSources } from "./SpannerRawTypes";
interface Column {
    name: string;
    sort: string;
}
declare type IndexType = {
    unique: boolean;
    sparse: boolean;
} | string;
interface Index {
    name: string;
    type: IndexType;
    table: string;
    columns: Column[];
}
export declare class SpannerDDLTransformer {
    scopedTable: string;
    scopedColumn?: string;
    scopedColumnType?: string;
    scopedIndex?: string;
    primaryKeyColumns: Column[];
    indices: Index[];
    constructor();
    transform(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected addExtendSchema(extendSchemas: SpannerExtendSchemaSources, type: string, value: string): void;
    protected setScopedColumn(column: string): void;
    protected setScopedIndex(index: string): void;
    protected P_CREATE_TABLE_COMMON(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected P_CREATE_TABLE_CREATE_DEFINITIONS(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected P_CREATE_TABLE_CREATE_DEFINITION(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected P_ALTER_TABLE(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected P_ALTER_TABLE_SPECS(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected P_CREATE_TABLE_OPTIONS(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected P_CREATE_TABLE_OPTION(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected P_RENAME_TABLE(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected P_CREATE_INDEX(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected P_DROP_INDEX(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected P_DROP_TABLE(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected O_ALTER_TABLE_SPEC(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected O_ALTER_TABLE_SPEC_addColumn(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected O_ALTER_TABLE_SPEC_dropColumn(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected O_ALTER_TABLE_SPEC_changeColumn(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected O_ALTER_TABLE_SPEC_addIndex(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected O_ALTER_TABLE_SPEC_addSpatialIndex(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected O_ALTER_TABLE_SPEC_addUniqueKey(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected O_ALTER_TABLE_SPEC_dropIndex(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected O_DATATYPE(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected O_COLUMN_DEFINITION(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected alterColumnDefinitionHelper(ast: any, extendSchemas: SpannerExtendSchemaSources): string;
    protected primaryKeyDefinitionHelper(): string;
    protected indexDefinitionsHelper(): string;
    protected indexDefinitionHelper(idx: Index): string;
    protected indexHelper(index: any, type: IndexType): Index;
    protected indexNameHelper(table: string, columns: Column[]): string;
    protected indexColumnsHelper(columns: Column[]): string;
}
export declare function MakeDebug(t: SpannerDDLTransformer): SpannerDDLTransformer;
export {};
