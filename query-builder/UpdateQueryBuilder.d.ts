import { QueryBuilder } from "./QueryBuilder";
import { ObjectLiteral } from "../common/ObjectLiteral";
import { Connection } from "../connection/Connection";
import { QueryRunner } from "../query-runner/QueryRunner";
import { WhereExpression } from "./WhereExpression";
import { Brackets } from "./Brackets";
import { UpdateResult } from "./result/UpdateResult";
import { OrderByCondition } from "../find-options/OrderByCondition";
/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export declare class UpdateQueryBuilder<Entity> extends QueryBuilder<Entity> implements WhereExpression {
    constructor(connectionOrQueryBuilder: Connection | QueryBuilder<any>, queryRunner?: QueryRunner);
    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string;
    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    execute(): Promise<UpdateResult>;
    /**
     * Values needs to be updated.
     */
    set(values: ObjectLiteral): this;
    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    where(where: string | ((qb: this) => string) | Brackets | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this;
    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andWhere(where: string | ((qb: this) => string) | Brackets, parameters?: ObjectLiteral): this;
    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orWhere(where: string | ((qb: this) => string) | Brackets, parameters?: ObjectLiteral): this;
    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    whereInIds(ids: any | any[]): this;
    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    andWhereInIds(ids: any | any[]): this;
    /**
     * Adds new OR WHERE with conditions for the given ids.
     */
    orWhereInIds(ids: any | any[]): this;
    /**
     * Optional returning/output clause.
     * This will return given column values.
     */
    output(columns: string[]): this;
    /**
     * Optional returning/output clause.
     * Returning is a SQL string containing returning statement.
     */
    output(output: string): this;
    /**
     * Optional returning/output clause.
     */
    output(output: string | string[]): this;
    /**
     * Optional returning/output clause.
     * This will return given column values.
     */
    returning(columns: string[]): this;
    /**
     * Optional returning/output clause.
     * Returning is a SQL string containing returning statement.
     */
    returning(returning: string): this;
    /**
     * Optional returning/output clause.
     */
    returning(returning: string | string[]): this;
    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     *
     * Calling order by without order set will remove all previously set order bys.
     */
    orderBy(): this;
    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    orderBy(sort: string, order?: "ASC" | "DESC", nulls?: "NULLS FIRST" | "NULLS LAST"): this;
    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    orderBy(order: OrderByCondition): this;
    /**
     * Adds ORDER BY condition in the query builder.
     */
    addOrderBy(sort: string, order?: "ASC" | "DESC", nulls?: "NULLS FIRST" | "NULLS LAST"): this;
    /**
     * Sets LIMIT - maximum number of rows to be selected.
     */
    limit(limit?: number): this;
    /**
     * Indicates if entity must be updated after update operation.
     * This may produce extra query or use RETURNING / OUTPUT statement (depend on database).
     * Enabled by default.
     */
    whereEntity(entity: Entity | Entity[]): this;
    /**
     * Indicates if entity must be updated after update operation.
     * This may produce extra query or use RETURNING / OUTPUT statement (depend on database).
     * Enabled by default.
     */
    updateEntity(enabled: boolean): this;
    /**
     * Creates UPDATE express used to perform insert query.
     */
    protected createUpdateExpression(): string;
    /**
     * Creates "ORDER BY" part of SQL query.
     */
    protected createOrderByExpression(): string;
    /**
     * Creates "LIMIT" parts of SQL query.
     */
    protected createLimitExpression(): string;
    /**
     * Gets array of values need to be inserted into the target table.
     */
    protected getValueSet(): ObjectLiteral;
}
