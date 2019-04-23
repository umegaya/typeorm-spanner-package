import { Driver } from "../Driver";
import { ColumnType } from "../types/ColumnTypes";
import { SpannerConnectionOptions } from "./SpannerConnectionOptions";
import { RdbmsSchemaBuilder } from "../../schema-builder/RdbmsSchemaBuilder";
import { SpannerQueryRunner } from "./SpannerQueryRunner";
import { Connection } from "../../connection/Connection";
import { MappedColumnTypes } from "../types/MappedColumnTypes";
import { DataTypeDefaults } from "../types/DataTypeDefaults";
import { ColumnMetadata } from "../../metadata/ColumnMetadata";
import { TableColumn } from "../../schema-builder/table/TableColumn";
import { EntityMetadata } from "../../metadata/EntityMetadata";
import { SpannerDatabase, SpannerExtendSchemas } from "./SpannerRawTypes";
import { Table } from "../../schema-builder/table/Table";
import { ObjectLiteral } from "../../common/ObjectLiteral";
import { ValueTransformer } from "../../decorator/options/ValueTransformer";
export declare const SpannerColumnUpdateWithCurrentTimestamp = "CURRENT_TIMESTAMP(6)";
export declare const SpannerColumnUpdateWithCommitTimestamp = "spanner.commit_timestamp()";
/**
 * Organizes communication with MySQL DBMS.
 */
export declare class SpannerDriver implements Driver {
    /**
     * Connection used by driver.
     */
    connection: Connection;
    /**
     * Spanner underlying library.
     */
    spannerLib: any;
    spanner: {
        client: any;
        instance: any;
        database: SpannerDatabase;
    } | null;
    /**
     * because spanner's schema change cannot be done transactionally,
     * we ignore start/commit/rollback Transaction during schema change phase
     */
    enableTransaction: boolean;
    /**
     * ddl parser to use mysql migrations as spanner ddl.
     * https://github.com/duartealexf/sql-ddl-to-json-schema
     */
    ddlParser: any;
    /**
     * Connection options.
     */
    options: SpannerConnectionOptions;
    /**
     * Master database used to perform all write queries.
     */
    database?: string;
    /**
     * Indicates if replication is enabled.
     */
    isReplicated: boolean;
    /**
     * Indicates if tree tables are supported by this driver.
     */
    treeSupport: boolean;
    /**
     * Gets list of supported column data types by a driver.
     *
     * @see https://www.tutorialspoint.com/mysql/mysql-data-types.htm
     * @see https://dev.mysql.com/doc/refman/5.7/en/data-types.html
     */
    supportedDataTypes: ColumnType[];
    /**
     * Gets list of spatial column data types.
     */
    spatialTypes: ColumnType[];
    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[];
    /**
     * Gets list of column data types that support length by a driver.
     */
    withWidthColumnTypes: ColumnType[];
    /**
     * Gets list of column data types that support precision by a driver.
     */
    withPrecisionColumnTypes: ColumnType[];
    /**
     * Gets list of column data types that supports scale by a driver.
     */
    withScaleColumnTypes: ColumnType[];
    /**
     * Gets list of column data types that supports UNSIGNED and ZEROFILL attributes.
     */
    unsignedAndZerofillTypes: ColumnType[];
    /**
     * ORM has special columns and we need to know what database column types should be for those columns.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes;
    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults;
    constructor(connection: Connection);
    static updateTableWithExtendSchema(db: SpannerDatabase, extendSchemas: SpannerExtendSchemas, ignoreColumnNotFound: boolean): void;
    static randomInt64(): string;
    static needToChangeByNormalSchema(from: any, to: any): boolean;
    /**
     * returns spanner database object. used as databaseConnection of query runner.
     */
    getDatabaseHandle(): Promise<any>;
    getAllTablesForDrop(force?: boolean): Promise<{
        [name: string]: Table;
    }>;
    systemTableNames(): string[];
    getSystemTables(): Promise<Table[]>;
    getExtendSchemas(): SpannerExtendSchemas;
    /**
     * create and drop database of arbiter name.
     * if name equals this.options.database, change driver state accordingly
     */
    createDatabase(name: string): Promise<any>;
    dropDatabase(name: string): Promise<void>;
    /**
     * set tables object cache.
     */
    setTable(table: Table): void;
    dropTable(tableName: string): Promise<void>;
    /**
     * load tables. cache them into this.spanner.databases too.
     * @param tableNames table names which need to load.
     */
    loadTables(tableNames: string[] | Table | string): Promise<Table[]>;
    getDatabases(): string[];
    isSchemaTable(table: Table): boolean;
    getSchemaTableName(): string;
    getTableEntityMetadata(): EntityMetadata[];
    autoGenerateValue(tableName: string, columnName: string): any;
    encodeDefaultValueGenerator(value: any): string;
    decodeDefaultValueGenerator(value: string): () => any;
    /**
     * Performs connection to the database.
     */
    connect(): Promise<void>;
    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     * here update extend schema.
     */
    afterConnect(): Promise<void>;
    /**
     * Makes any action after any synchronization happens (e.g. sync extend schema table in Spanner driver)
     */
    afterBootStep(event: "DROP_DATABASE" | "RUN_MIGRATION" | "SYNCHRONIZE" | "FINISH"): Promise<void>;
    /**
     * Closes connection with the database.
     */
    disconnect(): Promise<void>;
    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder(): RdbmsSchemaBuilder;
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode?: "master" | "slave"): SpannerQueryRunner;
    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]];
    /**
     * Escapes a column name.
     */
    escape(columnName: string): string;
    /**
     * Build full table name with database name, schema name and table name.
     * E.g. "myDB"."mySchema"."myTable"
     * but spanner does not allow to prefix database name, we just returns table name.
     */
    buildTableName(tableName: string, schema?: string, database?: string): string;
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any;
    normalizeValue(value: any, type: any, transformer?: ValueTransformer): any;
    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any;
    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: {
        type: ColumnType;
        length?: number | string;
        precision?: number | null;
        scale?: number;
    }): string;
    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string;
    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column: ColumnMetadata): boolean;
    /**
     * Returns default column lengths, which is required on column creation.
     */
    getColumnLength(column: ColumnMetadata | TableColumn): string;
    /**
     * Creates column type definition including length, precision and scale
     */
    createFullType(column: TableColumn): string;
    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    obtainMasterConnection(): Promise<any>;
    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection(): Promise<any>;
    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata: EntityMetadata, insertResult: any): ObjectLiteral | undefined;
    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[];
    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     * for Spanner, no auto assigned value (default/generatedStorategy(uuid, increment)) at database side.
     * every such values are defined in client memory, so just return insertValue.
     */
    isReturningSqlSupported(): boolean;
    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported(): boolean;
    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName: string, index: number): string;
    /**
     * Loads all driver dependencies.
     */
    protected loadDependencies(): void;
    /**
     * Checks if "DEFAULT" values in the column metadata and in the database are equal.
     */
    protected compareDefaultValues(columnMetadata: ColumnMetadata, columnMetadataValue?: string, databaseValue?: string): boolean;
    /**
     * parse typename and return additional information required by TableColumn object.
     */
    protected parseTypeName(typeName: string): {
        typeName: string;
        isArray: boolean;
        length?: string;
    };
    /**
    * parse output of database.getSchema to generate Table object
    */
    protected parseSchema(schemas: any): Promise<{
        [tableName: string]: Table;
    }>;
    protected setupExtendSchemas(db: SpannerDatabase, afterSync: boolean): Promise<void>;
}
