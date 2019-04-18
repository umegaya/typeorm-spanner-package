"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var MongoDriver_1 = require("../driver/mongodb/MongoDriver");
var OracleDriver_1 = require("../driver/oracle/OracleDriver");
var CustomRepositoryCannotInheritRepositoryError_1 = require("../error/CustomRepositoryCannotInheritRepositoryError");
var CustomRepositoryNotFoundError_1 = require("../error/CustomRepositoryNotFoundError");
var EntityNotFoundError_1 = require("../error/EntityNotFoundError");
var NoNeedToReleaseEntityManagerError_1 = require("../error/NoNeedToReleaseEntityManagerError");
var QueryRunnerProviderAlreadyReleasedError_1 = require("../error/QueryRunnerProviderAlreadyReleasedError");
var RepositoryNotFoundError_1 = require("../error/RepositoryNotFoundError");
var RepositoryNotTreeError_1 = require("../error/RepositoryNotTreeError");
var TreeRepositoryNotSupportedError_1 = require("../error/TreeRepositoryNotSupportedError");
var FindOptionsUtils_1 = require("../find-options/FindOptionsUtils");
var index_1 = require("../index");
var ObserverExecutor_1 = require("../observer/ObserverExecutor");
var QueryObserver_1 = require("../observer/QueryObserver");
var EntityPersistExecutor_1 = require("../persistence/EntityPersistExecutor");
var PlainObjectToDatabaseEntityTransformer_1 = require("../query-builder/transformer/PlainObjectToDatabaseEntityTransformer");
var PlainObjectToNewEntityTransformer_1 = require("../query-builder/transformer/PlainObjectToNewEntityTransformer");
var AbstractRepository_1 = require("../repository/AbstractRepository");
var Repository_1 = require("../repository/Repository");
var RepositoryFactory_1 = require("../repository/RepositoryFactory");
var TreeRepository_1 = require("../repository/TreeRepository");
var ObjectUtils_1 = require("../util/ObjectUtils");
/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 */
var EntityManager = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function EntityManager(connection, queryRunner) {
        // -------------------------------------------------------------------------
        // Protected Properties
        // -------------------------------------------------------------------------
        /**
         * Once created and then reused by en repositories.
         */
        this.repositories = [];
        /**
         * Plain to object transformer used in create and merge operations.
         */
        this.plainObjectToEntityTransformer = new PlainObjectToNewEntityTransformer_1.PlainObjectToNewEntityTransformer();
        this.connection = connection;
        if (queryRunner) {
            this.queryRunner = queryRunner;
            // dynamic: this.queryRunner = manager;
            ObjectUtils_1.ObjectUtils.assign(this.queryRunner, { manager: this });
        }
    }
    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     * All database operations must be executed using provided entity manager.
     */
    EntityManager.prototype.transaction = function (isolationOrRunInTransaction, runInTransactionParam) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var isolation, runInTransaction, queryRunner, result, err_1, rollbackError_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        isolation = typeof isolationOrRunInTransaction === "string" ? isolationOrRunInTransaction : undefined;
                        runInTransaction = typeof isolationOrRunInTransaction === "function" ? isolationOrRunInTransaction : runInTransactionParam;
                        if (!runInTransaction) {
                            throw new Error("Transaction method requires callback in second paramter if isolation level is supplied.");
                        }
                        if (this.connection.driver instanceof MongoDriver_1.MongoDriver)
                            throw new Error("Transactions aren't supported by MongoDB.");
                        if (this.queryRunner && this.queryRunner.isReleased)
                            throw new QueryRunnerProviderAlreadyReleasedError_1.QueryRunnerProviderAlreadyReleasedError();
                        if (this.queryRunner && this.queryRunner.isTransactionActive)
                            throw new Error("Cannot start transaction because its already started");
                        queryRunner = this.queryRunner || this.connection.createQueryRunner("master");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 9, 12]);
                        return [4 /*yield*/, queryRunner.runInTransaction(runInTransaction, isolation)];
                    case 2:
                        result = _a.sent();
                        return [4 /*yield*/, new ObserverExecutor_1.ObserverExecutor(this.connection.observers).execute()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, result];
                    case 4:
                        err_1 = _a.sent();
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        rollbackError_1 = _a.sent();
                        return [3 /*break*/, 8];
                    case 8: throw err_1;
                    case 9:
                        if (!!this.queryRunner) return [3 /*break*/, 11];
                        return [4 /*yield*/, queryRunner.release()];
                    case 10:
                        _a.sent();
                        _a.label = 11;
                    case 11: return [7 /*endfinally*/];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes raw SQL query and returns raw database results.
     */
    EntityManager.prototype.query = function (query, parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.connection.query(query, parameters, this.queryRunner)];
            });
        });
    };
    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    EntityManager.prototype.createQueryBuilder = function (entityClass, alias, queryRunner) {
        if (alias) {
            return this.connection.createQueryBuilder(entityClass, alias, queryRunner || this.queryRunner);
        }
        else {
            return this.connection.createQueryBuilder(entityClass || queryRunner || this.queryRunner);
        }
    };
    /**
     * Checks if entity has an id by its Function type or schema name.
     */
    EntityManager.prototype.hasId = function (targetOrEntity, maybeEntity) {
        var target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        var entity = arguments.length === 2 ? maybeEntity : targetOrEntity;
        var metadata = this.connection.getMetadata(target);
        return metadata.hasId(entity);
    };
    /**
     * Gets entity mixed id.
     */
    EntityManager.prototype.getId = function (targetOrEntity, maybeEntity) {
        var target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        var entity = arguments.length === 2 ? maybeEntity : targetOrEntity;
        var metadata = this.connection.getMetadata(target);
        return metadata.getEntityIdMixedMap(entity);
    };
    /**
     * Creates a new entity instance or instances.
     * Can copy properties from the given object into new entities.
     */
    EntityManager.prototype.create = function (entityClass, plainObjectOrObjects) {
        var _this = this;
        var metadata = this.connection.getMetadata(entityClass);
        if (!plainObjectOrObjects)
            return metadata.create(this.queryRunner);
        if (plainObjectOrObjects instanceof Array)
            return plainObjectOrObjects.map(function (plainEntityLike) { return _this.create(entityClass, plainEntityLike); });
        var mergeIntoEntity = metadata.create(this.queryRunner);
        this.plainObjectToEntityTransformer.transform(mergeIntoEntity, plainObjectOrObjects, metadata, true);
        return mergeIntoEntity;
    };
    /**
     * Merges two entities into one new entity.
     */
    EntityManager.prototype.merge = function (entityClass, mergeIntoEntity) {
        var _this = this;
        var entityLikes = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            entityLikes[_i - 2] = arguments[_i];
        }
        var metadata = this.connection.getMetadata(entityClass);
        entityLikes.forEach(function (object) { return _this.plainObjectToEntityTransformer.transform(mergeIntoEntity, object, metadata); });
        return mergeIntoEntity;
    };
    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     */
    EntityManager.prototype.preload = function (entityClass, entityLike) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var metadata, plainObjectToDatabaseEntityTransformer, transformedEntity;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        metadata = this.connection.getMetadata(entityClass);
                        plainObjectToDatabaseEntityTransformer = new PlainObjectToDatabaseEntityTransformer_1.PlainObjectToDatabaseEntityTransformer(this.connection.manager);
                        return [4 /*yield*/, plainObjectToDatabaseEntityTransformer.transform(entityLike, metadata)];
                    case 1:
                        transformedEntity = _a.sent();
                        if (transformedEntity)
                            return [2 /*return*/, this.merge(entityClass, transformedEntity, entityLike)];
                        return [2 /*return*/, undefined];
                }
            });
        });
    };
    /**
     * Saves a given entity in the database.
     */
    EntityManager.prototype.save = function (targetOrEntity, maybeEntityOrOptions, maybeOptions) {
        // normalize mixed parameters
        var target = (arguments.length > 1 && (targetOrEntity instanceof Function || targetOrEntity instanceof index_1.EntitySchema || typeof targetOrEntity === "string")) ? targetOrEntity : undefined;
        var entity = target ? maybeEntityOrOptions : targetOrEntity;
        var options = target ? maybeOptions : maybeEntityOrOptions;
        if (target instanceof index_1.EntitySchema)
            target = target.options.name;
        // if user passed empty array of entities then we don't need to do anything
        if (entity instanceof Array && entity.length === 0)
            return Promise.resolve(entity);
        // execute save operation
        return new EntityPersistExecutor_1.EntityPersistExecutor(this.connection, this.queryRunner, "save", target, entity, options)
            .execute()
            .then(function () { return entity; });
    };
    /**
     * Removes a given entity from the database.
     */
    EntityManager.prototype.remove = function (targetOrEntity, maybeEntityOrOptions, maybeOptions) {
        // normalize mixed parameters
        var target = (arguments.length > 1 && (targetOrEntity instanceof Function || typeof targetOrEntity === "string")) ? targetOrEntity : undefined;
        var entity = target ? maybeEntityOrOptions : targetOrEntity;
        var options = target ? maybeOptions : maybeEntityOrOptions;
        // if user passed empty array of entities then we don't need to do anything
        if (entity instanceof Array && entity.length === 0)
            return Promise.resolve(entity);
        // execute save operation
        return new EntityPersistExecutor_1.EntityPersistExecutor(this.connection, this.queryRunner, "remove", target, entity, options)
            .execute()
            .then(function () { return entity; });
    };
    /**
     * Inserts a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     * You can execute bulk inserts using this method.
     */
    EntityManager.prototype.insert = function (target, entity, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var results;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.connection.driver instanceof OracleDriver_1.OracleDriver && entity instanceof Array)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(entity.map(function (entity) { return _this.insert(target, entity); }))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.reduce(function (mergedResult, result) { return Object.assign(mergedResult, result); }, {})];
                    case 2: return [2 /*return*/, this.createQueryBuilder()
                            .insert()
                            .into(target)
                            .values(entity)
                            .execute()];
                }
            });
        });
    };
    /**
     * Updates entity partially. Entity can be found by a given condition(s).
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient UPDATE query.
     * Does not check if entity exist in the database.
     * Condition(s) cannot be empty.
     */
    EntityManager.prototype.update = function (target, criteria, partialEntity, options) {
        // if user passed empty criteria or empty list of criterias, then throw an error
        if (criteria === undefined ||
            criteria === null ||
            criteria === "" ||
            (criteria instanceof Array && criteria.length === 0)) {
            return Promise.reject(new Error("Empty criteria(s) are not allowed for the update method."));
        }
        if (typeof criteria === "string" ||
            typeof criteria === "number" ||
            criteria instanceof Date ||
            criteria instanceof Array) {
            return this.createQueryBuilder()
                .update(target)
                .set(partialEntity)
                .whereInIds(criteria)
                .execute();
        }
        else {
            return this.createQueryBuilder()
                .update(target)
                .set(partialEntity)
                .where(criteria)
                .execute();
        }
    };
    /**
     * Deletes entities by a given condition(s).
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient DELETE query.
     * Does not check if entity exist in the database.
     * Condition(s) cannot be empty.
     */
    EntityManager.prototype.delete = function (targetOrEntity, criteria, options) {
        // if user passed empty criteria or empty list of criterias, then throw an error
        if (criteria === undefined ||
            criteria === null ||
            criteria === "" ||
            (criteria instanceof Array && criteria.length === 0)) {
            return Promise.reject(new Error("Empty criteria(s) are not allowed for the delete method."));
        }
        if (typeof criteria === "string" ||
            typeof criteria === "number" ||
            criteria instanceof Date ||
            criteria instanceof Array) {
            return this.createQueryBuilder()
                .delete()
                .from(targetOrEntity)
                .whereInIds(criteria)
                .execute();
        }
        else {
            return this.createQueryBuilder()
                .delete()
                .from(targetOrEntity)
                .where(criteria)
                .execute();
        }
    };
    /**
     * Counts entities that match given find options or conditions.
     * Useful for pagination.
     */
    EntityManager.prototype.count = function (entityClass, conditions, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var metadata, qb;
            return tslib_1.__generator(this, function (_a) {
                metadata = this.connection.getMetadata(entityClass);
                qb = this.createQueryBuilder(entityClass, metadata.name);
                qb.setFindOptions({
                    where: conditions,
                    options: options
                });
                return [2 /*return*/, qb.getCount()];
            });
        });
    };
    /**
     * Finds entities that match given find options or conditions.
     */
    EntityManager.prototype.find = function (entityClass, optionsOrConditions) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var metadata, qb;
            return tslib_1.__generator(this, function (_a) {
                metadata = this.connection.getMetadata(entityClass);
                qb = this.createQueryBuilder(entityClass, metadata.name);
                if (optionsOrConditions)
                    qb.setFindOptions(FindOptionsUtils_1.FindOptionsUtils.isFindOptions(optionsOrConditions) ? optionsOrConditions : { where: optionsOrConditions });
                return [2 /*return*/, qb.getMany()];
            });
        });
    };
    /**
     * Finds entities that match given find options and conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    EntityManager.prototype.findAndCount = function (entityClass, optionsOrConditions) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var metadata, qb;
            return tslib_1.__generator(this, function (_a) {
                metadata = this.connection.getMetadata(entityClass);
                qb = this.createQueryBuilder(entityClass, metadata.name);
                if (optionsOrConditions)
                    qb.setFindOptions(FindOptionsUtils_1.FindOptionsUtils.isFindOptions(optionsOrConditions) ? optionsOrConditions : { where: optionsOrConditions });
                return [2 /*return*/, qb.getManyAndCount()];
            });
        });
    };
    /**
     * Finds entities with ids.
     * Optionally find options or conditions can be applied.
     */
    EntityManager.prototype.findByIds = function (entityClass, ids, optionsOrConditions) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var metadata, qb, findOptions;
            return tslib_1.__generator(this, function (_a) {
                // if no ids passed, no need to execute a query - just return an empty array of values
                if (!ids.length)
                    return [2 /*return*/, Promise.resolve([])];
                metadata = this.connection.getMetadata(entityClass);
                qb = this.createQueryBuilder(entityClass, metadata.name);
                findOptions = {};
                if (FindOptionsUtils_1.FindOptionsUtils.isFindOptions(optionsOrConditions)) {
                    Object.assign(findOptions, optionsOrConditions);
                }
                else if (optionsOrConditions) {
                    Object.assign(findOptions, { where: optionsOrConditions });
                }
                // if (findOptions.where || metadata.primaryColumns.length > 1) {
                return [2 /*return*/, qb
                        .setFindOptions(findOptions)
                        .andWhereInIds(ids)
                        .getMany()];
            });
        });
    };
    /**
     * Finds first entity that matches given conditions.
     */
    EntityManager.prototype.findOne = function (entityClass, idOrOptionsOrConditions, maybeOptions) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var findOptions, options, metadata, qb;
            return tslib_1.__generator(this, function (_a) {
                findOptions = undefined;
                if (FindOptionsUtils_1.FindOptionsUtils.isFindOptions(idOrOptionsOrConditions)) {
                    findOptions = idOrOptionsOrConditions;
                }
                else if (maybeOptions && FindOptionsUtils_1.FindOptionsUtils.isFindOptions(maybeOptions)) {
                    findOptions = maybeOptions;
                }
                options = undefined;
                if (idOrOptionsOrConditions instanceof Object && !FindOptionsUtils_1.FindOptionsUtils.isFindOptions(idOrOptionsOrConditions))
                    options = idOrOptionsOrConditions;
                metadata = this.connection.getMetadata(entityClass);
                qb = this.createQueryBuilder(entityClass, metadata.name);
                // if (!findOptions || findOptions.loadEagerRelations !== false)
                //     FindOptionsUtils.joinEagerRelations(qb, qb.alias, qb.expressionMap.mainAlias!.metadata);
                if (findOptions) {
                    findOptions = tslib_1.__assign({}, (findOptions || {}), { take: 1 });
                    qb.setFindOptions(findOptions);
                }
                if (options) {
                    qb.where(options);
                }
                else if (typeof idOrOptionsOrConditions === "string" || typeof idOrOptionsOrConditions === "number" || idOrOptionsOrConditions instanceof Date) {
                    qb.andWhereInIds(metadata.ensureEntityIdMap(idOrOptionsOrConditions));
                }
                return [2 /*return*/, qb.getOne()];
            });
        });
    };
    /**
     * Finds first entity that matches given conditions or rejects the returned promise on error.
     */
    EntityManager.prototype.findOneOrFail = function (entityClass, idOrOptionsOrConditions, maybeOptions) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.findOne(entityClass, idOrOptionsOrConditions, maybeOptions).then(function (value) {
                        if (value === undefined) {
                            return Promise.reject(new EntityNotFoundError_1.EntityNotFoundError(entityClass, idOrOptionsOrConditions));
                        }
                        return Promise.resolve(value);
                    })];
            });
        });
    };
    /**
     * Finds entities that match given options and returns observable.
     * Whenever new data appears that matches given query observable emits new value.
     */
    EntityManager.prototype.observe = function (entityClass, optionsOrConditions) {
        var metadata = this.connection.getMetadata(entityClass);
        return new QueryObserver_1.QueryObserver(this.connection, "find", metadata, optionsOrConditions).observe();
    };
    /**
     * Finds entities and count that match given options and returns observable.
     * Whenever new data appears that matches given query observable emits new value.
     */
    EntityManager.prototype.observeManyAndCount = function (entityClass, optionsOrConditions) {
        var metadata = this.connection.getMetadata(entityClass);
        return new QueryObserver_1.QueryObserver(this.connection, "findAndCount", metadata, optionsOrConditions).observe();
    };
    /**
     * Finds entity that match given options and returns observable.
     * Whenever new data appears that matches given query observable emits new value.
     */
    EntityManager.prototype.observeOne = function (entityClass, optionsOrConditions) {
        var metadata = this.connection.getMetadata(entityClass);
        return new QueryObserver_1.QueryObserver(this.connection, "findOne", metadata, optionsOrConditions).observe();
    };
    /**
     * Gets the entities count match given options and returns observable.
     * Whenever new data appears that matches given query observable emits new value.
     */
    EntityManager.prototype.observeCount = function (entityClass, optionsOrConditions) {
        var metadata = this.connection.getMetadata(entityClass);
        return new QueryObserver_1.QueryObserver(this.connection, "count", metadata, optionsOrConditions).observe();
    };
    /**
     * Clears all the data from the given table (truncates/drops it).
     *
     * Note: this method uses TRUNCATE and may not work as you expect in transactions on some platforms.
     * @see https://stackoverflow.com/a/5972738/925151
     */
    EntityManager.prototype.clear = function (entityClass) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var metadata, queryRunner;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        metadata = this.connection.getMetadata(entityClass);
                        queryRunner = this.queryRunner || this.connection.createQueryRunner("master");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 6]);
                        return [4 /*yield*/, queryRunner.clearTable(metadata.tablePath)];
                    case 2: return [2 /*return*/, _a.sent()]; // await is needed here because we are using finally
                    case 3:
                        if (!!this.queryRunner) return [3 /*break*/, 5];
                        return [4 /*yield*/, queryRunner.release()];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Increments some column by provided value of the entities matched given conditions.
     */
    EntityManager.prototype.increment = function (entityClass, conditions, propertyPath, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var metadata, column, values;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                metadata = this.connection.getMetadata(entityClass);
                column = metadata.findColumnWithPropertyPath(propertyPath);
                if (!column)
                    throw new Error("Column " + propertyPath + " was not found in " + metadata.targetName + " entity.");
                if (isNaN(Number(value)))
                    throw new Error("Value \"" + value + "\" is not a number.");
                values = propertyPath
                    .split(".")
                    .reduceRight(function (value, key) {
                    var _a;
                    return (_a = {}, _a[key] = value, _a);
                }, function () { return _this.connection.driver.escape(column.databaseName) + " + " + value; });
                return [2 /*return*/, this
                        .createQueryBuilder(entityClass, "entity")
                        .update(entityClass)
                        .set(values)
                        .where(conditions)
                        .execute()];
            });
        });
    };
    /**
     * Decrements some column by provided value of the entities matched given conditions.
     */
    EntityManager.prototype.decrement = function (entityClass, conditions, propertyPath, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var metadata, column, values;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                metadata = this.connection.getMetadata(entityClass);
                column = metadata.findColumnWithPropertyPath(propertyPath);
                if (!column)
                    throw new Error("Column " + propertyPath + " was not found in " + metadata.targetName + " entity.");
                if (isNaN(Number(value)))
                    throw new Error("Value \"" + value + "\" is not a number.");
                values = propertyPath
                    .split(".")
                    .reduceRight(function (value, key) {
                    var _a;
                    return (_a = {}, _a[key] = value, _a);
                }, function () { return _this.connection.driver.escape(column.databaseName) + " - " + value; });
                return [2 /*return*/, this
                        .createQueryBuilder(entityClass, "entity")
                        .update(entityClass)
                        .set(values)
                        .where(conditions)
                        .execute()];
            });
        });
    };
    /**
     * Gets repository for the given entity class or name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    EntityManager.prototype.getRepository = function (target) {
        // throw exception if there is no repository with this target registered
        if (!this.connection.hasMetadata(target))
            throw new RepositoryNotFoundError_1.RepositoryNotFoundError(this.connection.name, target);
        // find already created repository instance and return it if found
        var metadata = this.connection.getMetadata(target);
        var repository = this.repositories.find(function (repository) { return repository.metadata === metadata; });
        if (repository)
            return repository;
        // if repository was not found then create it, store its instance and return it
        var newRepository = new RepositoryFactory_1.RepositoryFactory().create(this, metadata, this.queryRunner);
        this.repositories.push(newRepository);
        return newRepository;
    };
    /**
     * Gets tree repository for the given entity class or name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    EntityManager.prototype.getTreeRepository = function (target) {
        // tree tables aren't supported by some drivers (mongodb)
        if (this.connection.driver.treeSupport === false)
            throw new TreeRepositoryNotSupportedError_1.TreeRepositoryNotSupportedError(this.connection.driver);
        // check if repository is real tree repository
        var repository = this.getRepository(target);
        if (!(repository instanceof TreeRepository_1.TreeRepository))
            throw new RepositoryNotTreeError_1.RepositoryNotTreeError(target);
        return repository;
    };
    /**
     * Gets mongodb repository for the given entity class.
     */
    EntityManager.prototype.getMongoRepository = function (target) {
        return this.connection.getMongoRepository(target);
    };
    /**
     * Gets custom entity repository marked with @EntityRepository decorator.
     */
    EntityManager.prototype.getCustomRepository = function (customRepository) {
        var entityRepositoryMetadataArgs = index_1.getMetadataArgsStorage().entityRepositories.find(function (repository) {
            return repository.target === (customRepository instanceof Function ? customRepository : customRepository.constructor);
        });
        if (!entityRepositoryMetadataArgs)
            throw new CustomRepositoryNotFoundError_1.CustomRepositoryNotFoundError(customRepository);
        var entityMetadata = entityRepositoryMetadataArgs.entity ? this.connection.getMetadata(entityRepositoryMetadataArgs.entity) : undefined;
        var entityRepositoryInstance = new entityRepositoryMetadataArgs.target(this, entityMetadata);
        // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
        // however we need these properties for internal work of the class
        if (entityRepositoryInstance instanceof AbstractRepository_1.AbstractRepository) {
            if (!entityRepositoryInstance["manager"])
                entityRepositoryInstance["manager"] = this;
        }
        if (entityRepositoryInstance instanceof Repository_1.Repository) {
            if (!entityMetadata)
                throw new CustomRepositoryCannotInheritRepositoryError_1.CustomRepositoryCannotInheritRepositoryError(customRepository);
            entityRepositoryInstance["manager"] = this;
            entityRepositoryInstance["metadata"] = entityMetadata;
        }
        return entityRepositoryInstance;
    };
    /**
     * Releases all resources used by entity manager.
     * This is used when entity manager is created with a single query runner,
     * and this single query runner needs to be released after job with entity manager is done.
     */
    EntityManager.prototype.release = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                if (!this.queryRunner)
                    throw new NoNeedToReleaseEntityManagerError_1.NoNeedToReleaseEntityManagerError();
                return [2 /*return*/, this.queryRunner.release()];
            });
        });
    };
    return EntityManager;
}());
exports.EntityManager = EntityManager;

//# sourceMappingURL=EntityManager.js.map
