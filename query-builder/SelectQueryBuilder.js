"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var FindOptionsUtils_1 = require("../find-options/FindOptionsUtils");
var ObserverExecutor_1 = require("../observer/ObserverExecutor");
var QueryBuilderUtils_1 = require("./QueryBuilderUtils");
var RawSqlResultsToEntityTransformer_1 = require("./transformer/RawSqlResultsToEntityTransformer");
var SqlServerDriver_1 = require("../driver/sqlserver/SqlServerDriver");
var PessimisticLockTransactionRequiredError_1 = require("../error/PessimisticLockTransactionRequiredError");
var NoVersionOrUpdateDateColumnError_1 = require("../error/NoVersionOrUpdateDateColumnError");
var OptimisticLockVersionMismatchError_1 = require("../error/OptimisticLockVersionMismatchError");
var OptimisticLockCanNotBeUsedError_1 = require("../error/OptimisticLockCanNotBeUsedError");
var JoinAttribute_1 = require("./JoinAttribute");
var RelationIdAttribute_1 = require("./relation-id/RelationIdAttribute");
var RelationCountAttribute_1 = require("./relation-count/RelationCountAttribute");
var RelationIdLoader_1 = require("./relation-id/RelationIdLoader");
var RelationIdMetadataToAttributeTransformer_1 = require("./relation-id/RelationIdMetadataToAttributeTransformer");
var RelationCountLoader_1 = require("./relation-count/RelationCountLoader");
var RelationCountMetadataToAttributeTransformer_1 = require("./relation-count/RelationCountMetadataToAttributeTransformer");
var QueryBuilder_1 = require("./QueryBuilder");
var LockNotSupportedOnGivenDriverError_1 = require("../error/LockNotSupportedOnGivenDriverError");
var MysqlDriver_1 = require("../driver/mysql/MysqlDriver");
var PostgresDriver_1 = require("../driver/postgres/PostgresDriver");
var OracleDriver_1 = require("../driver/oracle/OracleDriver");
var Brackets_1 = require("./Brackets");
var AbstractSqliteDriver_1 = require("../driver/sqlite-abstract/AbstractSqliteDriver");
var OffsetWithoutLimitNotSupportedError_1 = require("../error/OffsetWithoutLimitNotSupportedError");
var BroadcasterResult_1 = require("../subscriber/BroadcasterResult");
var FindCriteriaNotFoundError_1 = require("../error/FindCriteriaNotFoundError");
var FindOperator_1 = require("../find-options/FindOperator");
var OrmUtils_1 = require("../util/OrmUtils");
var ObjectUtils_1 = require("../util/ObjectUtils");
var DriverUtils_1 = require("../driver/DriverUtils");
/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
var SelectQueryBuilder = /** @class */ (function (_super) {
    tslib_1.__extends(SelectQueryBuilder, _super);
    function SelectQueryBuilder() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.findOptions = {};
        _this.selects = [];
        _this.joins = [];
        _this.conditions = "";
        _this.orderBys = [];
        _this.relationMetadatas = [];
        return _this;
    }
    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------
    /**
     * Gets generated sql query without parameters being replaced.
     */
    SelectQueryBuilder.prototype.getQuery = function () {
        var sql = this.createSelectExpression();
        sql += this.createJoinExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        sql += this.createOrderByExpression();
        sql += this.createLimitOffsetExpression();
        sql += this.createLockExpression();
        sql = sql.trim();
        if (this.expressionMap.subQuery)
            sql = "(" + sql + ")";
        return sql;
    };
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a subquery - query that can be used inside other queries.
     */
    SelectQueryBuilder.prototype.subQuery = function () {
        var qb = this.createQueryBuilder();
        qb.expressionMap.subQuery = true;
        qb.expressionMap.parentQueryBuilder = this;
        return qb;
    };
    SelectQueryBuilder.prototype.setFindOptions = function (findOptions) {
        this.findOptions = FindOptionsUtils_1.normalizeFindOptions(findOptions);
        return this;
    };
    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    SelectQueryBuilder.prototype.select = function (selection, selectionAliasName) {
        this.expressionMap.queryType = "select";
        if (selection instanceof Array) {
            this.expressionMap.selects = selection.map(function (selection) { return ({ selection: selection }); });
        }
        else if (selection instanceof Function) {
            var subQueryBuilder = selection(this.subQuery());
            this.setParameters(subQueryBuilder.getParameters());
            this.expressionMap.selects.push({ selection: subQueryBuilder.getQuery(), aliasName: selectionAliasName });
        }
        else if (selection && typeof selection === "object") {
            this.findOptions.select = selection;
        }
        else if (selection) {
            this.expressionMap.selects = [{ selection: selection, aliasName: selectionAliasName }];
        }
        return this;
    };
    /**
     * Adds new selection to the SELECT query.
     */
    SelectQueryBuilder.prototype.addSelect = function (selection, selectionAliasName) {
        if (!selection)
            return this;
        if (selection instanceof Array) {
            this.expressionMap.selects = this.expressionMap.selects.concat(selection.map(function (selection) { return ({ selection: selection }); }));
        }
        else if (selection instanceof Function) {
            var subQueryBuilder = selection(this.subQuery());
            this.setParameters(subQueryBuilder.getParameters());
            this.expressionMap.selects.push({ selection: subQueryBuilder.getQuery(), aliasName: selectionAliasName });
        }
        else if (selection && typeof selection === "object") {
            this.findOptions.select = Object.assign(this.findOptions.select, selection);
        }
        else if (selection) {
            this.expressionMap.selects.push({ selection: selection, aliasName: selectionAliasName });
        }
        return this;
    };
    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     * Removes all previously set from-s.
     */
    SelectQueryBuilder.prototype.from = function (entityTarget, aliasName) {
        var mainAlias = this.createFromAlias(entityTarget, aliasName);
        this.expressionMap.setMainAlias(mainAlias);
        return this;
    };
    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    SelectQueryBuilder.prototype.addFrom = function (entityTarget, aliasName) {
        var alias = this.createFromAlias(entityTarget, aliasName);
        if (!this.expressionMap.mainAlias)
            this.expressionMap.setMainAlias(alias);
        return this;
    };
    /**
     * INNER JOINs (without selection).
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.innerJoin = function (entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.join("INNER", entityOrProperty, alias, condition, parameters);
        return this;
    };
    /**
     * LEFT JOINs (without selection).
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.leftJoin = function (entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.join("LEFT", entityOrProperty, alias, condition, parameters);
        return this;
    };
    /**
     * INNER JOINs and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.innerJoinAndSelect = function (entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.addSelect(alias);
        this.innerJoin(entityOrProperty, alias, condition, parameters);
        return this;
    };
    /**
     * LEFT JOINs and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.leftJoinAndSelect = function (entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.addSelect(alias);
        this.leftJoin(entityOrProperty, alias, condition, parameters);
        return this;
    };
    /**
     * INNER JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.innerJoinAndMapMany = function (mapToProperty, entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.addSelect(alias);
        this.join("INNER", entityOrProperty, alias, condition, parameters, mapToProperty, true);
        return this;
    };
    /**
     * INNER JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.innerJoinAndMapOne = function (mapToProperty, entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.addSelect(alias);
        this.join("INNER", entityOrProperty, alias, condition, parameters, mapToProperty, false);
        return this;
    };
    /**
     * LEFT JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.leftJoinAndMapMany = function (mapToProperty, entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.addSelect(alias);
        this.join("LEFT", entityOrProperty, alias, condition, parameters, mapToProperty, true);
        return this;
    };
    /**
     * LEFT JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.leftJoinAndMapOne = function (mapToProperty, entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.addSelect(alias);
        this.join("LEFT", entityOrProperty, alias, condition, parameters, mapToProperty, false);
        return this;
    };
    /**
     * LEFT JOINs relation id and maps it into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.loadRelationIdAndMap = function (mapToProperty, relationName, aliasNameOrOptions, queryBuilderFactory) {
        var relationIdAttribute = new RelationIdAttribute_1.RelationIdAttribute(this.expressionMap);
        relationIdAttribute.mapToProperty = mapToProperty;
        relationIdAttribute.relationName = relationName;
        if (typeof aliasNameOrOptions === "string")
            relationIdAttribute.alias = aliasNameOrOptions;
        if (aliasNameOrOptions instanceof Object && aliasNameOrOptions.disableMixedMap)
            relationIdAttribute.disableMixedMap = true;
        relationIdAttribute.queryBuilderFactory = queryBuilderFactory;
        this.expressionMap.relationIdAttributes.push(relationIdAttribute);
        if (relationIdAttribute.relation.junctionEntityMetadata) {
            this.expressionMap.createAlias({
                type: "other",
                name: relationIdAttribute.junctionAlias,
                metadata: relationIdAttribute.relation.junctionEntityMetadata
            });
        }
        return this;
    };
    /**
     * Counts number of entities of entity's relation and maps the value into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.loadRelationCountAndMap = function (mapToProperty, relationName, aliasName, queryBuilderFactory) {
        var relationCountAttribute = new RelationCountAttribute_1.RelationCountAttribute(this.expressionMap);
        relationCountAttribute.mapToProperty = mapToProperty;
        relationCountAttribute.relationName = relationName;
        relationCountAttribute.alias = aliasName;
        relationCountAttribute.queryBuilderFactory = queryBuilderFactory;
        this.expressionMap.relationCountAttributes.push(relationCountAttribute);
        this.expressionMap.createAlias({
            type: "other",
            name: relationCountAttribute.junctionAlias
        });
        if (relationCountAttribute.relation.junctionEntityMetadata) {
            this.expressionMap.createAlias({
                type: "other",
                name: relationCountAttribute.junctionAlias,
                metadata: relationCountAttribute.relation.junctionEntityMetadata
            });
        }
        return this;
    };
    /**
     * Loads all relation ids for all relations of the selected entity.
     * All relation ids will be mapped to relation property themself.
     * If array of strings is given then loads only relation ids of the given properties.
     */
    SelectQueryBuilder.prototype.loadAllRelationIds = function (options) {
        var _this = this;
        this.expressionMap.mainAlias.metadata.relations.forEach(function (relation) {
            if (options !== undefined && options.relations !== undefined && options.relations.indexOf(relation.propertyPath) === -1)
                return;
            _this.loadRelationIdAndMap(_this.expressionMap.mainAlias.name + "." + relation.propertyPath, _this.expressionMap.mainAlias.name + "." + relation.propertyPath, options);
        });
        return this;
    };
    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    SelectQueryBuilder.prototype.where = function (where, parameters) {
        this.expressionMap.wheres = []; // don't move this block below since computeWhereParameter can add where expressions
        if (where && typeof where === "object" && !(where instanceof Brackets_1.Brackets)) {
            this.findOptions.where = where;
        }
        else {
            var condition = this.computeWhereParameter(where);
            if (condition)
                this.expressionMap.wheres = [{ type: "simple", condition: condition }];
        }
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    SelectQueryBuilder.prototype.andWhere = function (where, parameters) {
        if (where && typeof where === "object" && !(where instanceof Brackets_1.Brackets)) {
            this.findOptions.where = where; // todo: implement "AND"
        }
        else {
            this.expressionMap.wheres.push({ type: "and", condition: this.computeWhereParameter(where) });
        }
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    SelectQueryBuilder.prototype.orWhere = function (where, parameters) {
        if (where && typeof where === "object" && !(where instanceof Brackets_1.Brackets)) {
            this.findOptions.where = where; // todo: implement "OR"
        }
        else {
            this.expressionMap.wheres.push({ type: "or", condition: this.computeWhereParameter(where) });
        }
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new AND WHERE with conditions for the given ids.
     *
     * Ids are mixed.
     * It means if you have single primary key you can pass a simple id values, for example [1, 2, 3].
     * If you have multiple primary keys you need to pass object with property names and values specified,
     * for example [{ firstId: 1, secondId: 2 }, { firstId: 2, secondId: 3 }, ...]
     */
    SelectQueryBuilder.prototype.whereInIds = function (ids) {
        return this.where(this.createWhereIdsExpression(ids));
    };
    /**
     * Adds new AND WHERE with conditions for the given ids.
     *
     * Ids are mixed.
     * It means if you have single primary key you can pass a simple id values, for example [1, 2, 3].
     * If you have multiple primary keys you need to pass object with property names and values specified,
     * for example [{ firstId: 1, secondId: 2 }, { firstId: 2, secondId: 3 }, ...]
     */
    SelectQueryBuilder.prototype.andWhereInIds = function (ids) {
        return this.andWhere(this.createWhereIdsExpression(ids));
    };
    /**
     * Adds new OR WHERE with conditions for the given ids.
     *
     * Ids are mixed.
     * It means if you have single primary key you can pass a simple id values, for example [1, 2, 3].
     * If you have multiple primary keys you need to pass object with property names and values specified,
     * for example [{ firstId: 1, secondId: 2 }, { firstId: 2, secondId: 3 }, ...]
     */
    SelectQueryBuilder.prototype.orWhereInIds = function (ids) {
        return this.orWhere(this.createWhereIdsExpression(ids));
    };
    /**
     * Sets HAVING condition in the query builder.
     * If you had previously HAVING expression defined,
     * calling this function will override previously set HAVING conditions.
     * Additionally you can add parameters used in where expression.
     */
    SelectQueryBuilder.prototype.having = function (having, parameters) {
        this.expressionMap.havings.push({ type: "simple", condition: having });
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new AND HAVING condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    SelectQueryBuilder.prototype.andHaving = function (having, parameters) {
        this.expressionMap.havings.push({ type: "and", condition: having });
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new OR HAVING condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    SelectQueryBuilder.prototype.orHaving = function (having, parameters) {
        this.expressionMap.havings.push({ type: "or", condition: having });
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Sets GROUP BY condition in the query builder.
     * If you had previously GROUP BY expression defined,
     * calling this function will override previously set GROUP BY conditions.
     */
    SelectQueryBuilder.prototype.groupBy = function (groupBy) {
        if (groupBy) {
            this.expressionMap.groupBys = [groupBy];
        }
        else {
            this.expressionMap.groupBys = [];
        }
        return this;
    };
    /**
     * Adds GROUP BY condition in the query builder.
     */
    SelectQueryBuilder.prototype.addGroupBy = function (groupBy) {
        this.expressionMap.groupBys.push(groupBy);
        return this;
    };
    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    SelectQueryBuilder.prototype.orderBy = function (sort, order, nulls) {
        var _a, _b;
        if (order === void 0) { order = "ASC"; }
        if (order !== undefined && order !== "ASC" && order !== "DESC")
            throw new Error("SelectQueryBuilder.addOrderBy \"order\" can accept only \"ASC\" and \"DESC\" values.");
        if (nulls !== undefined && nulls !== "NULLS FIRST" && nulls !== "NULLS LAST")
            throw new Error("SelectQueryBuilder.addOrderBy \"nulls\" can accept only \"NULLS FIRST\" and \"NULLS LAST\" values.");
        if (sort) {
            if (sort instanceof Object) {
                this.expressionMap.orderBys = sort;
            }
            else {
                if (nulls) {
                    this.expressionMap.orderBys = (_a = {}, _a[sort] = { order: order, nulls: nulls }, _a);
                }
                else {
                    this.expressionMap.orderBys = (_b = {}, _b[sort] = order, _b);
                }
            }
        }
        else {
            this.expressionMap.orderBys = {};
        }
        return this;
    };
    /**
     * Adds ORDER BY condition in the query builder.
     */
    SelectQueryBuilder.prototype.addOrderBy = function (sort, order, nulls) {
        if (order === void 0) { order = "ASC"; }
        if (order !== undefined && order !== "ASC" && order !== "DESC")
            throw new Error("SelectQueryBuilder.addOrderBy \"order\" can accept only \"ASC\" and \"DESC\" values.");
        if (nulls !== undefined && nulls !== "NULLS FIRST" && nulls !== "NULLS LAST")
            throw new Error("SelectQueryBuilder.addOrderBy \"nulls\" can accept only \"NULLS FIRST\" and \"NULLS LAST\" values.");
        if (nulls) {
            this.expressionMap.orderBys[sort] = { order: order, nulls: nulls };
        }
        else {
            this.expressionMap.orderBys[sort] = order;
        }
        return this;
    };
    /**
     * Set's LIMIT - maximum number of rows to be selected.
     * NOTE that it may not work as you expect if you are using joins.
     * If you want to implement pagination, and you are having join in your query,
     * then use instead take method instead.
     */
    SelectQueryBuilder.prototype.limit = function (limit) {
        this.expressionMap.limit = this.normalizeNumber(limit);
        if (this.expressionMap.limit !== undefined && isNaN(this.expressionMap.limit))
            throw new Error("Provided \"limit\" value is not a number. Please provide a numeric value.");
        return this;
    };
    /**
     * Set's OFFSET - selection offset.
     * NOTE that it may not work as you expect if you are using joins.
     * If you want to implement pagination, and you are having join in your query,
     * then use instead skip method instead.
     */
    SelectQueryBuilder.prototype.offset = function (offset) {
        this.expressionMap.offset = this.normalizeNumber(offset);
        if (this.expressionMap.offset !== undefined && isNaN(this.expressionMap.offset))
            throw new Error("Provided \"offset\" value is not a number. Please provide a numeric value.");
        return this;
    };
    /**
     * Sets maximal number of entities to take.
     */
    SelectQueryBuilder.prototype.take = function (take) {
        this.expressionMap.take = this.normalizeNumber(take);
        if (this.expressionMap.take !== undefined && isNaN(this.expressionMap.take))
            throw new Error("Provided \"take\" value is not a number. Please provide a numeric value.");
        return this;
    };
    /**
     * Sets number of entities to skip.
     */
    SelectQueryBuilder.prototype.skip = function (skip) {
        this.expressionMap.skip = this.normalizeNumber(skip);
        if (this.expressionMap.skip !== undefined && isNaN(this.expressionMap.skip))
            throw new Error("Provided \"skip\" value is not a number. Please provide a numeric value.");
        return this;
    };
    /**
     * Sets locking mode.
     */
    SelectQueryBuilder.prototype.setLock = function (lockMode, lockVersion) {
        this.expressionMap.lockMode = lockMode;
        this.expressionMap.lockVersion = lockVersion;
        return this;
    };
    /**
     * Gets first raw result returned by execution of generated query builder sql.
     */
    SelectQueryBuilder.prototype.getRawOne = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRawMany()];
                    case 1: return [2 /*return*/, (_a.sent())[0]];
                }
            });
        });
    };
    /**
     * Gets all raw results returned by execution of generated query builder sql.
     */
    SelectQueryBuilder.prototype.getRawMany = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, transactionStartedByUs, results, error_1, rollbackError_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.expressionMap.lockMode === "optimistic")
                            throw new OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError();
                        this.expressionMap.queryEntity = false;
                        queryRunner = this.obtainQueryRunner();
                        transactionStartedByUs = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, 13, 16]);
                        if (!(this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 2:
                        _a.sent();
                        transactionStartedByUs = true;
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.loadRawResults(queryRunner)];
                    case 4:
                        results = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 7];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 5:
                        _a.sent();
                        if (!this.expressionMap.callObservers) return [3 /*break*/, 7];
                        return [4 /*yield*/, new ObserverExecutor_1.ObserverExecutor(this.connection.observers).execute()];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [2 /*return*/, results];
                    case 8:
                        error_1 = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 12];
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 10:
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        rollbackError_1 = _a.sent();
                        return [3 /*break*/, 12];
                    case 12: throw error_1;
                    case 13:
                        if (!(queryRunner !== this.queryRunner)) return [3 /*break*/, 15];
                        return [4 /*yield*/, queryRunner.release()];
                    case 14:
                        _a.sent();
                        _a.label = 15;
                    case 15: return [7 /*endfinally*/];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes sql generated by query builder and returns object with raw results and entities created from them.
     */
    SelectQueryBuilder.prototype.getRawAndEntities = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, transactionStartedByUs, results, error_2, rollbackError_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = this.obtainQueryRunner();
                        transactionStartedByUs = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, 13, 16]);
                        if (!(this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 2:
                        _a.sent();
                        transactionStartedByUs = true;
                        _a.label = 3;
                    case 3:
                        this.expressionMap.queryEntity = true;
                        this.applyFindOptions();
                        return [4 /*yield*/, this.executeEntitiesAndRawResults(queryRunner)];
                    case 4:
                        results = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 7];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 5:
                        _a.sent();
                        if (!this.expressionMap.callObservers) return [3 /*break*/, 7];
                        return [4 /*yield*/, new ObserverExecutor_1.ObserverExecutor(this.connection.observers).execute()];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [2 /*return*/, results];
                    case 8:
                        error_2 = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 12];
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 10:
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        rollbackError_2 = _a.sent();
                        return [3 /*break*/, 12];
                    case 12: throw error_2;
                    case 13:
                        if (!(queryRunner !== this.queryRunner)) return [3 /*break*/, 15];
                        return [4 /*yield*/, queryRunner.release()];
                    case 14:
                        _a.sent();
                        _a.label = 15;
                    case 15: return [7 /*endfinally*/];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets single entity returned by execution of generated query builder sql.
     */
    SelectQueryBuilder.prototype.getOne = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var results, result, metadata, actualVersion, actualVersion;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRawAndEntities()];
                    case 1:
                        results = _a.sent();
                        result = results.entities[0];
                        if (result && this.expressionMap.lockMode === "optimistic" && this.expressionMap.lockVersion) {
                            metadata = this.expressionMap.mainAlias.metadata;
                            if (this.expressionMap.lockVersion instanceof Date) {
                                actualVersion = metadata.updateDateColumn.getEntityValue(result);
                                if (actualVersion.getTime() !== this.expressionMap.lockVersion.getTime())
                                    throw new OptimisticLockVersionMismatchError_1.OptimisticLockVersionMismatchError(metadata.name, this.expressionMap.lockVersion, actualVersion);
                            }
                            else {
                                actualVersion = metadata.versionColumn.getEntityValue(result);
                                if (actualVersion !== this.expressionMap.lockVersion)
                                    throw new OptimisticLockVersionMismatchError_1.OptimisticLockVersionMismatchError(metadata.name, this.expressionMap.lockVersion, actualVersion);
                            }
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Gets entities returned by execution of generated query builder sql.
     */
    SelectQueryBuilder.prototype.getMany = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var results;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.expressionMap.lockMode === "optimistic")
                            throw new OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError();
                        return [4 /*yield*/, this.getRawAndEntities()];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.entities];
                }
            });
        });
    };
    /**
     * Gets count - number of entities selected by sql generated by this query builder.
     * Count excludes all limitations set by setFirstResult and setMaxResults methods call.
     */
    SelectQueryBuilder.prototype.getCount = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, transactionStartedByUs, results, error_3, rollbackError_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.expressionMap.lockMode === "optimistic")
                            throw new OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError();
                        queryRunner = this.obtainQueryRunner();
                        transactionStartedByUs = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, 13, 16]);
                        if (!(this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 2:
                        _a.sent();
                        transactionStartedByUs = true;
                        _a.label = 3;
                    case 3:
                        this.expressionMap.queryEntity = false;
                        this.applyFindOptions();
                        return [4 /*yield*/, this.executeCountQuery(queryRunner)];
                    case 4:
                        results = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 7];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 5:
                        _a.sent();
                        if (!this.expressionMap.callObservers) return [3 /*break*/, 7];
                        return [4 /*yield*/, new ObserverExecutor_1.ObserverExecutor(this.connection.observers).execute()];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [2 /*return*/, results];
                    case 8:
                        error_3 = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 12];
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 10:
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        rollbackError_3 = _a.sent();
                        return [3 /*break*/, 12];
                    case 12: throw error_3;
                    case 13:
                        if (!(queryRunner !== this.queryRunner)) return [3 /*break*/, 15];
                        return [4 /*yield*/, queryRunner.release()];
                    case 14:
                        _a.sent();
                        _a.label = 15;
                    case 15: return [7 /*endfinally*/];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes built SQL query and returns entities and overall entities count (without limitation).
     * This method is useful to build pagination.
     */
    SelectQueryBuilder.prototype.getManyAndCount = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, transactionStartedByUs, entitiesAndRaw, count, results, error_4, rollbackError_4;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.expressionMap.lockMode === "optimistic")
                            throw new OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError();
                        queryRunner = this.obtainQueryRunner();
                        transactionStartedByUs = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, 14, 17]);
                        if (!(this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 2:
                        _a.sent();
                        transactionStartedByUs = true;
                        _a.label = 3;
                    case 3:
                        this.applyFindOptions();
                        this.expressionMap.queryEntity = true;
                        return [4 /*yield*/, this.executeEntitiesAndRawResults(queryRunner)];
                    case 4:
                        entitiesAndRaw = _a.sent();
                        this.expressionMap.queryEntity = false;
                        return [4 /*yield*/, this.executeCountQuery(queryRunner)];
                    case 5:
                        count = _a.sent();
                        results = [entitiesAndRaw.entities, count];
                        if (!transactionStartedByUs) return [3 /*break*/, 8];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 6:
                        _a.sent();
                        if (!this.expressionMap.callObservers) return [3 /*break*/, 8];
                        return [4 /*yield*/, new ObserverExecutor_1.ObserverExecutor(this.connection.observers).execute()];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [2 /*return*/, results];
                    case 9:
                        error_4 = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 13];
                        _a.label = 10;
                    case 10:
                        _a.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 11:
                        _a.sent();
                        return [3 /*break*/, 13];
                    case 12:
                        rollbackError_4 = _a.sent();
                        return [3 /*break*/, 13];
                    case 13: throw error_4;
                    case 14:
                        if (!(queryRunner !== this.queryRunner)) return [3 /*break*/, 16];
                        return [4 /*yield*/, queryRunner.release()];
                    case 15:
                        _a.sent();
                        _a.label = 16;
                    case 16: return [7 /*endfinally*/];
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes built SQL query and returns raw data stream.
     */
    SelectQueryBuilder.prototype.stream = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, sql, parameters, queryRunner, transactionStartedByUs, releaseFn, results, error_5, rollbackError_5;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.expressionMap.queryEntity = false;
                        _a = tslib_1.__read(this.getQueryAndParameters(), 2), sql = _a[0], parameters = _a[1];
                        queryRunner = this.obtainQueryRunner();
                        transactionStartedByUs = false;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 12, 15]);
                        if (!(this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 2:
                        _b.sent();
                        transactionStartedByUs = true;
                        _b.label = 3;
                    case 3:
                        releaseFn = function () {
                            if (queryRunner !== _this.queryRunner) // means we created our own query runner
                                return queryRunner.release();
                            return;
                        };
                        results = queryRunner.stream(sql, parameters, releaseFn, releaseFn);
                        if (!transactionStartedByUs) return [3 /*break*/, 6];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 4:
                        _b.sent();
                        if (!this.expressionMap.callObservers) return [3 /*break*/, 6];
                        return [4 /*yield*/, new ObserverExecutor_1.ObserverExecutor(this.connection.observers).execute()];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6: return [2 /*return*/, results];
                    case 7:
                        error_5 = _b.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 11];
                        _b.label = 8;
                    case 8:
                        _b.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 9:
                        _b.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        rollbackError_5 = _b.sent();
                        return [3 /*break*/, 11];
                    case 11: throw error_5;
                    case 12:
                        if (!(queryRunner !== this.queryRunner)) return [3 /*break*/, 14];
                        return [4 /*yield*/, queryRunner.release()];
                    case 13:
                        _b.sent();
                        _b.label = 14;
                    case 14: return [7 /*endfinally*/];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Enables or disables query result caching.
     */
    SelectQueryBuilder.prototype.cache = function (enabledOrMillisecondsOrId, maybeMilliseconds) {
        if (typeof enabledOrMillisecondsOrId === "boolean") {
            this.expressionMap.cache = enabledOrMillisecondsOrId;
        }
        else if (typeof enabledOrMillisecondsOrId === "number") {
            this.expressionMap.cache = true;
            this.expressionMap.cacheDuration = enabledOrMillisecondsOrId;
        }
        else if (typeof enabledOrMillisecondsOrId === "string" || typeof enabledOrMillisecondsOrId === "number") {
            this.expressionMap.cache = true;
            this.expressionMap.cacheId = enabledOrMillisecondsOrId;
        }
        if (maybeMilliseconds) {
            this.expressionMap.cacheDuration = maybeMilliseconds;
        }
        return this;
    };
    /**
     * Sets extra options that can be used to configure how query builder works.
     */
    SelectQueryBuilder.prototype.setOption = function (option) {
        this.expressionMap.options.push(option);
        return this;
    };
    /**
     * Disables eager relations.
     */
    SelectQueryBuilder.prototype.disableEagerRelations = function (disabled) {
        if (disabled === void 0) { disabled = true; }
        this.expressionMap.eagerRelations = disabled === true ? false : true;
        return this;
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    SelectQueryBuilder.prototype.join = function (direction, entityOrProperty, aliasName, condition, parameters, mapToProperty, isMappingMany) {
        this.setParameters(parameters || {});
        var joinAttribute = new JoinAttribute_1.JoinAttribute(this.connection, this.expressionMap);
        joinAttribute.direction = direction;
        joinAttribute.mapToProperty = mapToProperty;
        joinAttribute.isMappingMany = isMappingMany;
        joinAttribute.entityOrProperty = entityOrProperty; // relationName
        joinAttribute.condition = condition; // joinInverseSideCondition
        // joinAttribute.junctionAlias = joinAttribute.relation.isOwning ? parentAlias + "_" + destinationTableAlias : destinationTableAlias + "_" + parentAlias;
        this.expressionMap.joinAttributes.push(joinAttribute);
        if (joinAttribute.metadata) {
            // todo: find and set metadata right there?
            joinAttribute.alias = this.expressionMap.createAlias({
                type: "join",
                name: aliasName,
                metadata: joinAttribute.metadata
            });
            if (joinAttribute.relation && joinAttribute.relation.junctionEntityMetadata) {
                this.expressionMap.createAlias({
                    type: "join",
                    name: joinAttribute.junctionAlias,
                    metadata: joinAttribute.relation.junctionEntityMetadata
                });
            }
        }
        else {
            var subQuery = "";
            if (entityOrProperty instanceof Function) {
                var subQueryBuilder = entityOrProperty(this.subQuery());
                this.setParameters(subQueryBuilder.getParameters());
                subQuery = subQueryBuilder.getQuery();
            }
            else {
                subQuery = entityOrProperty;
            }
            var isSubQuery = entityOrProperty instanceof Function || entityOrProperty.substr(0, 1) === "(" && entityOrProperty.substr(-1) === ")";
            joinAttribute.alias = this.expressionMap.createAlias({
                type: "join",
                name: aliasName,
                tablePath: isSubQuery === false ? entityOrProperty : undefined,
                subQuery: isSubQuery === true ? subQuery : undefined,
            });
        }
    };
    /**
     * Creates "SELECT FROM" part of SQL query.
     */
    SelectQueryBuilder.prototype.createSelectExpression = function () {
        var _this = this;
        if (!this.expressionMap.mainAlias)
            throw new Error("Cannot build query because main alias is not set (call qb#from method)");
        // todo throw exception if selects or from is missing
        var allSelects = [];
        var excludedSelects = [];
        if (this.expressionMap.mainAlias.hasMetadata) {
            var metadata = this.expressionMap.mainAlias.metadata;
            allSelects.push.apply(allSelects, tslib_1.__spread(this.buildEscapedEntityColumnSelects(this.expressionMap.mainAlias.name, metadata)));
            excludedSelects.push.apply(excludedSelects, tslib_1.__spread(this.findEntityColumnSelects(this.expressionMap.mainAlias.name, metadata)));
        }
        // add selects from joins
        this.expressionMap.joinAttributes
            .forEach(function (join) {
            if (join.metadata) {
                allSelects.push.apply(allSelects, tslib_1.__spread(_this.buildEscapedEntityColumnSelects(join.alias.name, join.metadata)));
                excludedSelects.push.apply(excludedSelects, tslib_1.__spread(_this.findEntityColumnSelects(join.alias.name, join.metadata)));
            }
            else {
                var hasMainAlias = _this.expressionMap.selects.some(function (select) { return select.selection === join.alias.name; });
                if (hasMainAlias) {
                    allSelects.push({ selection: _this.escape(join.alias.name) + ".*" });
                    var excludedSelect = _this.expressionMap.selects.find(function (select) { return select.selection === join.alias.name; });
                    excludedSelects.push(excludedSelect);
                }
            }
        });
        // add all other selects
        this.expressionMap.selects
            .filter(function (select) { return excludedSelects.indexOf(select) === -1; })
            .forEach(function (select) { return allSelects.push({ selection: _this.replacePropertyNames(select.selection), aliasName: select.aliasName }); });
        // if still selection is empty, then simply set it to all (*)
        if (allSelects.length === 0)
            allSelects.push({ selection: "*" });
        var lock = "";
        if (this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
            switch (this.expressionMap.lockMode) {
                case "pessimistic_read":
                    lock = " WITH (HOLDLOCK, ROWLOCK)";
                    break;
                case "pessimistic_write":
                    lock = " WITH (UPDLOCK, ROWLOCK)";
                    break;
            }
        }
        // create a selection query
        var froms = this.expressionMap.aliases
            .filter(function (alias) { return alias.type === "from" && (alias.tablePath || alias.subQuery); })
            .map(function (alias) {
            if (alias.subQuery)
                return alias.subQuery + " " + _this.escape(alias.name);
            return _this.getTableName(alias.tablePath) + " " + _this.escape(alias.name);
        });
        var selection = allSelects.map(function (select) { return select.selection + (select.aliasName ? " AS " + _this.escape(select.aliasName) : ""); }).join(", ");
        return "SELECT " + selection + " FROM " + froms.join(", ") + lock;
    };
    /**
     * Creates "JOIN" part of SQL query.
     */
    SelectQueryBuilder.prototype.createJoinExpression = function () {
        // examples:
        // select from owning side
        // qb.select("post")
        //     .leftJoinAndSelect("post.category", "category");
        // select from non-owning side
        // qb.select("category")
        //     .leftJoinAndSelect("category.post", "post");
        var _this = this;
        var joins = this.expressionMap.joinAttributes.map(function (joinAttr) {
            var relation = joinAttr.relation;
            var destinationTableName = joinAttr.tablePath;
            var destinationTableAlias = joinAttr.alias.name;
            var appendedCondition = joinAttr.condition ? " AND (" + joinAttr.condition + ")" : "";
            var parentAlias = joinAttr.parentAlias;
            // if join was build without relation (e.g. without "post.category") then it means that we have direct
            // table to join, without junction table involved. This means we simply join direct table.
            if (!parentAlias || !relation) {
                var destinationJoin = joinAttr.alias.subQuery ? joinAttr.alias.subQuery : _this.getTableName(destinationTableName);
                return " " + joinAttr.direction + " JOIN " + destinationJoin + " " + _this.escape(destinationTableAlias) +
                    (joinAttr.condition ? " ON " + _this.replacePropertyNames(joinAttr.condition) : "");
            }
            // if real entity relation is involved
            if (relation.isManyToOne || relation.isOneToOneOwner) {
                // JOIN `category` `category` ON `category`.`id` = `post`.`categoryId`
                var condition = relation.joinColumns.map(function (joinColumn) {
                    return destinationTableAlias + "." + joinColumn.referencedColumn.propertyPath + "=" +
                        parentAlias + "." + relation.propertyPath + "." + joinColumn.referencedColumn.propertyPath;
                }).join(" AND ");
                return " " + joinAttr.direction + " JOIN " + _this.getTableName(destinationTableName) + " " + _this.escape(destinationTableAlias) + " ON " + _this.replacePropertyNames(condition + appendedCondition);
            }
            else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
                // JOIN `post` `post` ON `post`.`categoryId` = `category`.`id`
                var condition = relation.inverseRelation.joinColumns.map(function (joinColumn) {
                    return destinationTableAlias + "." + relation.inverseRelation.propertyPath + "." + joinColumn.referencedColumn.propertyPath + "=" +
                        parentAlias + "." + joinColumn.referencedColumn.propertyPath;
                }).join(" AND ");
                return " " + joinAttr.direction + " JOIN " + _this.getTableName(destinationTableName) + " " + _this.escape(destinationTableAlias) + " ON " + _this.replacePropertyNames(condition + appendedCondition);
            }
            else { // means many-to-many
                var junctionTableName = relation.junctionEntityMetadata.tablePath;
                var junctionAlias_1 = joinAttr.junctionAlias;
                var junctionCondition = "", destinationCondition = "";
                if (relation.isOwning) {
                    junctionCondition = relation.joinColumns.map(function (joinColumn) {
                        // `post_category`.`postId` = `post`.`id`
                        return junctionAlias_1 + "." + joinColumn.propertyPath + "=" + parentAlias + "." + joinColumn.referencedColumn.propertyPath;
                    }).join(" AND ");
                    destinationCondition = relation.inverseJoinColumns.map(function (joinColumn) {
                        // `category`.`id` = `post_category`.`categoryId`
                        return destinationTableAlias + "." + joinColumn.referencedColumn.propertyPath + "=" + junctionAlias_1 + "." + joinColumn.propertyPath;
                    }).join(" AND ");
                }
                else {
                    junctionCondition = relation.inverseRelation.inverseJoinColumns.map(function (joinColumn) {
                        // `post_category`.`categoryId` = `category`.`id`
                        return junctionAlias_1 + "." + joinColumn.propertyPath + "=" + parentAlias + "." + joinColumn.referencedColumn.propertyPath;
                    }).join(" AND ");
                    destinationCondition = relation.inverseRelation.joinColumns.map(function (joinColumn) {
                        // `post`.`id` = `post_category`.`postId`
                        return destinationTableAlias + "." + joinColumn.referencedColumn.propertyPath + "=" + junctionAlias_1 + "." + joinColumn.propertyPath;
                    }).join(" AND ");
                }
                return " " + joinAttr.direction + " JOIN " + _this.getTableName(junctionTableName) + " " + _this.escape(junctionAlias_1) + " ON " + _this.replacePropertyNames(junctionCondition) +
                    " " + joinAttr.direction + " JOIN " + _this.getTableName(destinationTableName) + " " + _this.escape(destinationTableAlias) + " ON " + _this.replacePropertyNames(destinationCondition + appendedCondition);
            }
        });
        return joins.join(" ");
    };
    /**
     * Creates "GROUP BY" part of SQL query.
     */
    SelectQueryBuilder.prototype.createGroupByExpression = function () {
        if (!this.expressionMap.groupBys || !this.expressionMap.groupBys.length)
            return "";
        return " GROUP BY " + this.replacePropertyNames(this.expressionMap.groupBys.join(", "));
    };
    /**
     * Creates "ORDER BY" part of SQL query.
     */
    SelectQueryBuilder.prototype.createOrderByExpression = function () {
        var _this = this;
        var orderBys = this.expressionMap.allOrderBys;
        if (Object.keys(orderBys).length > 0)
            return " ORDER BY " + Object.keys(orderBys)
                .map(function (columnName) {
                if (typeof orderBys[columnName] === "string") {
                    return _this.replacePropertyNames(columnName) + " " + orderBys[columnName];
                }
                else {
                    return _this.replacePropertyNames(columnName) + " " + orderBys[columnName].order + " " + orderBys[columnName].nulls;
                }
            })
                .join(", ");
        return "";
    };
    /**
     * Creates "LIMIT" and "OFFSET" parts of SQL query.
     */
    SelectQueryBuilder.prototype.createLimitOffsetExpression = function () {
        // in the case if nothing is joined in the query builder we don't need to make two requests to get paginated results
        // we can use regular limit / offset, that's why we add offset and limit construction here based on skip and take values
        var offset = this.expressionMap.offset, limit = this.expressionMap.limit;
        if (!offset && !limit && this.expressionMap.joinAttributes.length === 0) {
            offset = this.expressionMap.skip;
            limit = this.expressionMap.take;
        }
        if (this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
            // Due to a limitation in SQL Server's parser implementation it does not support using
            // OFFSET or FETCH NEXT without an ORDER BY clause being provided. In cases where the
            // user does not request one we insert a dummy ORDER BY that does nothing and should
            // have no effect on the query planner or on the order of the results returned.
            // https://dba.stackexchange.com/a/193799
            var prefix = "";
            if ((limit || offset) && Object.keys(this.expressionMap.allOrderBys).length <= 0) {
                prefix = " ORDER BY (SELECT NULL)";
            }
            if (limit && offset)
                return prefix + " OFFSET " + offset + " ROWS FETCH NEXT " + limit + " ROWS ONLY";
            if (limit)
                return prefix + " OFFSET 0 ROWS FETCH NEXT " + limit + " ROWS ONLY";
            if (offset)
                return prefix + " OFFSET " + offset + " ROWS";
        }
        else if (this.connection.driver instanceof MysqlDriver_1.MysqlDriver) {
            if (limit && offset)
                return " LIMIT " + limit + " OFFSET " + offset;
            if (limit)
                return " LIMIT " + limit;
            if (offset)
                throw new OffsetWithoutLimitNotSupportedError_1.OffsetWithoutLimitNotSupportedError("MySQL");
        }
        else if (this.connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver) {
            if (limit && offset)
                return " LIMIT " + limit + " OFFSET " + offset;
            if (limit)
                return " LIMIT " + limit;
            if (offset)
                return " LIMIT -1 OFFSET " + offset;
        }
        else if (this.connection.driver instanceof OracleDriver_1.OracleDriver) {
            if (limit && offset)
                return " OFFSET " + offset + " ROWS FETCH NEXT " + limit + " ROWS ONLY";
            if (limit)
                return " FETCH NEXT " + limit + " ROWS ONLY";
            if (offset)
                return " OFFSET " + offset + " ROWS";
        }
        else {
            if (limit && offset)
                return " LIMIT " + limit + " OFFSET " + offset;
            if (limit)
                return " LIMIT " + limit;
            if (offset)
                return " OFFSET " + offset;
        }
        return "";
    };
    /**
     * Creates "LOCK" part of SQL query.
     */
    SelectQueryBuilder.prototype.createLockExpression = function () {
        var driver = this.connection.driver;
        switch (this.expressionMap.lockMode) {
            case "pessimistic_read":
                if (driver instanceof MysqlDriver_1.MysqlDriver) {
                    return " LOCK IN SHARE MODE";
                }
                else if (driver instanceof PostgresDriver_1.PostgresDriver) {
                    return " FOR SHARE";
                }
                else if (driver instanceof OracleDriver_1.OracleDriver) {
                    return " FOR UPDATE";
                }
                else if (driver instanceof SqlServerDriver_1.SqlServerDriver) {
                    return "";
                }
                else {
                    throw new LockNotSupportedOnGivenDriverError_1.LockNotSupportedOnGivenDriverError();
                }
            case "pessimistic_write":
                if (driver instanceof MysqlDriver_1.MysqlDriver || driver instanceof PostgresDriver_1.PostgresDriver || driver instanceof OracleDriver_1.OracleDriver) {
                    return " FOR UPDATE";
                }
                else if (driver instanceof SqlServerDriver_1.SqlServerDriver) {
                    return "";
                }
                else {
                    throw new LockNotSupportedOnGivenDriverError_1.LockNotSupportedOnGivenDriverError();
                }
            default:
                return "";
        }
    };
    /**
     * Creates "HAVING" part of SQL query.
     */
    SelectQueryBuilder.prototype.createHavingExpression = function () {
        var _this = this;
        if (!this.expressionMap.havings || !this.expressionMap.havings.length)
            return "";
        var conditions = this.expressionMap.havings.map(function (having, index) {
            switch (having.type) {
                case "and":
                    return (index > 0 ? "AND " : "") + _this.replacePropertyNames(having.condition);
                case "or":
                    return (index > 0 ? "OR " : "") + _this.replacePropertyNames(having.condition);
                default:
                    return _this.replacePropertyNames(having.condition);
            }
        }).join(" ");
        if (!conditions.length)
            return "";
        return " HAVING " + conditions;
    };
    SelectQueryBuilder.prototype.buildEscapedEntityColumnSelects = function (aliasName, metadata) {
        var _this = this;
        var hasMainAlias = this.expressionMap.selects.some(function (select) { return select.selection === aliasName; });
        var columns = [];
        if (hasMainAlias) {
            columns.push.apply(columns, tslib_1.__spread(metadata.columns.filter(function (column) { return column.isSelect === true; })));
        }
        columns.push.apply(columns, tslib_1.__spread(metadata.columns.filter(function (column) {
            return _this.expressionMap.selects.some(function (select) { return select.selection === aliasName + "." + column.propertyPath; });
        })));
        // if user used partial selection and did not select some primary columns which are required to be selected
        // we select those primary columns and mark them as "virtual". Later virtual column values will be removed from final entity
        // to make entity contain exactly what user selected
        if (columns.length === 0) // however not in the case when nothing (even partial) was selected from this target (for example joins without selection)
            return [];
        var nonSelectedPrimaryColumns = this.expressionMap.queryEntity ? metadata.primaryColumns.filter(function (primaryColumn) { return columns.indexOf(primaryColumn) === -1; }) : [];
        var allColumns = tslib_1.__spread(columns, nonSelectedPrimaryColumns);
        return allColumns.map(function (column) {
            var selection = _this.expressionMap.selects.find(function (select) { return select.selection === aliasName + "." + column.propertyPath; });
            var selectionPath = _this.escape(aliasName) + "." + _this.escape(column.databaseName);
            if (_this.connection.driver.spatialTypes.indexOf(column.type) !== -1) {
                if (_this.connection.driver instanceof MysqlDriver_1.MysqlDriver)
                    selectionPath = "AsText(" + selectionPath + ")";
                if (_this.connection.driver instanceof PostgresDriver_1.PostgresDriver)
                    // cast to JSON to trigger parsing in the driver
                    selectionPath = "ST_AsGeoJSON(" + selectionPath + ")::json";
                if (_this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver)
                    selectionPath = selectionPath + ".ToString()";
            }
            return {
                selection: selectionPath,
                aliasName: selection && selection.aliasName ? selection.aliasName : DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, aliasName, column.databaseName),
                // todo: need to keep in mind that custom selection.aliasName breaks hydrator. fix it later!
                virtual: selection ? selection.virtual === true : (hasMainAlias ? false : true),
            };
        });
    };
    SelectQueryBuilder.prototype.findEntityColumnSelects = function (aliasName, metadata) {
        var mainSelect = this.expressionMap.selects.find(function (select) { return select.selection === aliasName; });
        if (mainSelect)
            return [mainSelect];
        return this.expressionMap.selects.filter(function (select) {
            return metadata.columns.some(function (column) { return select.selection === aliasName + "." + column.propertyPath; });
        });
    };
    SelectQueryBuilder.prototype.applyFindOptions = function () {
        var _this = this;
        if (this.expressionMap.mainAlias.metadata) {
            if (this.findOptions.select)
                this.buildSelect(this.findOptions.select, this.expressionMap.mainAlias.metadata, this.expressionMap.mainAlias.name);
            if (this.findOptions.where)
                this.conditions = this.buildWhere(this.findOptions.where, this.expressionMap.mainAlias.metadata, this.expressionMap.mainAlias.name);
            if (this.findOptions.order)
                this.buildOrder(this.findOptions.order, this.expressionMap.mainAlias.metadata, this.expressionMap.mainAlias.name);
            if (this.findOptions.relations)
                this.buildRelations(this.findOptions.relations, this.expressionMap.mainAlias.metadata);
            if (this.selects.length)
                this.select(this.selects);
            // apply joins
            if (this.joins.length) {
                this.joins.forEach(function (join) {
                    if (join.select) {
                        if (join.type === "inner") {
                            _this.innerJoinAndSelect(join.parentAlias + "." + join.relationMetadata.propertyPath, join.alias);
                        }
                        else {
                            _this.leftJoinAndSelect(join.parentAlias + "." + join.relationMetadata.propertyPath, join.alias);
                        }
                    }
                    else {
                        if (join.type === "inner") {
                            _this.innerJoin(join.parentAlias + "." + join.relationMetadata.propertyPath, join.alias);
                        }
                        else {
                            _this.leftJoin(join.parentAlias + "." + join.relationMetadata.propertyPath, join.alias);
                        }
                    }
                });
            }
            if (this.conditions.length)
                this.andWhere(this.conditions.substr(0, 1) !== "(" ? "(" + this.conditions + ")" : this.conditions); // temporary and where and braces
            // apply offset
            if (this.findOptions.skip !== undefined) {
                if (this.findOptions.options && this.findOptions.options.pagination === false) {
                    this.offset(this.findOptions.skip);
                }
                else {
                    this.skip(this.findOptions.skip);
                }
            }
            // apply limit
            if (this.findOptions.take !== undefined) {
                if (this.findOptions.options && this.findOptions.options.pagination === false) {
                    this.limit(this.findOptions.take);
                }
                else {
                    this.take(this.findOptions.take);
                }
            }
            // apply caching options
            if (typeof this.findOptions.cache === "number") {
                this.cache(this.findOptions.cache);
            }
            else if (typeof this.findOptions.cache === "boolean") {
                this.cache(this.findOptions.cache);
            }
            else if (typeof this.findOptions.cache === "object") {
                this.cache(this.findOptions.cache.id, this.findOptions.cache.milliseconds);
            }
            if (this.orderBys.length) {
                this.orderBys.forEach(function (orderBy) {
                    _this.addOrderBy(orderBy.alias, orderBy.direction, orderBy.nulls);
                });
            }
            if (this.expressionMap.eagerRelations === true) {
                if (!this.findOptions.options || this.findOptions.options.eagerRelations !== false) {
                    // Create a list of all of the alias+propertyPaths that were manually joined, so we don't join them again
                    var manuallyJoinedRelations_1 = this.expressionMap.joinAttributes
                        .filter(function (join) { return join.relationPropertyPath; })
                        .map(function (join) { return join.parentAlias + "." + join.relationPropertyPath; });
                    var joinEagerRelations_1 = function (alias, metadata) {
                        metadata.eagerRelations.forEach(function (relation) {
                            var relationAlias = alias + "_" + relation.propertyPath.replace(".", "_");
                            var path = alias + "." + relation.propertyPath;
                            if (manuallyJoinedRelations_1.indexOf(path) === -1) {
                                // This alias+propertyPath was already joined manually
                                _this.leftJoinAndSelect(path, relationAlias);
                            }
                            joinEagerRelations_1(relationAlias, relation.inverseEntityMetadata);
                        });
                    };
                    joinEagerRelations_1(this.expressionMap.mainAlias.name, this.expressionMap.mainAlias.metadata);
                }
            }
            if (this.findOptions.options) {
                if (this.findOptions.options.listeners === false)
                    this.callListeners(false);
                if (this.findOptions.options.observers === false)
                    this.callObservers(false);
                if (this.findOptions.options.loadRelationIds === true) {
                    this.loadAllRelationIds();
                }
                else if (this.findOptions.options.loadRelationIds instanceof Object) {
                    this.loadAllRelationIds(this.findOptions.options.loadRelationIds);
                }
            }
        }
    };
    SelectQueryBuilder.prototype.executeCountQuery = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var mainAlias, metadata, distinctAlias, countSql, results;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mainAlias = this.expressionMap.mainAlias.name;
                        metadata = this.expressionMap.mainAlias.metadata;
                        distinctAlias = this.escape(mainAlias);
                        countSql = "";
                        if (metadata.hasMultiplePrimaryKeys) {
                            if (this.connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver) {
                                countSql = "COUNT(DISTINCT(" + metadata.primaryColumns.map(function (primaryColumn, index) {
                                    var propertyName = _this.escape(primaryColumn.databaseName);
                                    return distinctAlias + "." + propertyName;
                                }).join(" || ") + (")) as " + this.escape("cnt"));
                            }
                            else {
                                countSql = "COUNT(DISTINCT(CONCAT(" + metadata.primaryColumns.map(function (primaryColumn, index) {
                                    var propertyName = _this.escape(primaryColumn.databaseName);
                                    return distinctAlias + "." + propertyName;
                                }).join(", ") + ("))) as " + this.escape("cnt"));
                            }
                        }
                        else {
                            countSql = "COUNT(DISTINCT(" + metadata.primaryColumns.map(function (primaryColumn, index) {
                                var propertyName = _this.escape(primaryColumn.databaseName);
                                return distinctAlias + "." + propertyName;
                            }).join(", ") + (")) as " + this.escape("cnt"));
                        }
                        return [4 /*yield*/, this.clone()
                                .orderBy()
                                .groupBy()
                                .offset(undefined)
                                .limit(undefined)
                                .skip(undefined)
                                .take(undefined)
                                .select(countSql)
                                .setOption("disable-global-order")
                                // .setFindOptions({ where: this.findOptions.where })
                                .loadRawResults(queryRunner)];
                    case 1:
                        results = _a.sent();
                        if (!results || !results[0] || !results[0]["cnt"])
                            return [2 /*return*/, 0];
                        return [2 /*return*/, parseInt(results[0]["cnt"])];
                }
            });
        });
    };
    /**
     * Executes sql generated by query builder and returns object with raw results and entities created from them.
     */
    SelectQueryBuilder.prototype.executeEntitiesAndRawResults = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var cloneQb1, cloneQb2, metadata, relationIdLoader, relationCountLoader, relationIdMetadataTransformer, relationCountMetadataTransformer, rawResults, entities, _a, selects, orderBys_1, metadata_1, mainAliasName_1, querySelects, clonnedQb, condition, parameters_1, ids, areAllNumbers, rawRelationIdResults, rawRelationCountResults, transformer, broadcastResult;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.expressionMap.mainAlias)
                            throw new Error("Alias is not set. Use \"from\" method to set an alias.");
                        cloneQb1 = this.clone();
                        cloneQb2 = this.clone();
                        if ((this.expressionMap.lockMode === "pessimistic_read" || this.expressionMap.lockMode === "pessimistic_write") && !queryRunner.isTransactionActive)
                            throw new PessimisticLockTransactionRequiredError_1.PessimisticLockTransactionRequiredError();
                        if (this.expressionMap.lockMode === "optimistic") {
                            metadata = this.expressionMap.mainAlias.metadata;
                            if (!metadata.versionColumn && !metadata.updateDateColumn)
                                throw new NoVersionOrUpdateDateColumnError_1.NoVersionOrUpdateDateColumnError(metadata.name);
                        }
                        relationIdLoader = new RelationIdLoader_1.RelationIdLoader(this.connection, queryRunner, this.expressionMap.relationIdAttributes);
                        relationCountLoader = new RelationCountLoader_1.RelationCountLoader(this.connection, queryRunner, this.expressionMap.relationCountAttributes);
                        relationIdMetadataTransformer = new RelationIdMetadataToAttributeTransformer_1.RelationIdMetadataToAttributeTransformer(this.expressionMap);
                        relationIdMetadataTransformer.transform();
                        relationCountMetadataTransformer = new RelationCountMetadataToAttributeTransformer_1.RelationCountMetadataToAttributeTransformer(this.expressionMap);
                        relationCountMetadataTransformer.transform();
                        rawResults = [], entities = [];
                        if (!((this.expressionMap.skip || this.expressionMap.take) && this.expressionMap.joinAttributes.length > 0)) return [3 /*break*/, 4];
                        _a = tslib_1.__read(this.createOrderByCombinedWithSelectExpression("distinctAlias"), 2), selects = _a[0], orderBys_1 = _a[1];
                        metadata_1 = this.expressionMap.mainAlias.metadata;
                        mainAliasName_1 = this.expressionMap.mainAlias.name;
                        querySelects = metadata_1.primaryColumns.map(function (primaryColumn) {
                            var distinctAlias = _this.escape("distinctAlias");
                            var columnAlias = _this.escape(DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, mainAliasName_1, primaryColumn.databaseName));
                            if (!orderBys_1[columnAlias]) // make sure we aren't overriding user-defined order in inverse direction
                                orderBys_1[columnAlias] = "ASC";
                            return distinctAlias + "." + columnAlias + " as \"ids_" + DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, mainAliasName_1, primaryColumn.databaseName) + "\"";
                        });
                        clonnedQb = cloneQb1
                            // .setFindOptions({
                            //     select: this.findOptions.select,
                            //     relations: this.findOptions.relations,
                            //     options: this.findOptions.options,
                            //     where: this.findOptions.where
                            // })
                            .orderBy();
                        return [4 /*yield*/, new SelectQueryBuilder(this.connection, queryRunner)
                                .select("DISTINCT " + querySelects.join(", "))
                                .addSelect(selects)
                                .from("(" + clonnedQb.getQuery() + ")", "distinctAlias")
                                .offset(this.expressionMap.skip)
                                .limit(this.expressionMap.take)
                                .orderBy(orderBys_1)
                                .cache(this.expressionMap.cache ? this.expressionMap.cache : this.expressionMap.cacheId, this.expressionMap.cacheDuration)
                                .setParameters(this.getParameters())
                                .setNativeParameters(this.expressionMap.nativeParameters)
                                .getRawMany()];
                    case 1:
                        rawResults = _b.sent();
                        if (!(rawResults.length > 0)) return [3 /*break*/, 3];
                        condition = "";
                        parameters_1 = {};
                        if (metadata_1.hasMultiplePrimaryKeys) {
                            condition = rawResults.map(function (result, index) {
                                return metadata_1.primaryColumns.map(function (primaryColumn) {
                                    parameters_1["ids_" + index + "_" + primaryColumn.databaseName] = result["ids_" + mainAliasName_1 + "_" + primaryColumn.databaseName];
                                    return mainAliasName_1 + "." + primaryColumn.propertyPath + "=:ids_" + index + "_" + primaryColumn.databaseName;
                                }).join(" AND ");
                            }).join(" OR ");
                        }
                        else {
                            ids = rawResults.map(function (result) { return result["ids_" + DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, mainAliasName_1, metadata_1.primaryColumns[0].databaseName)]; });
                            areAllNumbers = ids.every(function (id) { return typeof id === "number"; });
                            if (areAllNumbers) {
                                // fixes #190. if all numbers then its safe to perform query without parameter
                                condition = mainAliasName_1 + "." + metadata_1.primaryColumns[0].propertyPath + " IN (" + ids.join(", ") + ")";
                            }
                            else {
                                parameters_1["ids"] = ids;
                                condition = mainAliasName_1 + "." + metadata_1.primaryColumns[0].propertyPath + " IN (:...ids)";
                            }
                        }
                        return [4 /*yield*/, cloneQb2
                                // .setFindOptions(this.findOptions)
                                .mergeExpressionMap({ extraAppendedAndWhereCondition: condition })
                                .setParameters(parameters_1)
                                .loadRawResults(queryRunner)];
                    case 2:
                        rawResults = _b.sent();
                        _b.label = 3;
                    case 3: return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.loadRawResults(queryRunner)];
                    case 5:
                        // console.time("load raw results");
                        rawResults = _b.sent();
                        _b.label = 6;
                    case 6:
                        if (!(rawResults.length > 0)) return [3 /*break*/, 10];
                        return [4 /*yield*/, relationIdLoader.load(rawResults)];
                    case 7:
                        rawRelationIdResults = _b.sent();
                        return [4 /*yield*/, relationCountLoader.load(rawResults)];
                    case 8:
                        rawRelationCountResults = _b.sent();
                        transformer = new RawSqlResultsToEntityTransformer_1.RawSqlResultsToEntityTransformer(this.expressionMap, this.connection.driver, rawRelationIdResults, rawRelationCountResults, this.queryRunner);
                        // console.time("transforming entities");
                        entities = transformer.transform(rawResults, this.expressionMap.mainAlias);
                        if (!(this.expressionMap.callListeners === true && this.expressionMap.mainAlias.hasMetadata)) return [3 /*break*/, 10];
                        broadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        queryRunner.broadcaster.broadcastLoadEventsForAll(broadcastResult, this.expressionMap.mainAlias.metadata, entities);
                        if (!(broadcastResult.promises.length > 0)) return [3 /*break*/, 10];
                        return [4 /*yield*/, Promise.all(broadcastResult.promises)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [4 /*yield*/, Promise.all(this.relationMetadatas.map(function (relation) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var relationTarget, relationAlias, queryBuilder, relatedEntityGroups_1;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        relationTarget = relation.inverseEntityMetadata.target;
                                        relationAlias = relation.inverseEntityMetadata.targetName;
                                        queryBuilder = this.createQueryBuilder()
                                            .select(relationAlias)
                                            .from(relationTarget, relationAlias)
                                            .setFindOptions({
                                            select: this.findOptions.select && typeof this.findOptions.select === "object" ? OrmUtils_1.OrmUtils.deepValue(this.findOptions.select, relation.propertyPath) : undefined,
                                            order: this.findOptions.order ? OrmUtils_1.OrmUtils.deepValue(this.findOptions.order, relation.propertyPath) : undefined,
                                            relations: this.findOptions.relations && typeof this.findOptions.relations === "object" ? OrmUtils_1.OrmUtils.deepValue(this.findOptions.relations, relation.propertyPath) : undefined,
                                        });
                                        if (!(entities.length > 0)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, this.connection.relationIdLoader.loadManyToManyRelationIdsAndGroup(relation, entities, undefined, queryBuilder)];
                                    case 1:
                                        relatedEntityGroups_1 = _a.sent();
                                        entities.forEach(function (entity) {
                                            var relatedEntityGroup = relatedEntityGroups_1.find(function (group) { return group.entity === entity; });
                                            if (relatedEntityGroup) {
                                                var value = relatedEntityGroup.related === undefined ? null : relatedEntityGroup.related;
                                                relation.setEntityValue(entity, value);
                                            }
                                        });
                                        _a.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); }))];
                    case 11:
                        _b.sent();
                        return [2 /*return*/, {
                                raw: rawResults,
                                entities: entities,
                            }];
                }
            });
        });
    };
    SelectQueryBuilder.prototype.createOrderByCombinedWithSelectExpression = function (parentAlias) {
        var _this = this;
        // if table has a default order then apply it
        var orderBys = this.expressionMap.allOrderBys;
        var selectString = Object.keys(orderBys)
            .map(function (orderCriteria) {
            if (orderCriteria.indexOf(".") !== -1) {
                var _a = tslib_1.__read(QueryBuilderUtils_1.QueryBuilderUtils.extractAliasAndPropertyPath(orderCriteria), 2), aliasName = _a[0], propertyPath = _a[1];
                var alias = _this.expressionMap.findAliasByName(aliasName);
                var column = alias.metadata.findColumnWithPropertyPath(propertyPath);
                return _this.escape(parentAlias) + "." + _this.escape(DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, aliasName, column.databaseName));
            }
            else {
                if (_this.expressionMap.selects.find(function (select) { return select.selection === orderCriteria || select.aliasName === orderCriteria; }))
                    return _this.escape(parentAlias) + "." + orderCriteria;
                return "";
            }
        })
            .join(", ");
        var orderByObject = {};
        Object.keys(orderBys).forEach(function (orderCriteria) {
            if (orderCriteria.indexOf(".") !== -1) {
                var _a = tslib_1.__read(QueryBuilderUtils_1.QueryBuilderUtils.extractAliasAndPropertyPath(orderCriteria), 2), aliasName = _a[0], propertyPath = _a[1];
                var alias = _this.expressionMap.findAliasByName(aliasName);
                var column = alias.metadata.findColumnWithPropertyPath(propertyPath);
                orderByObject[_this.escape(parentAlias) + "." + _this.escape(DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, aliasName, column.databaseName))] = orderBys[orderCriteria];
            }
            else {
                if (_this.expressionMap.selects.find(function (select) { return select.selection === orderCriteria || select.aliasName === orderCriteria; })) {
                    orderByObject[_this.escape(parentAlias) + "." + orderCriteria] = orderBys[orderCriteria];
                }
                else {
                    orderByObject[orderCriteria] = orderBys[orderCriteria];
                }
            }
        });
        return [selectString, orderByObject];
    };
    /**
     * Loads raw results from the database.
     */
    SelectQueryBuilder.prototype.loadRawResults = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, sql, parameters, queryId, cacheOptions, savedQueryResultCacheOptions, results;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = tslib_1.__read(this.getQueryAndParameters(), 2), sql = _a[0], parameters = _a[1];
                        queryId = sql + " -- PARAMETERS: " + JSON.stringify(parameters);
                        cacheOptions = typeof this.connection.options.cache === "object" ? this.connection.options.cache : {};
                        savedQueryResultCacheOptions = undefined;
                        if (!(this.connection.queryResultCache && (this.expressionMap.cache || cacheOptions.alwaysEnabled))) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.connection.queryResultCache.getFromCache({
                                identifier: this.expressionMap.cacheId,
                                query: queryId,
                                duration: this.expressionMap.cacheDuration || cacheOptions.duration || 1000
                            }, queryRunner)];
                    case 1:
                        savedQueryResultCacheOptions = _b.sent();
                        if (savedQueryResultCacheOptions && !this.connection.queryResultCache.isExpired(savedQueryResultCacheOptions))
                            return [2 /*return*/, JSON.parse(savedQueryResultCacheOptions.result)];
                        _b.label = 2;
                    case 2: return [4 /*yield*/, queryRunner.query(sql, parameters)];
                    case 3:
                        results = _b.sent();
                        if (!(this.connection.queryResultCache && (this.expressionMap.cache || cacheOptions.alwaysEnabled))) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.connection.queryResultCache.storeInCache({
                                identifier: this.expressionMap.cacheId,
                                query: queryId,
                                time: new Date().getTime(),
                                duration: this.expressionMap.cacheDuration || cacheOptions.duration || 1000,
                                result: JSON.stringify(results)
                            }, savedQueryResultCacheOptions, queryRunner)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Merges into expression map given expression map properties.
     */
    SelectQueryBuilder.prototype.mergeExpressionMap = function (expressionMap) {
        ObjectUtils_1.ObjectUtils.assign(this.expressionMap, expressionMap);
        return this;
    };
    /**
     * Normalizes a give number - converts to int if possible.
     */
    SelectQueryBuilder.prototype.normalizeNumber = function (num) {
        if (typeof num === "number" || num === undefined || num === null)
            return num;
        return Number(num);
    };
    /**
     * Creates a query builder used to execute sql queries inside this query builder.
     */
    SelectQueryBuilder.prototype.obtainQueryRunner = function () {
        return this.queryRunner || this.connection.createQueryRunner("slave");
    };
    SelectQueryBuilder.prototype.buildSelect = function (select, metadata, alias, embedPrefix) {
        var _this = this;
        if (select instanceof Array) {
            select.forEach(function (select) {
                _this.selects.push(_this.expressionMap.mainAlias.name + "." + select);
            });
        }
        else {
            for (var key in select) {
                if (select[key] === undefined)
                    continue;
                var propertyPath = embedPrefix ? embedPrefix + "." + key : key;
                var column = metadata.findColumnWithPropertyPathStrict(propertyPath);
                var embed = metadata.findEmbeddedWithPropertyPath(propertyPath);
                var relation = metadata.findRelationWithPropertyPath(propertyPath);
                if (!embed && !column && !relation)
                    throw new FindCriteriaNotFoundError_1.FindCriteriaNotFoundError(propertyPath, metadata);
                if (column) {
                    this.selects.push(alias + "." + propertyPath);
                }
                else if (embed) {
                    this.buildSelect(select[key], metadata, alias, propertyPath);
                    // } else if (relation) {
                    //     const joinAlias = alias + "_" + relation.propertyName;
                    //     const existJoin = this.joins.find(join => join.alias === joinAlias);
                    //     if (!existJoin) {
                    //         this.joins.push({
                    //             type: "left",
                    //             select: false,
                    //             alias: joinAlias,
                    //             parentAlias: alias,
                    //             relationMetadata: relation
                    //         });
                    //     }
                    //     this.buildOrder(select[key] as FindOptionsOrder<any>, relation.inverseEntityMetadata, joinAlias);
                }
            }
        }
    };
    SelectQueryBuilder.prototype.buildRelations = function (relations, metadata, embedPrefix) {
        var _this = this;
        if (!relations)
            return;
        if (relations instanceof Array) {
            relations.forEach(function (relationName) {
                var propertyPath = embedPrefix ? embedPrefix + "." + relationName : relationName;
                var relation = metadata.findRelationWithPropertyPath(propertyPath);
                if (!relation)
                    throw new FindCriteriaNotFoundError_1.FindCriteriaNotFoundError(propertyPath, metadata);
                _this.relationMetadatas.push(relation);
            });
        }
        else {
            Object.keys(relations).forEach(function (relationName) {
                var relationValue = relations[relationName];
                if (relationValue === true || relationValue instanceof Object) {
                    var propertyPath = embedPrefix ? embedPrefix + "." + relationName : relationName;
                    var embed = metadata.findEmbeddedWithPropertyPath(propertyPath);
                    var relation = metadata.findRelationWithPropertyPath(propertyPath);
                    if (!embed && !relation)
                        throw new FindCriteriaNotFoundError_1.FindCriteriaNotFoundError(propertyPath, metadata);
                    if (embed) {
                        _this.buildRelations(relationValue, metadata, propertyPath);
                    }
                    else {
                        _this.relationMetadatas.push(relation);
                    }
                }
            });
        }
    };
    SelectQueryBuilder.prototype.buildOrder = function (order, metadata, alias, embedPrefix) {
        var _loop_1 = function (key) {
            if (order[key] === undefined)
                return "continue";
            var propertyPath = embedPrefix ? embedPrefix + "." + key : key;
            var column = metadata.findColumnWithPropertyPathStrict(propertyPath);
            var embed = metadata.findEmbeddedWithPropertyPath(propertyPath);
            var relation = metadata.findRelationWithPropertyPath(propertyPath);
            if (!embed && !column && !relation)
                throw new FindCriteriaNotFoundError_1.FindCriteriaNotFoundError(propertyPath, metadata);
            if (column) {
                var direction = order[key] instanceof Object ? order[key].direction : order[key];
                direction = direction === "DESC" || direction === "desc" || direction === -1 ? "DESC" : "ASC";
                var nulls = order[key] instanceof Object ? order[key].nulls : undefined;
                nulls = nulls === "first" ? "NULLS FIRST" : nulls === "last" ? "NULLS LAST" : undefined;
                this_1.orderBys.push({ alias: alias + "." + propertyPath, direction: direction, nulls: nulls }); // `${alias}.${propertyPath} = :${paramName}`);
            }
            else if (embed) {
                this_1.buildOrder(order[key], metadata, alias, propertyPath);
            }
            else if (relation) {
                var joinAlias_1 = alias + "_" + relation.propertyName;
                var existJoin = this_1.joins.find(function (join) { return join.alias === joinAlias_1; });
                if (!existJoin) {
                    this_1.joins.push({
                        type: "left",
                        select: false,
                        alias: joinAlias_1,
                        parentAlias: alias,
                        relationMetadata: relation
                    });
                }
                this_1.buildOrder(order[key], relation.inverseEntityMetadata, joinAlias_1);
            }
        };
        var this_1 = this;
        for (var key in order) {
            _loop_1(key);
        }
    };
    SelectQueryBuilder.prototype.buildWhere = function (where, metadata, alias, embedPrefix) {
        var _this = this;
        var condition = "";
        var parameterIndex = Object.keys(this.expressionMap.nativeParameters).length;
        if (where instanceof Array) {
            condition = ("(" + where.map(function (whereItem) {
                return _this.buildWhere(whereItem, metadata, alias, embedPrefix);
            }).filter(function (condition) { return !!condition; }).map(function (condition) { return "(" + condition + ")"; }).join(" OR ") + ")");
        }
        else {
            var andConditions = [];
            var _loop_2 = function (key) {
                if (where[key] === undefined)
                    return "continue";
                var propertyPath = embedPrefix ? embedPrefix + "." + key : key;
                var column = metadata.findColumnWithPropertyPathStrict(propertyPath);
                var embed = metadata.findEmbeddedWithPropertyPath(propertyPath);
                var relation = metadata.findRelationWithPropertyPath(propertyPath);
                if (!embed && !column && !relation)
                    throw new FindCriteriaNotFoundError_1.FindCriteriaNotFoundError(propertyPath, metadata);
                if (column) {
                    var aliasPath = alias + "." + propertyPath;
                    var parameterName_1 = alias + "_" + propertyPath.replace(".", "_") + "_" + parameterIndex;
                    var parameterValue = column.transformer && column.transformer.to ? column.transformer.to(where[key]) : where[key];
                    if (parameterValue === null) {
                        andConditions.push(aliasPath + " IS NULL");
                    }
                    else if (parameterValue instanceof FindOperator_1.FindOperator) {
                        var parameters_2 = [];
                        if (parameterValue.useParameter) {
                            var realParameterValues = parameterValue.multipleParameters ? parameterValue.value : [parameterValue.value];
                            realParameterValues.forEach(function (realParameterValue, realParameterValueIndex) {
                                // don't create parameters for number to prevent max number of variables issues as much as possible
                                if (typeof realParameterValue === "number") {
                                    parameters_2.push(realParameterValue);
                                }
                                else {
                                    _this.expressionMap.nativeParameters[parameterName_1 + realParameterValueIndex] = realParameterValue;
                                    parameterIndex++;
                                    parameters_2.push(_this.connection.driver.createParameter(parameterName_1 + realParameterValueIndex, parameterIndex - 1));
                                }
                            });
                        }
                        andConditions.push(parameterValue.toSql(this_2.connection, aliasPath, parameters_2));
                    }
                    else {
                        this_2.expressionMap.nativeParameters[parameterName_1] = parameterValue;
                        parameterIndex++;
                        var parameter = this_2.connection.driver.createParameter(parameterName_1, parameterIndex - 1);
                        andConditions.push(aliasPath + " = " + parameter);
                    }
                    // this.conditions.push(`${alias}.${propertyPath} = :${paramName}`);
                    // this.expressionMap.parameters[paramName] = where[key]; // todo: handle functions and other edge cases
                }
                else if (embed) {
                    var condition_1 = this_2.buildWhere(where[key], metadata, alias, propertyPath);
                    if (condition_1)
                        andConditions.push(condition_1);
                }
                else if (relation) {
                    // if all properties of where are undefined we don't need to join anything
                    // this can happen when user defines map with conditional queries inside
                    if (where[key] instanceof Object) {
                        var allAllUndefined = Object.keys(where[key]).every(function (k) { return where[key][k] === undefined; });
                        if (allAllUndefined) {
                            return "continue";
                        }
                    }
                    if (where[key] instanceof FindOperator_1.FindOperator) {
                        if (where[key].type === "moreThan" || where[key].type === "lessThan") {
                            var sqlOperator = where[key].type === "moreThan" ? ">" : "<";
                            // basically relation count functionality
                            var qb = this_2.subQuery();
                            if (relation.isManyToManyOwner) {
                                qb.select("COUNT(*)")
                                    .from(relation.joinTableName, relation.joinTableName)
                                    .where(relation.joinColumns.map(function (column) {
                                    return relation.joinTableName + "." + column.propertyName + " = " + alias + "." + column.referencedColumn.propertyName;
                                }).join(" AND "));
                            }
                            else if (relation.isManyToManyNotOwner) {
                                qb.select("COUNT(*)")
                                    .from(relation.inverseRelation.joinTableName, relation.inverseRelation.joinTableName)
                                    .where(relation.inverseRelation.inverseJoinColumns.map(function (column) {
                                    return relation.inverseRelation.joinTableName + "." + column.propertyName + " = " + alias + "." + column.referencedColumn.propertyName;
                                }).join(" AND "));
                            }
                            else if (relation.isOneToMany) {
                                qb.select("COUNT(*)")
                                    .from(relation.inverseEntityMetadata.target, relation.inverseEntityMetadata.tableName)
                                    .where(relation.inverseRelation.joinColumns.map(function (column) {
                                    return relation.inverseEntityMetadata.tableName + "." + column.propertyName + " = " + alias + "." + column.referencedColumn.propertyName;
                                }).join(" AND "));
                            }
                            else {
                                throw new Error("This relation isn't supported by given find operator");
                            }
                            // this
                            //     .addSelect(qb.getSql(), relation.propertyAliasName + "_cnt")
                            //     .andWhere(this.escape(relation.propertyAliasName + "_cnt") + " " + sqlOperator + " " + parseInt(where[key].value));
                            this_2.andWhere((qb.getSql()) + " " + sqlOperator + " " + parseInt(where[key].value));
                        }
                    }
                    else {
                        var joinAlias_2 = alias + "_" + relation.propertyName;
                        var existJoin = this_2.joins.find(function (join) { return join.alias === joinAlias_2; });
                        if (!existJoin) {
                            this_2.joins.push({
                                type: "inner",
                                select: false,
                                alias: joinAlias_2,
                                parentAlias: alias,
                                relationMetadata: relation
                            });
                        }
                        else {
                            if (existJoin.type === "left")
                                existJoin.type = "inner";
                        }
                        var condition_2 = this_2.buildWhere(where[key], relation.inverseEntityMetadata, joinAlias_2);
                        if (condition_2)
                            andConditions.push(condition_2);
                    }
                }
            };
            var this_2 = this;
            for (var key in where) {
                _loop_2(key);
            }
            condition = andConditions.join(" AND ");
        }
        return condition;
    };
    return SelectQueryBuilder;
}(QueryBuilder_1.QueryBuilder));
exports.SelectQueryBuilder = SelectQueryBuilder;

//# sourceMappingURL=SelectQueryBuilder.js.map
