import { QueryRunner } from "../../query-runner/QueryRunner";
import { TableColumn } from "../../schema-builder/table/TableColumn";
import { Table } from "../../schema-builder/table/Table";
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey";
import { TableIndex } from "../../schema-builder/table/TableIndex";
import { SpannerDriver } from "./SpannerDriver";
import { SpannerExtendSchemas, SpannerExtendColumnSchema, SpannerExtendedColumnProps, SpannerExtendedTableProps, SpannerExtendSchemaSources } from "./SpannerRawTypes";
import { ReadStream } from "../../platform/PlatformTools";
import { EntityMetadata } from "../../metadata/EntityMetadata";
import { TableUnique } from "../../schema-builder/table/TableUnique";
import { BaseQueryRunner } from "../../query-runner/BaseQueryRunner";
import { TableCheck } from "../../schema-builder/table/TableCheck";
import { IsolationLevel } from "../types/IsolationLevel";
import { EntityManager } from "../../entity-manager/EntityManager";
import { QueryBuilder } from "../../query-builder/QueryBuilder";
import { QueryExpressionMap } from "../../query-builder/QueryExpressionMap";
import { ObjectLiteral } from "../../common/ObjectLiteral";
import { TableExclusion } from "../../schema-builder/table/TableExclusion";
/**
 * Runs queries on a single mysql database connection.
 */
export declare class SpannerQueryRunner extends BaseQueryRunner implements QueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: SpannerDriver;
    /**
     * transaction if startsTransaction
     */
    protected tx: any;
    /**
     * disable ddl parser. from synchronization, actual spanner DDL generated,
     * so no need to parse even if option specify to use it.
     */
    protected disableDDLParser: boolean;
    constructor(driver: SpannerDriver);
    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect(): Promise<any>;
    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release(): Promise<void>;
    /**
     * Starts transaction on the current connection.
     */
    startTransaction(isolationLevel?: IsolationLevel): Promise<void>;
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    commitTransaction(): Promise<void>;
    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    rollbackTransaction(): Promise<void>;
    /**
     * Run provided function in transaction.
     * internally it may use start/commit Transaction.
     * Error will be thrown if transaction start/commit will fails
     */
    runInTransaction<T>(runInTransaction: (tx: EntityManager) => Promise<T>, isolationLevel?: IsolationLevel): Promise<T>;
    /**
     * Executes sql used special for schema build.
     */
    protected executeQueries(upQueries: string | string[], downQueries: string | string[]): Promise<void>;
    /**
     * Executes a raw SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any>;
    /**
     * execute query. call from XXXQueryBuilder
     */
    queryByBuilder<Entity>(qb: QueryBuilder<Entity>): Promise<any>;
    queryByBuilderAndParams<Entity>(qb: QueryBuilder<Entity>, sql: string, params?: any[]): Promise<any>;
    /**
     * Returns raw data stream.
     */
    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream>;
    /**
     * Returns all available database names including system databases.
     */
    getDatabases(): Promise<string[]>;
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    getSchemas(database?: string): Promise<string[]>;
    /**
     * Checks if database with the given name exist.
     */
    hasDatabase(database: string): Promise<boolean>;
    /**
     * Checks if schema with the given name exist.
     */
    hasSchema(schema: string): Promise<boolean>;
    /**
     * Checks if table with the given name exist in the database.
     */
    hasTable(tableOrName: Table | string): Promise<boolean>;
    /**
     * Checks if column with the given name exist in the given table.
     */
    hasColumn(tableOrName: Table | string, column: TableColumn | string): Promise<boolean>;
    /**
     * Creates a new database.
     */
    createDatabase(database: string, ifNotExist?: boolean): Promise<void>;
    /**
     * Drops database.
     */
    dropDatabase(database: string, ifExist?: boolean): Promise<void>;
    /**
     * Creates a new table schema.
     */
    createSchema(schema: string, ifNotExist?: boolean): Promise<void>;
    /**
     * Drops table schema.
     */
    dropSchema(schemaPath: string, ifExist?: boolean): Promise<void>;
    /**
     * Creates a new table. aka 'schema' on spanner
     * note that foreign key always dropped regardless the value of createForeignKeys.
     * because our foreignkey analogue is achieved by interleaved table
     */
    createTable(table: Table, ifNotExist?: boolean, createForeignKeys?: boolean): Promise<void>;
    /**
     * Drop the table.
     * note that foreign key always dropped regardless the value of dropForeignKeys.
     * because our foreignkey analogue is achieved by interleaved table
     */
    dropTable(target: Table | string, ifExist?: boolean, dropForeignKeys?: boolean): Promise<void>;
    /**
     * Renames a table.
     */
    renameTable(oldTableOrName: Table | string, newTableName: string): Promise<void>;
    /**
     * Creates a new column from the column in the table.
     */
    addColumn(tableOrName: Table | string, column: TableColumn): Promise<void>;
    /**
     * Creates a new columns from the column in the table.
     */
    addColumns(tableOrName: Table | string, columns: TableColumn[]): Promise<void>;
    /**
     * Renames column in the given table.
     */
    renameColumn(tableOrName: Table | string, oldTableColumnOrName: TableColumn | string, newTableColumnOrName: TableColumn | string): Promise<void>;
    /**
     * Changes a column in the table.
     * according to https://cloud.google.com/spanner/docs/schema-updates, only below are allowed
     * - Change a STRING column to a BYTES column or a BYTES column to a STRING column.
     * - Increase or decrease the length limit for a STRING or BYTES type (including to MAX), unless it is a primary key column inherited by one or more child tables.
     * - Add/Remove NOT NULL constraint for non-key column
     * - Enable or disable commit timestamps in value and primary key columns.
     */
    changeColumn(tableOrName: Table | string, oldColumnOrName: TableColumn | string, newColumn: TableColumn): Promise<void>;
    /**
     * Changes a column in the table.
     */
    changeColumns(tableOrName: Table | string, changedColumns: {
        newColumn: TableColumn;
        oldColumn: TableColumn;
    }[]): Promise<void>;
    /**
     * Drops column in the table.
     */
    dropColumn(tableOrName: Table | string, columnOrName: TableColumn | string): Promise<void>;
    /**
     * Drops the columns in the table.
     */
    dropColumns(tableOrName: Table | string, columns: TableColumn[]): Promise<void>;
    /**
     * Creates a new primary key.
     */
    createPrimaryKey(tableOrName: Table | string, columnNames: string[]): Promise<void>;
    /**
     * Updates composite primary keys.
     */
    updatePrimaryKeys(tableOrName: Table | string, columns: TableColumn[]): Promise<void>;
    /**
     * Drops a primary key.
     */
    dropPrimaryKey(tableOrName: Table | string): Promise<void>;
    /**
     * Creates a new unique constraint.
     */
    createUniqueConstraint(tableOrName: Table | string, uniqueConstraint: TableUnique): Promise<void>;
    /**
     * Creates a new unique constraints.
     */
    createUniqueConstraints(tableOrName: Table | string, uniqueConstraints: TableUnique[]): Promise<void>;
    /**
     * Drops an unique constraint.
     */
    dropUniqueConstraint(tableOrName: Table | string, uniqueOrName: TableUnique | string): Promise<void>;
    /**
     * Drops an unique constraints.
     */
    dropUniqueConstraints(tableOrName: Table | string, uniqueConstraints: TableUnique[]): Promise<void>;
    /**
     * Creates a new check constraint.
     */
    createCheckConstraint(tableOrName: Table | string, checkConstraint: TableCheck): Promise<void>;
    /**
     * Creates a new check constraints.
     */
    createCheckConstraints(tableOrName: Table | string, checkConstraints: TableCheck[]): Promise<void>;
    /**
     * Drops check constraint.
     */
    dropCheckConstraint(tableOrName: Table | string, checkOrName: TableCheck | string): Promise<void>;
    /**
     * Drops check constraints.
     */
    dropCheckConstraints(tableOrName: Table | string, checkConstraints: TableCheck[]): Promise<void>;
    /**
     * Creates a new foreign key. in spanner, it creates corresponding index too
     */
    createForeignKey(tableOrName: Table | string, foreignKey: TableForeignKey): Promise<void>;
    /**
     * Creates a new foreign keys.
     */
    createForeignKeys(tableOrName: Table | string, foreignKeys: TableForeignKey[]): Promise<void>;
    /**
     * Drops a foreign key.
     */
    dropForeignKey(tableOrName: Table | string, foreignKeyOrName: TableForeignKey | string): Promise<void>;
    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKeys(tableOrName: Table | string, foreignKeys: TableForeignKey[]): Promise<void>;
    /**
     * Creates a new index.
     */
    createIndex(tableOrName: Table | string, index: TableIndex): Promise<void>;
    /**
     * Creates a new indices
     */
    createIndices(tableOrName: Table | string, indices: TableIndex[]): Promise<void>;
    /**
     * Drops an index.
     */
    dropIndex(tableOrName: Table | string, indexOrName: TableIndex | string): Promise<void>;
    /**
     * Drops an indices from the table.
     */
    dropIndices(tableOrName: Table | string, indices: TableIndex[]): Promise<void>;
    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    clearTable(tableOrName: Table | string): Promise<void>;
    /**
     * Removes all tables from the currently connected database.
     * Be careful using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    clearDatabase(database?: string): Promise<void>;
    /**
     * create `schemas` table which describe additional column information such as
     * generated column's increment strategy or default value
     * @database: spanner's database object.
     */
    createAndLoadSchemaTable(tableName: string): Promise<SpannerExtendSchemas>;
    /**
     * Synchronizes table extend schema.
     * systemTables means internally used table, such as migrations.
     */
    syncExtendSchemas(metadata: EntityMetadata[]): Promise<SpannerExtendSchemas>;
    /**
     * Creates a new exclusion constraint.
     */
    createExclusionConstraint(table: Table | string, exclusionConstraint: TableExclusion): Promise<void>;
    /**
     * Creates new exclusion constraints.
     */
    createExclusionConstraints(table: Table | string, exclusionConstraints: TableExclusion[]): Promise<void>;
    /**
     * Drops a exclusion constraint.
     */
    dropExclusionConstraint(table: Table | string, exclusionOrName: TableExclusion | string): Promise<void>;
    /**
     * Drops exclusion constraints.
     */
    dropExclusionConstraints(table: Table | string, exclusionConstraints: TableExclusion[]): Promise<void>;
    /**
     * helper for createAndLoadSchemaTable.
     * create schema object from schemas table column
     * @param type
     * @param value
     */
    protected createExtendSchemaObject(table: string, type: string, value: string): SpannerExtendColumnSchema;
    protected verifyAndFillAutoGeneratedValues(table: Table, qem: QueryExpressionMap, insert: boolean): undefined | ObjectLiteral | ObjectLiteral[];
    protected verifyValues(table: Table, qem: QueryExpressionMap): undefined | ObjectLiteral | ObjectLiteral[];
    /**
     * helper for createAndLoadSchemaTable.
     * load formatted object from schema table
     */
    protected loadExtendSchemaTable(tableName: string): Promise<ObjectLiteral[]>;
    /**
     * get query string to examine select/update/upsert/delete keys.
     * null means value contains all key elements already.
     */
    protected examineKeys<Entity>(table: Table, qb: QueryBuilder<Entity>, keysOnly?: boolean): Promise<ObjectLiteral[] | any[] | null>;
    /**
     * wrapper to integrate request by transaction and table
     * connect() should be already called before this function invoked.
     */
    protected request(table: Table, method: "insert" | "update" | "upsert" | "deleteRows", ...args: any[]): Promise<any>;
    /**
     * Handle select query
     */
    protected select<Entity>(qb: QueryBuilder<Entity>): Promise<any>;
    /**
     * Handle insert query
     */
    protected insert<Entity>(qb: QueryBuilder<Entity>): Promise<any>;
    /**
     * Handle update query
     */
    protected update<Entity>(qb: QueryBuilder<Entity>): Promise<any>;
    /**
     * Handle upsert query
     */
    protected upsert<Entity>(qb: QueryBuilder<Entity>): Promise<any>;
    /**
     * Handle delete query
     */
    protected delete<Entity>(qb: QueryBuilder<Entity>): Promise<any>;
    /**
     * unescape table/database name
     */
    protected unescapeName(name: string): string;
    /**
     * convert parsed non-spanner sql to spanner ddl string and extend schema.
     * ast is generated by NearleyParser( = require('nearley').Parser)
     */
    protected toSpannerQueryAndSchema(ddl: string): [string, SpannerExtendSchemaSources, string];
    /**
     * Handle administrative sqls as spanner API call
     */
    protected handleAdministrativeQuery(type: string, m: RegExpMatchArray): Promise<any>;
    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    protected loadTables(tableNames: string[]): Promise<Table[]>;
    /**
     * Builds create table sql
     */
    protected createTableSql(table: Table): string;
    /**
     * Builds drop table sql
     */
    protected dropTableSql(tableOrName: Table | string): string;
    protected dropTableSqlRecursive(tableOrName: Table | string, upQueries: string[], downQueries: string[]): Promise<void>;
    /**
     * Builds create index sql.
     */
    protected createIndexSql(table: Table, index: TableIndex): string;
    /**
     * Builds drop index sql.
     */
    protected dropIndexSql(table: Table, indexOrName: TableIndex | string): string;
    /**
     * Builds create primary key sql.
     */
    protected createPrimaryKeySql(table: Table, columnNames: string[]): string;
    /**
     * Builds drop primary key sql.
     */
    protected dropPrimaryKeySql(table: Table): string;
    /**
     * Builds create foreign key sql.
     */
    protected createForeignKeySql(table: Table, foreignKey: TableForeignKey): string;
    /**
     * Builds drop foreign key sql.
     */
    protected dropForeignKeySql(table: Table, foreignKeyOrName: TableForeignKey | string): string;
    protected parseTableName(target: Table | string): {
        database: string | undefined;
        tableName: string;
    };
    /**
     * Escapes given table name.
     */
    protected escapeTableName(target: Table | string, disableEscape?: boolean): string;
    protected static needColumnOptions(column: TableColumn): boolean;
    protected static isColumnOptionsChanged(oldColumn: TableColumn, newColumn: TableColumn): boolean;
    /**
     * Builds a part of query to set options to a column.
     * because spanner ddl does not allow options to set with usual column alternation.
     * `reverse = true` is used to generate down migration SQL
     */
    protected buildSetColumnOptionsSql(column: TableColumn, settings?: {
        from_create_table?: boolean;
        reverse?: boolean;
    }): string;
    /**
 * Builds a part of query to create/change a column.
 */
    protected buildCreateColumnSql(column: TableColumn, skips: {
        skipPrimary?: boolean;
        skipName?: boolean;
        skipOptions?: boolean;
    }): string;
    protected replaceCachedTable(table: Table, changedTable: Table | null): void;
    protected getSyncExtendSchemaObjects(table: SpannerExtendedTableProps, column: SpannerExtendedColumnProps): {
        add: {
            table: string;
            column: string;
            type: string;
            value: string;
        }[];
        remove: {
            table: string;
            column: string;
            type: string;
        }[];
    };
    protected deleteExtendSchema(table: string, column?: string, type?: string): Promise<void>;
    protected upsertExtendSchema(table: string, column: string, type: string, value: string): Promise<void>;
}
