"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var TransactionAlreadyStartedError_1 = require("../../error/TransactionAlreadyStartedError");
var TransactionNotStartedError_1 = require("../../error/TransactionNotStartedError");
var TableColumn_1 = require("../../schema-builder/table/TableColumn");
var Table_1 = require("../../schema-builder/table/Table");
var TableForeignKey_1 = require("../../schema-builder/table/TableForeignKey");
var TableIndex_1 = require("../../schema-builder/table/TableIndex");
var QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
var SpannerDriver_1 = require("./SpannerDriver");
var SpannerRawTypes_1 = require("./SpannerRawTypes");
var SpannerDDLTransformer_1 = require("./SpannerDDLTransformer");
var RandomGenerator_1 = require("../../util/RandomGenerator");
var QueryFailedError_1 = require("../../error/QueryFailedError");
var TableUnique_1 = require("../../schema-builder/table/TableUnique");
var BaseQueryRunner_1 = require("../../query-runner/BaseQueryRunner");
var Broadcaster_1 = require("../../subscriber/Broadcaster");
var index_1 = require("../../index");
/**
 * Runs queries on a single mysql database connection.
 */
var SpannerQueryRunner = /** @class */ (function (_super) {
    tslib_1.__extends(SpannerQueryRunner, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function SpannerQueryRunner(driver) {
        var _this = _super.call(this) || this;
        _this.driver = driver;
        _this.disableDDLParser = false;
        _this.connection = driver.connection;
        _this.broadcaster = new Broadcaster_1.Broadcaster(_this);
        return _this;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    SpannerQueryRunner.prototype.connect = function () {
        var _this = this;
        if (!this.databaseConnection) {
            return (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var _a;
                return tslib_1.__generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this;
                            return [4 /*yield*/, this.driver.getDatabaseHandle()];
                        case 1:
                            _a.databaseConnection = _b.sent();
                            return [2 /*return*/];
                    }
                });
            }); })();
        }
        return Promise.resolve(this.databaseConnection);
    };
    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    SpannerQueryRunner.prototype.release = function () {
        return Promise.resolve();
    };
    /**
     * Starts transaction on the current connection.
     */
    SpannerQueryRunner.prototype.startTransaction = function (isolationLevel) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                if (!this.driver.enableTransaction) {
                    //console.log('startTransaction(ignored)');
                    return [2 /*return*/, Promise.resolve()];
                }
                //console.log('startTransaction');
                if (this.isTransactionActive)
                    throw new TransactionAlreadyStartedError_1.TransactionAlreadyStartedError();
                this.isTransactionActive = true;
                return [2 /*return*/, this.connect().then(function (db) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var _a;
                        return tslib_1.__generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = this;
                                    return [4 /*yield*/, this.databaseConnection.getTransaction()];
                                case 1:
                                    _a.tx = (_b.sent())[0];
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    SpannerQueryRunner.prototype.commitTransaction = function () {
        var _this = this;
        if (!this.driver.enableTransaction) {
            //console.log('commitTransaction(ignored)');
            return Promise.resolve();
        }
        //console.log('commitTransaction');
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError_1.TransactionNotStartedError();
        return new Promise(function (res, rej) { return _this.tx.commit(function (err, _) {
            //console.log('commitTransaction cb', err, _);
            if (err) {
                rej(err);
            }
            else {
                _this.tx = null;
                _this.isTransactionActive = false;
                res();
            }
        }); });
    };
    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    SpannerQueryRunner.prototype.rollbackTransaction = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.driver.enableTransaction) {
                            //console.log('rollbackTransaction(ignored)');
                            return [2 /*return*/, Promise.resolve()];
                        }
                        if (!this.isTransactionActive)
                            throw new TransactionNotStartedError_1.TransactionNotStartedError();
                        return [4 /*yield*/, new Promise(function (res, rej) { return _this.tx.rollback(function (err, _) {
                                if (err) {
                                    rej(err);
                                }
                                else {
                                    _this.tx = null;
                                    _this.isTransactionActive = false;
                                    res();
                                }
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run provided function in transaction.
     * internally it may use start/commit Transaction.
     * Error will be thrown if transaction start/commit will fails
     */
    SpannerQueryRunner.prototype.runInTransaction = function (runInTransaction, isolationLevel) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (res, rej) {
                        _this.connect().then(function (db) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var _this = this;
                            return tslib_1.__generator(this, function (_a) {
                                this.databaseConnection.runTransaction(function (err, tx) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                    var r;
                                    var _this = this;
                                    return tslib_1.__generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (err) {
                                                    tx.rollback(function (err2) {
                                                        if (err2) {
                                                            rej(err2);
                                                        }
                                                        else {
                                                            rej(err);
                                                        }
                                                    });
                                                    return [2 /*return*/];
                                                }
                                                this.tx = tx;
                                                this.isTransactionActive = true;
                                                return [4 /*yield*/, runInTransaction(this.manager)];
                                            case 1:
                                                r = _a.sent();
                                                tx.commit(function (err2, _) {
                                                    if (err2) {
                                                        rej(err2);
                                                    }
                                                    else {
                                                        _this.tx = null;
                                                        _this.isTransactionActive = false;
                                                        res(r);
                                                    }
                                                });
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                return [2 /*return*/];
                            });
                        }); });
                    })];
            });
        });
    };
    /**
     * Executes sql used special for schema build.
     */
    SpannerQueryRunner.prototype.executeQueries = function (upQueries, downQueries) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.disableDDLParser = true;
                        return [4 /*yield*/, _super.prototype.executeQueries.call(this, upQueries, downQueries)];
                    case 1:
                        _a.sent();
                        this.disableDDLParser = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes a raw SQL query.
     */
    SpannerQueryRunner.prototype.query = function (query, parameters) {
        var _this = this;
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        // handle administrative queries.
        var m;
        if ((m = query.match(/^\s*(CREATE|DROP|ALTER)\s+(.+)/))) {
            return this.handleAdministrativeQuery(m[1], m);
        }
        else if (!query.match(/^\s*SELECT\s+(.+)/)) {
            throw new Error("the query cannot handle by this function: " + query);
        }
        return new Promise(function (ok, fail) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var db, _a, params, types, queryStartTime_1, err_1;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.connect()];
                    case 1:
                        _b.sent();
                        db = this.tx || this.databaseConnection;
                        parameters = parameters || [];
                        _a = tslib_1.__read(parameters, 2), params = _a[0], types = _a[1];
                        //console.log('query', query, params, types);
                        this.driver.connection.logger.logQuery(query, params, this);
                        queryStartTime_1 = +new Date();
                        db.run({ sql: query, params: params, types: types, json: true }, function (err, result) {
                            // log slow queries if maxQueryExecution time is set
                            var maxQueryExecutionTime = _this.driver.connection.options.maxQueryExecutionTime;
                            var queryEndTime = +new Date();
                            var queryExecutionTime = queryEndTime - queryStartTime_1;
                            //console.log('query time', queryExecutionTime, 'ms');
                            if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                                _this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, _this);
                            if (err) {
                                _this.driver.connection.logger.logQueryError(err, query, parameters, _this);
                                fail(new QueryFailedError_1.QueryFailedError(query, parameters, err));
                                return;
                            }
                            //console.log('query()', result);
                            ok(result);
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _b.sent();
                        fail(err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * execute query. call from XXXQueryBuilder
     */
    SpannerQueryRunner.prototype.queryByBuilder = function (qb) {
        var _this = this;
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        var fmaps = {
            select: this.select,
            insert: this.insert,
            update: this.update,
            delete: this.delete
        };
        return this.connect().then(function () {
            return fmaps[qb.expressionMap.queryType].call(_this, qb);
        });
    };
    SpannerQueryRunner.prototype.queryByBuilderAndParams = function (qb, sql, params) {
        return this.query(sql, params);
    };
    /**
     * Returns raw data stream.
     */
    SpannerQueryRunner.prototype.stream = function (query, parameters, onEnd, onError) {
        var _this = this;
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        return new Promise(function (ok, fail) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var db, _a, params, types, stream, err_2;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.connect()];
                    case 1:
                        _b.sent();
                        db = this.databaseConnection;
                        this.driver.connection.logger.logQuery(query, parameters, this);
                        parameters = parameters || [];
                        _a = tslib_1.__read(parameters, 2), params = _a[0], types = _a[1];
                        stream = db.runStream({ sql: query, params: params, types: types });
                        if (onEnd)
                            stream.on("end", onEnd);
                        if (onError)
                            stream.on("error", onError);
                        ok(stream);
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _b.sent();
                        fail(err_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Returns all available database names including system databases.
     */
    SpannerQueryRunner.prototype.getDatabases = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.driver.getDatabases()];
            });
        });
    };
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    SpannerQueryRunner.prototype.getSchemas = function (database) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: getSchemas");
            });
        });
    };
    /**
     * Checks if database with the given name exist.
     */
    SpannerQueryRunner.prototype.hasDatabase = function (database) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.connect().then(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var dbs;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.driver.getDatabases()];
                                case 1:
                                    dbs = _a.sent();
                                    return [2 /*return*/, dbs.indexOf(database) >= 0];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Checks if schema with the given name exist.
     */
    SpannerQueryRunner.prototype.hasSchema = function (schema) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: hasSchema");
            });
        });
    };
    /**
     * Checks if table with the given name exist in the database.
     */
    SpannerQueryRunner.prototype.hasTable = function (tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.connect().then(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var table;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.driver.loadTables(tableOrName)];
                                case 1:
                                    table = _a.sent();
                                    //console.log('hasTable', tableOrName, !!table[0]);
                                    return [2 /*return*/, !!table[0]];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Checks if column with the given name exist in the given table.
     */
    SpannerQueryRunner.prototype.hasColumn = function (tableOrName, column) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.connect().then(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var tables;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.driver.loadTables(tableOrName)];
                                case 1:
                                    tables = _a.sent();
                                    return [2 /*return*/, !!tables[0].columns.find(function (c) {
                                            if (typeof column === 'string' && c.name == column) {
                                                return true;
                                            }
                                            else if (column instanceof TableColumn_1.TableColumn && c.name == column.name) {
                                                return true;
                                            }
                                            return false;
                                        })];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Creates a new database.
     */
    SpannerQueryRunner.prototype.createDatabase = function (database, ifNotExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var up, down;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        up = ifNotExist ? "CREATE DATABASE IF NOT EXISTS `" + database + "`" : "CREATE DATABASE `" + database + "`";
                        down = "DROP DATABASE `" + database + "`";
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops database.
     */
    SpannerQueryRunner.prototype.dropDatabase = function (database, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var up, down;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        up = ifExist ? "DROP DATABASE IF EXISTS `" + database + "`" : "DROP DATABASE `" + database + "`";
                        down = "CREATE DATABASE `" + database + "`";
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new table schema.
     */
    SpannerQueryRunner.prototype.createSchema = function (schema, ifNotExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: createSchema");
            });
        });
    };
    /**
     * Drops table schema.
     */
    SpannerQueryRunner.prototype.dropSchema = function (schemaPath, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: dropSchema");
            });
        });
    };
    /**
     * Creates a new table. aka 'schema' on spanner
     * note that foreign key always dropped regardless the value of createForeignKeys.
     * because our foreignkey analogue is achieved by interleaved table
     */
    SpannerQueryRunner.prototype.createTable = function (table, ifNotExist, createForeignKeys) {
        if (ifNotExist === void 0) { ifNotExist = false; }
        if (createForeignKeys === void 0) { createForeignKeys = true; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var isTableExist, upQueries, downQueries;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!ifNotExist) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.hasTable(table)];
                    case 1:
                        isTableExist = _a.sent();
                        if (isTableExist)
                            return [2 /*return*/, Promise.resolve()];
                        _a.label = 2;
                    case 2:
                        upQueries = [];
                        downQueries = [];
                        // create table sql.
                        upQueries.push(this.createTableSql(table));
                        downQueries.push(this.dropTableSql(table));
                        console.log('createTable', "sql=[" + upQueries[0] + "]");
                        // create indexes. unique constraint will be integrated with unique index.
                        if (table.uniques.length > 0) {
                            table.uniques.forEach(function (unique) {
                                var uniqueExist = table.indices.some(function (index) { return index.name === unique.name; });
                                if (!uniqueExist) {
                                    table.indices.push(new TableIndex_1.TableIndex({
                                        name: unique.name,
                                        columnNames: unique.columnNames,
                                        isUnique: true
                                    }));
                                }
                            });
                        }
                        if (table.indices.length > 0) {
                            table.indices.forEach(function (index) {
                                upQueries.push(_this.createIndexSql(table, index));
                                downQueries.push(_this.dropIndexSql(table, index));
                            });
                        }
                        // we don't drop foreign key itself. because its created with table
                        // if (createForeignKeys)
                        // table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 3:
                        // we don't drop foreign key itself. because its created with table
                        // if (createForeignKeys)
                        // table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));
                        _a.sent();
                        // super.replaceCachedTable will be ignored because new table should not be loaded before.
                        this.replaceCachedTable(table, table);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drop the table.
     * note that foreign key always dropped regardless the value of dropForeignKeys.
     * because our foreignkey analogue is achieved by interleaved table
     */
    SpannerQueryRunner.prototype.dropTable = function (target, ifExist, dropForeignKeys) {
        if (dropForeignKeys === void 0) { dropForeignKeys = true; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var isTableExist, tableName, table, upQueries, downQueries;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!ifExist) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.hasTable(target)];
                    case 1:
                        isTableExist = _a.sent();
                        if (!isTableExist)
                            return [2 /*return*/, Promise.resolve()];
                        _a.label = 2;
                    case 2:
                        tableName = target instanceof Table_1.Table ? target.name : target;
                        return [4 /*yield*/, this.getCachedTable(tableName)];
                    case 3:
                        table = _a.sent();
                        upQueries = [];
                        downQueries = [];
                        // if (dropForeignKeys)
                        // table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));
                        if (table.indices.length > 0) {
                            table.indices.forEach(function (index) {
                                upQueries.push(_this.dropIndexSql(table, index));
                                downQueries.push(_this.createIndexSql(table, index));
                            });
                        }
                        upQueries.push(this.dropTableSql(table));
                        downQueries.push(this.createTableSql(table));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _a.sent();
                        // remove table from cache
                        this.replaceCachedTable(table, null);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Renames a table.
     */
    SpannerQueryRunner.prototype.renameTable = function (oldTableOrName, newTableName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                // TODO: re-create table
                throw new Error("NYI: spanner: renameTable");
            });
        });
    };
    /**
     * Creates a new column from the column in the table.
     */
    SpannerQueryRunner.prototype.addColumn = function (tableOrName, column) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, clonedTable, upQueries, downQueries, skipColumnLevelPrimary, columnIndex, uniqueIndex;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        clonedTable = table.clone();
                        upQueries = [];
                        downQueries = [];
                        skipColumnLevelPrimary = clonedTable.primaryColumns.length > 0;
                        upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD " + this.buildCreateColumnSql(column, skipColumnLevelPrimary, false));
                        downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP COLUMN `" + column.name + "`");
                        // create or update primary key constraint
                        if (column.isPrimary) {
                            // TODO: re-create table
                            throw new Error("NYI: spanner: addColumn column.isPrimary");
                            /*
                            // if we already have generated column, we must temporary drop AUTO_INCREMENT property.
                            const generatedColumn = clonedTable.columns.find(column => column.isGenerated && column.generationStrategy === "increment");
                            if (generatedColumn) {
                                const nonGeneratedColumn = generatedColumn.clone();
                                nonGeneratedColumn.isGenerated = false;
                                nonGeneratedColumn.generationStrategy = undefined;
                                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${column.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`);
                                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(column, true)}`);
                            }
                
                            const primaryColumns = clonedTable.primaryColumns;
                            let columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
                            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
                
                            primaryColumns.push(column);
                            columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${columnNames})`);
                            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP PRIMARY KEY`);
                
                            // if we previously dropped AUTO_INCREMENT property, we must bring it back
                            if (generatedColumn) {
                                const nonGeneratedColumn = generatedColumn.clone();
                                nonGeneratedColumn.isGenerated = false;
                                nonGeneratedColumn.generationStrategy = undefined;
                                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(column, true)}`);
                                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${column.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`);
                            }
                            */
                        }
                        columnIndex = clonedTable.indices.find(function (index) { return index.columnNames.length === 1 && index.columnNames[0] === column.name; });
                        if (columnIndex) {
                            upQueries.push(this.createIndexSql(table, columnIndex));
                            downQueries.push(this.dropIndexSql(table, columnIndex));
                        }
                        else if (column.isUnique) {
                            uniqueIndex = new TableIndex_1.TableIndex({
                                name: this.connection.namingStrategy.indexName(table.name, [column.name]),
                                columnNames: [column.name],
                                isUnique: true
                            });
                            clonedTable.indices.push(uniqueIndex);
                            clonedTable.uniques.push(new TableUnique_1.TableUnique({
                                name: uniqueIndex.name,
                                columnNames: uniqueIndex.columnNames
                            }));
                            upQueries.push(this.createIndexSql(table, uniqueIndex));
                            downQueries.push(this.dropIndexSql(table, uniqueIndex));
                        }
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _b.sent();
                        clonedTable.addColumn(column);
                        this.replaceCachedTable(table, clonedTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new columns from the column in the table.
     */
    SpannerQueryRunner.prototype.addColumns = function (tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, index_1.PromiseUtils.runInSequence(columns, function (column) { return _this.addColumn(tableOrName, column); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Renames column in the given table.
     */
    SpannerQueryRunner.prototype.renameColumn = function (tableOrName, oldTableColumnOrName, newTableColumnOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: renameColumn. you can remove column first, then create with the same name.");
            });
        });
    };
    /**
     * Changes a column in the table.
     * according to https://cloud.google.com/spanner/docs/schema-updates, only below are allowed
     * - Change a STRING column to a BYTES column or a BYTES column to a STRING column.
     * - Increase or decrease the length limit for a STRING or BYTES type (including to MAX), unless it is a primary key column inherited by one or more child tables.
     * - Add/Remove NOT NULL constraint for non-key column
     * - Enable or disable commit timestamps in value and primary key columns.
     */
    SpannerQueryRunner.prototype.changeColumn = function (tableOrName, oldColumnOrName, newColumn) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, clonedTable, upQueries, downQueries, oldColumn;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        clonedTable = table.clone();
                        upQueries = [];
                        downQueries = [];
                        oldColumn = oldColumnOrName instanceof TableColumn_1.TableColumn
                            ? oldColumnOrName
                            : table.columns.find(function (column) { return column.name === oldColumnOrName; });
                        if (!oldColumn)
                            throw new Error("Column \"" + oldColumnOrName + "\" was not found in the \"" + table.name + "\" table.");
                        if (oldColumn.name !== newColumn.name) {
                            throw new Error("NYI: spanner: changeColumn " + oldColumn.name + ": change column name " + oldColumn.name + " => " + newColumn.name);
                        }
                        if (oldColumn.type !== newColumn.type) {
                            // - Change a STRING column to a BYTES column or a BYTES column to a STRING column.
                            if (!(oldColumn.type === "string" && newColumn.type === "bytes") &&
                                !(oldColumn.type === "bytes" && newColumn.type === "string")) {
                                throw new Error("NYI: spanner: changeColumn " + oldColumn.name + ": change column type " + oldColumn.type + " => " + newColumn.type);
                            }
                        }
                        if (oldColumn.length && newColumn.length && (oldColumn.length !== newColumn.length)) {
                            // - Increase or decrease the length limit for a STRING or BYTES type (including to MAX)
                            if (!(oldColumn.type === "string" && newColumn.type === "bytes") &&
                                !(oldColumn.type === "bytes" && newColumn.type === "string")) {
                                throw new Error("NYI: spanner: changeColumn " + oldColumn.name + ": change column type " + oldColumn.type + " => " + newColumn.type);
                            }
                            // TODO: implement following check.
                            // `unless it is a primary key column inherited by one or more child tables.`
                        }
                        if (oldColumn.isNullable !== newColumn.isNullable) {
                            // - Add/Remove NOT NULL constraint for non-key column
                            if (clonedTable.indices.find(function (index) {
                                return index.columnNames.length === 1 && index.columnNames[0] === newColumn.name;
                            })) {
                                throw new Error("NYI: spanner: changeColumn " + oldColumn.name + ": change nullable for " + oldColumn.name + ", which is indexed");
                            }
                        }
                        // - Enable or disable commit timestamps in value and primary key columns.
                        if (oldColumn.default !== newColumn.default) {
                            if (newColumn.default !== SpannerDriver_1.SpannerColumnUpdateWithCommitTimestamp &&
                                oldColumn.default !== SpannerDriver_1.SpannerColumnUpdateWithCommitTimestamp) {
                                console.log("oldColumn:" + JSON.stringify(oldColumn));
                                throw new Error("NYI: spanner: changeColumn " + oldColumn.name + ": set default " + oldColumn.default + " => " + newColumn.default);
                            }
                        }
                        // any other invalid changes
                        if (oldColumn.isPrimary !== newColumn.isPrimary ||
                            oldColumn.asExpression !== newColumn.asExpression ||
                            oldColumn.charset !== newColumn.charset ||
                            oldColumn.collation !== newColumn.collation ||
                            // comment is not supported by spanner
                            // default is managed by schemas table.
                            oldColumn.enum !== newColumn.enum ||
                            oldColumn.generatedType !== newColumn.generatedType ||
                            // generationStorategy is managed by schemas table
                            oldColumn.isArray !== newColumn.isArray
                        // isGenerated is managed by schemas table
                        ) {
                            throw new Error("NYI: spanner: changeColumn " + oldColumn.name + ": not supported change " + JSON.stringify(oldColumn) + " => " + JSON.stringify(newColumn));
                        }
                        // if actually changed, store SQLs
                        if (this.isColumnChanged(oldColumn, newColumn, true)) {
                            upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ALTER COLUMN `" + oldColumn.name + "` " + this.buildCreateColumnSql(newColumn, true));
                            downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ALTER COLUMN `" + newColumn.name + "` " + this.buildCreateColumnSql(oldColumn, true));
                        }
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _b.sent();
                        this.replaceCachedTable(table, clonedTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Changes a column in the table.
     */
    SpannerQueryRunner.prototype.changeColumns = function (tableOrName, changedColumns) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, index_1.PromiseUtils.runInSequence(changedColumns, function (changedColumn) { return _this.changeColumn(tableOrName, changedColumn.oldColumn, changedColumn.newColumn); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops column in the table.
     */
    SpannerQueryRunner.prototype.dropColumn = function (tableOrName, columnOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, column, clonedTable, upQueries, downQueries, columnIndex, uniqueName_1, foundUnique, indexName_1, foundIndex;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        column = columnOrName instanceof TableColumn_1.TableColumn ? columnOrName : table.findColumnByName(columnOrName);
                        if (!column)
                            throw new Error("Column \"" + columnOrName + "\" was not found in table \"" + table.name + "\"");
                        clonedTable = table.clone();
                        upQueries = [];
                        downQueries = [];
                        // drop primary key constraint
                        if (column.isPrimary) {
                            throw new Error("NYI: spanner: dropColumn column.isPrimary");
                            /*
                            // if table have generated column, we must drop AUTO_INCREMENT before changing primary constraints.
                            const generatedColumn = clonedTable.columns.find(column => column.isGenerated && column.generationStrategy === "increment");
                            if (generatedColumn) {
                                const nonGeneratedColumn = generatedColumn.clone();
                                nonGeneratedColumn.isGenerated = false;
                                nonGeneratedColumn.generationStrategy = undefined;
                
                                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${generatedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`);
                                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(generatedColumn, true)}`);
                            }
                
                            // dropping primary key constraint
                            const columnNames = clonedTable.primaryColumns.map(primaryColumn => `\`${primaryColumn.name}\``).join(", ");
                            upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP PRIMARY KEY`);
                            downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD PRIMARY KEY (${columnNames})`);
                
                            // update column in table
                            const tableColumn = clonedTable.findColumnByName(column.name);
                            tableColumn!.isPrimary = false;
                
                            // if primary key have multiple columns, we must recreate it without dropped column
                            if (clonedTable.primaryColumns.length > 0) {
                                const columnNames = clonedTable.primaryColumns.map(primaryColumn => `\`${primaryColumn.name}\``).join(", ");
                                upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD PRIMARY KEY (${columnNames})`);
                                downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP PRIMARY KEY`);
                            }
                
                            // if we have generated column, and we dropped AUTO_INCREMENT property before, and this column is not current dropping column, we must bring it back
                            if (generatedColumn && generatedColumn.name !== column.name) {
                                const nonGeneratedColumn = generatedColumn.clone();
                                nonGeneratedColumn.isGenerated = false;
                                nonGeneratedColumn.generationStrategy = undefined;
                
                                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(generatedColumn, true)}`);
                                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} CHANGE \`${generatedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`);
                            }
                            */
                        }
                        columnIndex = clonedTable.indices.find(function (index) { return index.columnNames.length === 1 && index.columnNames[0] === column.name; });
                        if (columnIndex) {
                            clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
                            upQueries.push(this.dropIndexSql(table, columnIndex));
                            downQueries.push(this.createIndexSql(table, columnIndex));
                        }
                        else if (column.isUnique) {
                            uniqueName_1 = this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]);
                            foundUnique = clonedTable.uniques.find(function (unique) { return unique.name === uniqueName_1; });
                            if (foundUnique)
                                clonedTable.uniques.splice(clonedTable.uniques.indexOf(foundUnique), 1);
                            indexName_1 = this.connection.namingStrategy.indexName(table.name, [column.name]);
                            foundIndex = clonedTable.indices.find(function (index) { return index.name === indexName_1; });
                            if (foundIndex) {
                                clonedTable.indices.splice(clonedTable.indices.indexOf(foundIndex), 1);
                                upQueries.push(this.dropIndexSql(table, foundIndex));
                                downQueries.push(this.createIndexSql(table, foundIndex));
                            }
                        }
                        upQueries.push("ALTER TABLE " + this.escapeTableName(table) + " DROP COLUMN `" + column.name + "`");
                        downQueries.push("ALTER TABLE " + this.escapeTableName(table) + " ADD " + this.buildCreateColumnSql(column, true));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _b.sent();
                        clonedTable.removeColumn(column);
                        this.replaceCachedTable(table, clonedTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops the columns in the table.
     */
    SpannerQueryRunner.prototype.dropColumns = function (tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, index_1.PromiseUtils.runInSequence(columns, function (column) { return _this.dropColumn(tableOrName, column); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new primary key.
     */
    SpannerQueryRunner.prototype.createPrimaryKey = function (tableOrName, columnNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: createPrimaryKey");
            });
        });
    };
    /**
     * Updates composite primary keys.
     */
    SpannerQueryRunner.prototype.updatePrimaryKeys = function (tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: updatePrimaryKeys");
            });
        });
    };
    /**
     * Drops a primary key.
     */
    SpannerQueryRunner.prototype.dropPrimaryKey = function (tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: dropPrimaryKey");
            });
        });
    };
    /**
     * Creates a new unique constraint.
     */
    SpannerQueryRunner.prototype.createUniqueConstraint = function (tableOrName, uniqueConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: createUniqueConstraint");
            });
        });
    };
    /**
     * Creates a new unique constraints.
     */
    SpannerQueryRunner.prototype.createUniqueConstraints = function (tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: createUniqueConstraints");
            });
        });
    };
    /**
     * Drops an unique constraint.
     */
    SpannerQueryRunner.prototype.dropUniqueConstraint = function (tableOrName, uniqueOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: dropUniqueConstraint");
            });
        });
    };
    /**
     * Drops an unique constraints.
     */
    SpannerQueryRunner.prototype.dropUniqueConstraints = function (tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: dropUniqueConstraints");
            });
        });
    };
    /**
     * Creates a new check constraint.
     */
    SpannerQueryRunner.prototype.createCheckConstraint = function (tableOrName, checkConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: createCheckConstraint");
            });
        });
    };
    /**
     * Creates a new check constraints.
     */
    SpannerQueryRunner.prototype.createCheckConstraints = function (tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: createCheckConstraints");
            });
        });
    };
    /**
     * Drops check constraint.
     */
    SpannerQueryRunner.prototype.dropCheckConstraint = function (tableOrName, checkOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: dropCheckConstraint");
            });
        });
    };
    /**
     * Drops check constraints.
     */
    SpannerQueryRunner.prototype.dropCheckConstraints = function (tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("NYI: spanner: dropCheckConstraints");
            });
        });
    };
    /**
     * Creates a new foreign key. in spanner, it creates corresponding index too
     */
    SpannerQueryRunner.prototype.createForeignKey = function (tableOrName, foreignKey) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        // new FK may be passed without name. In this case we generate FK name manually.
                        if (!foreignKey.name)
                            foreignKey.name = this.connection.namingStrategy.foreignKeyName(table.name, foreignKey.columnNames);
                        up = this.createForeignKeySql(table, foreignKey);
                        down = this.dropForeignKeySql(table, foreignKey);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.addForeignKey(foreignKey);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new foreign keys.
     */
    SpannerQueryRunner.prototype.createForeignKeys = function (tableOrName, foreignKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Drops a foreign key.
     */
    SpannerQueryRunner.prototype.dropForeignKey = function (tableOrName, foreignKeyOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, foreignKey, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        foreignKey = foreignKeyOrName instanceof TableForeignKey_1.TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(function (fk) { return fk.name === foreignKeyOrName; });
                        if (!foreignKey)
                            throw new Error("Supplied foreign key was not found in table " + table.name);
                        up = this.dropForeignKeySql(table, foreignKey);
                        down = this.createForeignKeySql(table, foreignKey);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.removeForeignKey(foreignKey);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops a foreign keys from the table.
     */
    SpannerQueryRunner.prototype.dropForeignKeys = function (tableOrName, foreignKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = foreignKeys.map(function (foreignKey) { return _this.dropForeignKey(tableOrName, foreignKey); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new index.
     */
    SpannerQueryRunner.prototype.createIndex = function (tableOrName, index) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        // new index may be passed without name. In this case we generate index name manually.
                        if (!index.name)
                            index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
                        up = this.createIndexSql(table, index);
                        down = this.dropIndexSql(table, index);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.addIndex(index, true);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new indices
     */
    SpannerQueryRunner.prototype.createIndices = function (tableOrName, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = indices.map(function (index) { return _this.createIndex(tableOrName, index); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops an index.
     */
    SpannerQueryRunner.prototype.dropIndex = function (tableOrName, indexOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, index, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        index = indexOrName instanceof TableIndex_1.TableIndex ? indexOrName : table.indices.find(function (i) { return i.name === indexOrName; });
                        if (!index)
                            throw new Error("Supplied index was not found in table " + table.name);
                        up = this.dropIndexSql(table, index);
                        down = this.createIndexSql(table, index);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.removeIndex(index, true);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops an indices from the table.
     */
    SpannerQueryRunner.prototype.dropIndices = function (tableOrName, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = indices.map(function (index) { return _this.dropIndex(tableOrName, index); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    SpannerQueryRunner.prototype.clearTable = function (tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var qb;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (tableOrName instanceof Table_1.Table) {
                            tableOrName = tableOrName.name;
                        }
                        qb = this.connection.manager
                            .createQueryBuilder(this)
                            .delete()
                            .from(tableOrName);
                        return [4 /*yield*/, this.delete(qb)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Removes all tables from the currently connected database.
     * Be careful using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    SpannerQueryRunner.prototype.clearDatabase = function (database) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tables, keys, CONCURRENT_DELETION, i, start, end, range;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.driver.getAllTablesForDrop(true)];
                    case 1:
                        tables = _a.sent();
                        keys = Object.keys(tables);
                        CONCURRENT_DELETION = 10;
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < Math.ceil(keys.length / CONCURRENT_DELETION))) return [3 /*break*/, 5];
                        start = i * CONCURRENT_DELETION;
                        end = (i + 1) * CONCURRENT_DELETION;
                        range = keys.slice(start, end);
                        if (range.length <= 0) {
                            return [3 /*break*/, 5];
                        }
                        return [4 /*yield*/, Promise.all(range.map(function (k) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                return tslib_1.__generator(this, function (_a) {
                                    return [2 /*return*/, this.dropTable(k)];
                                });
                            }); }))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * create `schemas` table which describe additional column information such as
     * generated column's increment strategy or default value
     * @database: spanner's database object.
     */
    SpannerQueryRunner.prototype.createAndLoadSchemaTable = function (tableName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var e_1, _a, tableExist, rawObjects, schemas, rawObjects_1, rawObjects_1_1, rawObject, table, tableSchemas, column;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.hasTable(tableName)];
                    case 1:
                        tableExist = _b.sent();
                        if (!!tableExist) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createTable(new Table_1.Table({
                                name: tableName,
                                columns: [
                                    {
                                        name: "table",
                                        type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }),
                                        isPrimary: true,
                                        isNullable: false
                                    },
                                    {
                                        name: "column",
                                        type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }),
                                        isPrimary: true,
                                        isNullable: false
                                    },
                                    {
                                        name: "type",
                                        type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }),
                                        isPrimary: true,
                                        isNullable: false
                                    },
                                    {
                                        name: "value",
                                        type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }),
                                        isNullable: false
                                    },
                                ]
                            }))];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3: return [4 /*yield*/, this.loadExtendSchemaTable(tableName)];
                    case 4:
                        rawObjects = _b.sent();
                        schemas = {};
                        try {
                            for (rawObjects_1 = tslib_1.__values(rawObjects), rawObjects_1_1 = rawObjects_1.next(); !rawObjects_1_1.done; rawObjects_1_1 = rawObjects_1.next()) {
                                rawObject = rawObjects_1_1.value;
                                table = rawObject["table"];
                                if (!schemas[table]) {
                                    schemas[table] = {};
                                }
                                tableSchemas = schemas[table];
                                column = rawObject["column"];
                                if (!tableSchemas[column]) {
                                    tableSchemas[column] = {};
                                }
                                // value is stored in data as JSON.stringify form
                                Object.assign(tableSchemas[column], this.createExtendSchemaObject(table, rawObject["type"], rawObject["value"]));
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (rawObjects_1_1 && !rawObjects_1_1.done && (_a = rawObjects_1.return)) _a.call(rawObjects_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [2 /*return*/, schemas];
                }
            });
        });
    };
    /**
     * Synchronizes table extend schema.
     * systemTables means internally used table, such as migrations.
     */
    SpannerQueryRunner.prototype.syncExtendSchemas = function (metadata) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var allSchemaObjects, raw, systemTables, tableProps, oldNormalTables, newExtendSchemas;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        allSchemaObjects = {};
                        return [4 /*yield*/, this.loadExtendSchemaTable(this.driver.getSchemaTableName())];
                    case 1:
                        raw = _a.sent();
                        return [4 /*yield*/, this.driver.getSystemTables()];
                    case 2:
                        systemTables = _a.sent();
                        raw.forEach(function (o) {
                            var t = o["table"];
                            if (!allSchemaObjects[t]) {
                                allSchemaObjects[t] = [];
                            }
                            allSchemaObjects[t].push(o);
                        });
                        tableProps = metadata
                            .concat(systemTables.map(function (st) {
                            return {
                                name: st.name,
                                columns: st.columns.map(function (c) {
                                    return new SpannerRawTypes_1.SpannerExtendedColumnPropsFromTableColumn(c);
                                })
                            };
                        }));
                        oldNormalTables = Object.keys(allSchemaObjects);
                        newExtendSchemas = {};
                        return [4 /*yield*/, Promise.all(tableProps.map(function (t) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var e_2, _a, e_3, _b, oldTableIndex, promises, schemaObjectsByTable, oldColumns, _c, _d, c, oldColumnIndex, _e, add, remove, addFiltered, removeFiltered, add_1, add_1_1, a;
                                var _this = this;
                                return tslib_1.__generator(this, function (_f) {
                                    switch (_f.label) {
                                        case 0:
                                            oldTableIndex = oldNormalTables.indexOf(t.name);
                                            if (oldTableIndex >= 0) {
                                                oldNormalTables.splice(oldTableIndex, 1);
                                            }
                                            promises = [];
                                            schemaObjectsByTable = allSchemaObjects[t.name] || [];
                                            oldColumns = schemaObjectsByTable.map(function (o) { return o["column"]; });
                                            try {
                                                for (_c = tslib_1.__values(t.columns), _d = _c.next(); !_d.done; _d = _c.next()) {
                                                    c = _d.value;
                                                    oldColumnIndex = oldColumns.indexOf(c.databaseName);
                                                    if (oldColumnIndex >= 0) {
                                                        oldColumns.splice(oldColumnIndex, 1);
                                                    }
                                                    _e = this.getSyncExtendSchemaObjects(t, c), add = _e.add, remove = _e.remove;
                                                    addFiltered = add.filter(function (e) {
                                                        // filter element which already added and not changed
                                                        return !schemaObjectsByTable.find(function (o) { return o["column"] === e.column &&
                                                            o["type"] === e.type &&
                                                            o["value"] === e.value; });
                                                    });
                                                    removeFiltered = remove.filter(function (e) {
                                                        // filter element which does not exist
                                                        return schemaObjectsByTable.find(function (o) { return o["column"] === e.column && o["type"] === e.type; });
                                                    });
                                                    if ((addFiltered.length + removeFiltered.length) > 0) {
                                                        promises.push(Promise.all(tslib_1.__spread(addFiltered.map(function (e) { return _this.upsertExtendSchema(e.table, e.column, e.type, e.value); }), removeFiltered.map(function (e) { return _this.deleteExtendSchema(e.table, e.column, e.type); }))));
                                                    }
                                                    if (add.length > 0) {
                                                        if (!newExtendSchemas[t.name]) {
                                                            newExtendSchemas[t.name] = {};
                                                        }
                                                        try {
                                                            for (add_1 = tslib_1.__values(add), add_1_1 = add_1.next(); !add_1_1.done; add_1_1 = add_1.next()) {
                                                                a = add_1_1.value;
                                                                newExtendSchemas[t.name][c.databaseName] = this.createExtendSchemaObject(a.table, a.type, a.value);
                                                            }
                                                        }
                                                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                                                        finally {
                                                            try {
                                                                if (add_1_1 && !add_1_1.done && (_b = add_1.return)) _b.call(add_1);
                                                            }
                                                            finally { if (e_3) throw e_3.error; }
                                                        }
                                                    }
                                                }
                                            }
                                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                                            finally {
                                                try {
                                                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                                                }
                                                finally { if (e_2) throw e_2.error; }
                                            }
                                            // if column is no more exists in new entity metadata, remove all extend schema for such columns
                                            if (oldColumns.length > 0) {
                                                console.log('oldColumns', oldColumns);
                                                promises.push(Promise.all(oldColumns.map(function (c) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                                    return tslib_1.__generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0: return [4 /*yield*/, this.deleteExtendSchema(t.name, c)];
                                                            case 1:
                                                                _a.sent();
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); })));
                                            }
                                            if (!(promises.length > 0)) return [3 /*break*/, 2];
                                            return [4 /*yield*/, Promise.all(promises)];
                                        case 1:
                                            _f.sent();
                                            _f.label = 2;
                                        case 2: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 3:
                        _a.sent();
                        if (!(oldNormalTables.length > 0)) return [3 /*break*/, 5];
                        //console.log('oldNormalTables', oldNormalTables);
                        return [4 /*yield*/, Promise.all(oldNormalTables.map(function (tableName) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.deleteExtendSchema(tableName)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 4:
                        //console.log('oldNormalTables', oldNormalTables);
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, newExtendSchemas];
                }
            });
        });
    };
    /**
     * Creates a new exclusion constraint.
     */
    SpannerQueryRunner.prototype.createExclusionConstraint = function (table, exclusionConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("MySql does not support exclusion constraints.");
            });
        });
    };
    /**
     * Creates new exclusion constraints.
     */
    SpannerQueryRunner.prototype.createExclusionConstraints = function (table, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("MySql does not support exclusion constraints.");
            });
        });
    };
    /**
     * Drops a exclusion constraint.
     */
    SpannerQueryRunner.prototype.dropExclusionConstraint = function (table, exclusionOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("MySql does not support exclusion constraints.");
            });
        });
    };
    /**
     * Drops exclusion constraints.
     */
    SpannerQueryRunner.prototype.dropExclusionConstraints = function (table, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("MySql does not support exclusion constraints.");
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * helper for createAndLoadSchemaTable.
     * create schema object from schemas table column
     * @param type
     * @param value
     */
    SpannerQueryRunner.prototype.createExtendSchemaObject = function (table, type, value) {
        var columnSchema = {};
        if (type === "generator") {
            if (value == "uuid") {
                columnSchema.generatorStorategy = "uuid";
                columnSchema.generator = RandomGenerator_1.RandomGenerator.uuid4;
            }
            else if (value == "increment") {
                columnSchema.generatorStorategy = "increment";
                // we automatically process increment generation storategy as uuid.
                // because spanner strongly discourage auto increment column.
                // TODO: if there is request, implement auto increment somehow.
                if (table !== "migrations") {
                    this.driver.connection.logger.log("warn", "column value generatorStorategy `increment` treated as `uuid` on spanner, due to performance reason.");
                }
                columnSchema.generator = SpannerDriver_1.SpannerDriver.randomInt64;
            }
        }
        else if (type === "default") {
            columnSchema.default = value;
            columnSchema.generator = this.driver.decodeDefaultValueGenerator(value);
        }
        return columnSchema;
    };
    SpannerQueryRunner.prototype.verifyAndFillAutoGeneratedValues = function (table, valuesSet) {
        var e_4, _a, e_5, _b;
        if (!valuesSet) {
            return valuesSet;
        }
        if (!(valuesSet instanceof Array)) {
            valuesSet = [valuesSet];
        }
        try {
            for (var valuesSet_1 = tslib_1.__values(valuesSet), valuesSet_1_1 = valuesSet_1.next(); !valuesSet_1_1.done; valuesSet_1_1 = valuesSet_1.next()) {
                var values = valuesSet_1_1.value;
                try {
                    for (var _c = tslib_1.__values(table.columns), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var column = _d.value;
                        if (values[column.name] === undefined) {
                            var value = this.driver.autoGenerateValue(table.name, column.name);
                            if (value !== undefined) {
                                values[column.name] = value;
                            }
                        }
                        else {
                            values[column.name] = this.driver.normalizeValue(values[column.name], column.type);
                        }
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_5) throw e_5.error; }
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (valuesSet_1_1 && !valuesSet_1_1.done && (_a = valuesSet_1.return)) _a.call(valuesSet_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return valuesSet;
    };
    SpannerQueryRunner.prototype.verifyValues = function (table, valuesSet) {
        var e_6, _a, e_7, _b;
        if (!valuesSet) {
            return valuesSet;
        }
        if (!(valuesSet instanceof Array)) {
            valuesSet = [valuesSet];
        }
        try {
            for (var valuesSet_2 = tslib_1.__values(valuesSet), valuesSet_2_1 = valuesSet_2.next(); !valuesSet_2_1.done; valuesSet_2_1 = valuesSet_2.next()) {
                var values = valuesSet_2_1.value;
                try {
                    for (var _c = tslib_1.__values(table.columns), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var column = _d.value;
                        if (values[column.name] !== undefined) {
                            values[column.name] = this.driver.normalizeValue(values[column.name], column.type);
                        }
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (valuesSet_2_1 && !valuesSet_2_1.done && (_a = valuesSet_2.return)) _a.call(valuesSet_2);
            }
            finally { if (e_6) throw e_6.error; }
        }
        return valuesSet;
    };
    /**
     * helper for createAndLoadSchemaTable.
     * load formatted object from schema table
     */
    SpannerQueryRunner.prototype.loadExtendSchemaTable = function (tableName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connection.manager
                            .createQueryBuilder(this)
                            .select()
                            .from(tableName, "")
                            .getRawMany()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * get query string to examine select/update/upsert/delete keys.
     * null means value contains all key elements already.
     */
    SpannerQueryRunner.prototype.examineKeys = function (table, qb, keysOnly) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var e_8, _a, expressionMap, m, pc_1, keys_1, keys_2, _b, _c, k, idx1, idx2, pc, _d, query, parameters, _e, params, types, pc_2, parsed, keys_3, idx, sql, _f, results, err, keys;
            return tslib_1.__generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        expressionMap = qb.expressionMap;
                        // check fast path
                        if (expressionMap.parameters.qb_ids) {
                            pc_1 = table.primaryColumns[0];
                            keys_1 = keysOnly ?
                                expressionMap.parameters.qb_ids :
                                expressionMap.parameters.qb_ids.map(function (e) {
                                    var _a;
                                    return _a = {},
                                        _a[pc_1.name] = e,
                                        _a;
                                });
                            this.driver.connection.logger.log("info", "single primary key " + JSON.stringify(keys_1));
                            return [2 /*return*/, keys_1];
                        }
                        else if (table.primaryColumns.length > 1) {
                            keys_2 = [];
                            try {
                                for (_b = tslib_1.__values(Object.keys(expressionMap.nativeParameters)), _c = _b.next(); !_c.done; _c = _b.next()) {
                                    k = _c.value;
                                    m = k.match(/id_([0-9]+)_([0-9]+)/);
                                    if (m) {
                                        idx1 = Number(m[1]);
                                        if (!keys_2[idx1]) {
                                            keys_2[idx1] = keysOnly ? [] : {};
                                        }
                                        idx2 = Number(m[2]);
                                        if (keysOnly) {
                                            keys_2[idx1][idx2] = expressionMap.nativeParameters[k];
                                        }
                                        else {
                                            pc = table.primaryColumns[idx2];
                                            keys_2[idx1][pc.name] = expressionMap.nativeParameters[k];
                                        }
                                    }
                                }
                            }
                            catch (e_8_1) { e_8 = { error: e_8_1 }; }
                            finally {
                                try {
                                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                                }
                                finally { if (e_8) throw e_8.error; }
                            }
                            if (keys_2.length > 0) {
                                this.driver.connection.logger.log("info", "multiple primary keys " + JSON.stringify(keys_2));
                                return [2 /*return*/, keys_2];
                            }
                        }
                        _d = tslib_1.__read(qb.getQueryAndParameters(), 2), query = _d[0], parameters = _d[1];
                        _e = tslib_1.__read(parameters, 2), params = _e[0], types = _e[1];
                        if (m = query.match(/IN\(([^)]+)\)/)) {
                            pc_2 = table.primaryColumns[0];
                            parsed = m[1].split(",");
                            keys_3 = keysOnly ? parsed : parsed.map(function (e) {
                                var _a;
                                return _a = {},
                                    _a[pc_2.name] = Number(e.trim()),
                                    _a;
                            });
                            this.driver.connection.logger.log("info", "single numeric primary " + JSON.stringify(keys_3));
                            return [2 /*return*/, keys_3];
                        }
                        idx = query.indexOf("WHERE");
                        sql = ("SELECT " + table.primaryColumns.map(function (c) { return c.name; }).join(',') + " FROM " + qb.escapedMainTableName +
                            (idx >= 0 ? query.substring(idx) : ""));
                        return [4 /*yield*/, (this.tx || this.databaseConnection).run({ sql: sql, params: params, types: types, json: true })];
                    case 1:
                        _f = tslib_1.__read.apply(void 0, [_g.sent(), 2]), results = _f[0], err = _f[1];
                        if (err) {
                            this.driver.connection.logger.logQueryError(err, sql, [], this);
                            throw err;
                        }
                        if (!results || results.length <= 0) {
                            return [2 /*return*/, []];
                        }
                        keys = keysOnly ?
                            (table.primaryColumns.length > 1 ?
                                results.map(function (r) { return table.primaryColumns.map(function (pc) { return r[pc.name]; }); }) :
                                results.map(function (r) { return r[table.primaryColumns[0].name]; })) :
                            results;
                        this.driver.connection.logger.log("info", "queried keys " + JSON.stringify(keys) + " by " + query + " " + !!this.tx);
                        return [2 /*return*/, keys];
                }
            });
        });
    };
    /**
     * wrapper to integrate request by transaction and table
     * connect() should be already called before this function invoked.
     */
    SpannerQueryRunner.prototype.request = function (table, method) {
        var _a, _b;
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (this.driver.connection.options.logging) {
            this.driver.connection.logger.logQuery(method + " " + table.name + " " + (this.isTransactionActive ? "tx" : "non-tx"), args[0]);
        }
        if (this.tx) {
            return (_a = this.tx)[method].apply(_a, tslib_1.__spread([table.name], args));
        }
        else {
            return (_b = this.databaseConnection.table(table.name))[method].apply(_b, tslib_1.__spread(args));
        }
    };
    /**
     * Handle select query
     */
    SpannerQueryRunner.prototype.select = function (qb) {
        var _a = tslib_1.__read(qb.getQueryAndParameters(), 2), query = _a[0], parameters = _a[1];
        return this.query(query, parameters);
    };
    /**
     * Handle insert query
     */
    SpannerQueryRunner.prototype.insert = function (qb) {
        var _this = this;
        return new Promise(function (ok, fail) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var table, vss, e_9;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getTable(qb.mainTableName).catch(fail)];
                    case 1:
                        table = _a.sent();
                        if (!table) {
                            fail(new Error("insert: fatal: no such table " + qb.mainTableName));
                            return [2 /*return*/];
                        }
                        vss = this.verifyAndFillAutoGeneratedValues(table, qb.expressionMap.valuesSet);
                        // NOTE: when transaction mode, callback (next args of vss) never called.
                        // at transaction mode, this call just change queuedMutations_ property of this.tx,
                        // and callback ignored.
                        // then actual mutation will be done when commitTransaction is called.
                        return [4 /*yield*/, this.request(table, 'insert', vss)];
                    case 2:
                        // NOTE: when transaction mode, callback (next args of vss) never called.
                        // at transaction mode, this call just change queuedMutations_ property of this.tx,
                        // and callback ignored.
                        // then actual mutation will be done when commitTransaction is called.
                        _a.sent();
                        ok(vss);
                        return [3 /*break*/, 4];
                    case 3:
                        e_9 = _a.sent();
                        fail(e_9);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Handle update query
     */
    SpannerQueryRunner.prototype.update = function (qb) {
        var _this = this;
        return new Promise(function (ok, fail) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var e_10, _a, table, vss, value, rows, rows_1, rows_1_1, row, e_11;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.getTable(qb.mainTableName).catch(fail)];
                    case 1:
                        table = _b.sent();
                        if (!table) {
                            fail(new Error("update: fatal: no such table " + qb.mainTableName));
                            return [2 /*return*/];
                        }
                        vss = this.verifyValues(table, qb.expressionMap.valuesSet);
                        if (!vss || !(vss instanceof Array)) {
                            fail(new Error('only single value set can be used spanner update'));
                            return [2 /*return*/];
                        }
                        value = vss[0];
                        return [4 /*yield*/, this.examineKeys(table, qb).catch(fail)];
                    case 2:
                        rows = _b.sent();
                        if (rows === null) {
                            ok();
                            return [2 /*return*/];
                        }
                        try {
                            for (rows_1 = tslib_1.__values(rows), rows_1_1 = rows_1.next(); !rows_1_1.done; rows_1_1 = rows_1.next()) {
                                row = rows_1_1.value;
                                Object.assign(row, value);
                            }
                        }
                        catch (e_10_1) { e_10 = { error: e_10_1 }; }
                        finally {
                            try {
                                if (rows_1_1 && !rows_1_1.done && (_a = rows_1.return)) _a.call(rows_1);
                            }
                            finally { if (e_10) throw e_10.error; }
                        }
                        // callback not provided see comment of insert
                        return [4 /*yield*/, this.request(table, 'update', rows)];
                    case 3:
                        // callback not provided see comment of insert
                        _b.sent();
                        ok(rows);
                        return [3 /*break*/, 5];
                    case 4:
                        e_11 = _b.sent();
                        fail(e_11);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Handle upsert query
     */
    SpannerQueryRunner.prototype.upsert = function (qb) {
        var _this = this;
        return new Promise(function (ok, fail) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var table, vss, e_12;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getTable(qb.mainTableName).catch(fail)];
                    case 1:
                        table = _a.sent();
                        if (!table) {
                            fail(new Error("upsert: fatal: no such table " + qb.mainTableName));
                            return [2 /*return*/];
                        }
                        vss = this.verifyAndFillAutoGeneratedValues(table, qb.expressionMap.valuesSet);
                        // callback not provided see comment of insert
                        return [4 /*yield*/, this.request(table, 'upsert', vss)];
                    case 2:
                        // callback not provided see comment of insert
                        _a.sent();
                        ok(vss);
                        return [3 /*break*/, 4];
                    case 3:
                        e_12 = _a.sent();
                        fail(e_12);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Handle delete query
     */
    SpannerQueryRunner.prototype.delete = function (qb) {
        var _this = this;
        return new Promise(function (ok, fail) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var table, rows, e_13;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.getTable(qb.mainTableName).catch(fail)];
                    case 1:
                        table = _a.sent();
                        if (!table) {
                            fail(new Error("fatal: no such table " + qb.mainTableName));
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.examineKeys(table, qb, true).catch(fail)];
                    case 2:
                        rows = _a.sent();
                        if (rows === null || rows.length <= 0) {
                            ok();
                            return [2 /*return*/];
                        }
                        // callback not provided see comment of insert
                        return [4 /*yield*/, this.request(table, 'deleteRows', rows)];
                    case 3:
                        // callback not provided see comment of insert
                        _a.sent();
                        ok();
                        return [3 /*break*/, 5];
                    case 4:
                        e_13 = _a.sent();
                        fail(e_13);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * unescape table/database name
     */
    SpannerQueryRunner.prototype.unescapeName = function (name) {
        return name.replace(/`([^`]+)`/, "$1");
    };
    /**
     * convert parsed non-spanner sql to spanner ddl string and extend schema.
     * ast is generated by NearleyParser( = require('nearley').Parser)
     */
    SpannerQueryRunner.prototype.toSpannerQueryAndSchema = function (ddl) {
        this.driver.ddlParser.resetParser();
        var parser = this.driver.ddlParser.parser;
        parser.feed(ddl);
        var extendSchemas = {};
        var t = new SpannerDDLTransformer_1.SpannerDDLTransformer(this.driver.encodeDefaultValueGenerator.bind(this.driver));
        return [t.transform(parser.results[0], extendSchemas), extendSchemas, t.scopedTable];
    };
    /**
     * Handle administrative sqls as spanner API call
     */
    SpannerQueryRunner.prototype.handleAdministrativeQuery = function (type, m) {
        var _this = this;
        return this.connect().then(function (conn) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _a, p, name, p, name, name, sqls, ddl, extendSchames, tableName, table, columnName, column;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (type == "CREATE") {
                            p = m[2].split(/\s/);
                            if (p[0] == "DATABASE") {
                                name = this.unescapeName(p[1]);
                                if (p[1] == "IF") {
                                    if (p[2] != "NOT") {
                                        return [2 /*return*/, Promise.reject(new Error("invalid query " + m[0]))];
                                    }
                                    else {
                                        name = p[4];
                                    }
                                }
                                return [2 /*return*/, this.driver.createDatabase(name)];
                            }
                        }
                        else if (type == "DROP") {
                            p = m[2].split(/\s/);
                            if (p[0] == "DATABASE") {
                                name = this.unescapeName(p[1]);
                                if (p[1] == "IF") {
                                    if (p[2] != "EXISTS") {
                                        return [2 /*return*/, Promise.reject(new Error("invalid query " + m[0]))];
                                    }
                                    else {
                                        name = p[3];
                                    }
                                }
                                return [2 /*return*/, this.driver.dropDatabase(name)];
                            }
                            else if (p[0] == "TABLE") {
                                name = this.unescapeName(p[1]);
                                return [2 /*return*/, this.driver.dropTable(name)];
                            }
                        }
                        //others all updateSchema
                        console.log('handleAdminQuery', m[0]);
                        sqls = m[0];
                        if (!this.disableDDLParser && this.driver.ddlParser) {
                            ddl = m[0][m[0].length - 1] === ';' ? m[0] : (m[0] + ";");
                            extendSchames = {};
                            _a = tslib_1.__read(this.toSpannerQueryAndSchema(ddl), 2), sqls = _a[0], extendSchames = _a[1];
                            console.log('handleAdminQuery', sqls, extendSchames);
                            for (tableName in extendSchames) {
                                table = extendSchames[tableName];
                                for (columnName in table) {
                                    column = table[columnName];
                                    this.upsertExtendSchema(tableName, columnName, column.type, column.value);
                                }
                            }
                        }
                        return [4 /*yield*/, Promise.all(sqls.split(';').
                                filter(function (sql) { return !!sql; }).
                                map(function (sql) { return conn.updateSchema(sql).then(function (data) {
                                return data[0].promise();
                            }); }))];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    SpannerQueryRunner.prototype.loadTables = function (tableNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                // if no tables given then no need to proceed
                if (!tableNames || !tableNames.length)
                    return [2 /*return*/, []];
                return [2 /*return*/, this.connect().then(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var tables;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.driver.loadTables(tableNames)];
                                case 1:
                                    tables = _a.sent();
                                    return [2 /*return*/, tables];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Builds create table sql
     */
    SpannerQueryRunner.prototype.createTableSql = function (table) {
        var _this = this;
        var columnDefinitions = table.columns.map(function (column) { return _this.buildCreateColumnSql(column, true); }).join(", ");
        var sql = "CREATE TABLE " + this.escapeTableName(table) + " (" + columnDefinitions;
        // we create unique indexes instead of unique constraints, because MySql does not have unique constraints.
        // if we mark column as Unique, it means that we create UNIQUE INDEX.
        table.columns
            .filter(function (column) { return column.isUnique; })
            .forEach(function (column) {
            var isUniqueIndexExist = table.indices.some(function (index) {
                return index.columnNames.length === 1 && !!index.isUnique && index.columnNames.indexOf(column.name) !== -1;
            });
            var isUniqueConstraintExist = table.uniques.some(function (unique) {
                return unique.columnNames.length === 1 && unique.columnNames.indexOf(column.name) !== -1;
            });
            if (!isUniqueIndexExist && !isUniqueConstraintExist)
                table.indices.push(new TableIndex_1.TableIndex({
                    name: _this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                    columnNames: [column.name],
                    isUnique: true
                }));
        });
        sql += ")";
        if (table.primaryColumns.length > 0) {
            var columnNames = table.primaryColumns.map(function (column) { return "`" + column.name + "`"; }).join(", ");
            sql += " PRIMARY KEY (" + columnNames + ")";
        }
        if (table.foreignKeys.length > 0) {
            var foreignKeysSql = table.foreignKeys.map(function (fk) {
                var constraint = "INTERLEAVE IN PARENT " + _this.escapeTableName(fk.referencedTableName);
                if (fk.onDelete)
                    constraint += " ON DELETE " + fk.onDelete;
                if (fk.onUpdate)
                    throw new Error("NYI: spanner: fk.onUpdate"); //constraint += ` ON UPDATE ${fk.onUpdate}`;
                return constraint;
            }).join(", ");
            sql += ", " + foreignKeysSql;
        }
        //console.log('createTableSql', sql);
        return sql;
    };
    /**
     * Builds drop table sql
     */
    SpannerQueryRunner.prototype.dropTableSql = function (tableOrName) {
        return "DROP TABLE " + this.escapeTableName(tableOrName);
    };
    SpannerQueryRunner.prototype.dropTableSqlRecursive = function (tableOrName, upQueries, downQueries) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof tableOrName == 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getTable(tableOrName)];
                    case 1:
                        table = _a.sent();
                        if (!table) {
                            return [2 /*return*/]; // already deleted
                        }
                        tableOrName = table;
                        _a.label = 2;
                    case 2: return [4 /*yield*/, Promise.all(tableOrName.foreignKeys.map(function (fk) {
                            _this.dropTableSqlRecursive(fk.referencedTableName, upQueries, downQueries);
                        }))];
                    case 3:
                        _a.sent();
                        upQueries.push(this.dropTableSql(tableOrName));
                        downQueries.push(this.createTableSql(tableOrName));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Builds create index sql.
     */
    SpannerQueryRunner.prototype.createIndexSql = function (table, index) {
        //TODO: somehow supports interleave and storing clause
        var columns = index.columnNames.map(function (columnName) { return "`" + columnName + "`"; }).join(", ");
        var indexType = "";
        if (index.isUnique)
            indexType += "UNIQUE ";
        if (index.isSpatial)
            indexType += "NULL_FILTERED ";
        if (index.isFulltext)
            throw new Error("NYI: spanner: index.isFulltext"); //indexType += "FULLTEXT ";
        return "CREATE " + indexType + "INDEX `" + index.name + "` ON " + this.escapeTableName(table) + "(" + columns + ")";
    };
    /**
     * Builds drop index sql.
     */
    SpannerQueryRunner.prototype.dropIndexSql = function (table, indexOrName) {
        //throw new Error('should not drop any index');
        var indexName = indexOrName instanceof TableIndex_1.TableIndex ? indexOrName.name : indexOrName;
        return "DROP INDEX `" + indexName + "`";
    };
    /**
     * Builds create primary key sql.
     */
    SpannerQueryRunner.prototype.createPrimaryKeySql = function (table, columnNames) {
        var columnNamesString = columnNames.map(function (columnName) { return "`" + columnName + "`"; }).join(", ");
        return "ALTER TABLE " + this.escapeTableName(table) + " ADD PRIMARY KEY (" + columnNamesString + ")";
    };
    /**
     * Builds drop primary key sql.
     */
    SpannerQueryRunner.prototype.dropPrimaryKeySql = function (table) {
        return "ALTER TABLE " + this.escapeTableName(table) + " DROP PRIMARY KEY";
    };
    /**
     * Builds create foreign key sql.
     */
    SpannerQueryRunner.prototype.createForeignKeySql = function (table, foreignKey) {
        throw new Error('NYI: spanner: column level foreign key declaration');
        /* const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `\`${column}\``).join(",");
        const columnNames = foreignKey.columnNames.map(column => `\`${column}\``).join(",");
        const fkName = foreignKey.name || `${referencedColumnNames}By${foreignKey.columnNames.join()}`;
        let sql = `CREATE INDEX ${fkName} ON
            ${this.escapeTableName(table.name)}\(${referencedColumnNames}, ${columnNames}\)
            INTERLEAVE IN ${this.escapeTableName(foreignKey.referencedTableName)}`;
        if (foreignKey.onDelete)
            sql += ` ON DELETE ${foreignKey.onDelete}`;
        if (foreignKey.onUpdate)
            throw new Error(`NYI: spanner: foreignKey.onUpdate`); //sql += ` ON UPDATE ${foreignKey.onUpdate}`;

        return sql; */
    };
    /**
     * Builds drop foreign key sql.
     */
    SpannerQueryRunner.prototype.dropForeignKeySql = function (table, foreignKeyOrName) {
        throw new Error('NYI: spanner: column level foreign key declaration');
        /* const foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return `DROP INDEX \`${foreignKeyName}\` ON ${this.escapeTableName(table)}`; */
    };
    SpannerQueryRunner.prototype.parseTableName = function (target) {
        var tableName = target instanceof Table_1.Table ? target.name : target;
        return {
            database: tableName.indexOf(".") !== -1 ? tableName.split(".")[0] : this.driver.database,
            tableName: tableName.indexOf(".") !== -1 ? tableName.split(".")[1] : tableName
        };
    };
    /**
     * Escapes given table name.
     */
    SpannerQueryRunner.prototype.escapeTableName = function (target, disableEscape) {
        var tableName = target instanceof Table_1.Table ? target.name : target;
        var splits = tableName.split(".");
        if (splits.length > 1) {
            //omit database name to avoid spanner table name parse error.
            splits = splits.slice(1);
        }
        return splits.map(function (i) { return disableEscape ? i : "`" + i + "`"; }).join(".");
    };
    /**
     * Builds a part of query to create/change a column.
     */
    SpannerQueryRunner.prototype.buildCreateColumnSql = function (column, skipPrimary, skipName) {
        if (skipName === void 0) { skipName = false; }
        var c = "";
        if (skipName) {
            c = this.connection.driver.createFullType(column);
        }
        else {
            c = "`" + column.name + "` " + this.connection.driver.createFullType(column);
        }
        if (column.asExpression)
            throw new Error("NYI: spanner: column.asExpression"); // c += ` AS (${column.asExpression}) ${column.generatedType ? column.generatedType : "VIRTUAL"}`;
        // if you specify ZEROFILL for a numeric column, MySQL automatically adds the UNSIGNED attribute to that column.
        if (column.zerofill) {
            throw new Error("NYI: spanner: column.zerofill"); // c += " ZEROFILL";
        }
        else if (column.unsigned) {
            throw new Error("NYI: spanner: column.unsigned"); // c += " UNSIGNED";
        }
        // spanner
        if (column.enum)
            throw new Error("NYI: spanner: column.enum"); // c += ` (${column.enum.map(value => "'" + value + "'").join(", ")})`;
        // spanner only supports utf8
        if (column.charset && column.charset.toLowerCase().indexOf("utf8") >= 0)
            throw new Error("NYI: spanner: column.charset = " + column.charset); // c += ` CHARACTER SET "${column.charset}"`;
        if (column.collation)
            throw new Error("NYI: spanner: column.collation"); // c += ` COLLATE "${column.collation}"`;
        if (!column.isNullable)
            c += " NOT NULL";
        // explicit nullable modifier not supported. silently ignored.
        // if (column.isNullable) c += " NULL";
        // primary key can be specified only at table creation
        // not error but does not take effect here.
        // if (column.isPrimary && !skipPrimary) c += " PRIMARY KEY";
        // spanner does not support any generated columns, nor default value.
        // we should create metadata table and get information about generated columns
        // if (column.isGenerated && column.generationStrategy === "increment") {
        // }
        // does not support comment.
        if (column.comment)
            throw new Error("NYI: spanner: column.comment"); //c += ` COMMENT '${column.comment}'`;
        // spanner ddl does not support any default value except SpannerColumnUpdateWithCommitTimestamp
        // other default value is supported by extend schema table
        if (column.default !== undefined && column.default !== null) {
            if (column.default === SpannerDriver_1.SpannerColumnUpdateWithCommitTimestamp) {
                c += "OPTIONS (allow_commit_timestamp=true)";
            }
        }
        // does not support on update
        if (column.onUpdate)
            throw new Error("NYI: spanner: column.onUpdate"); //c += ` ON UPDATE ${column.onUpdate}`;
        return c;
    };
    SpannerQueryRunner.prototype.buildCreateColumnOptionsSql = function (column) {
        return "";
    };
    SpannerQueryRunner.prototype.replaceCachedTable = function (table, changedTable) {
        if (changedTable) {
            _super.prototype.replaceCachedTable.call(this, table, changedTable);
            this.driver.setTable(changedTable);
        }
        else {
            var index = this.loadedTables.findIndex(function (t) { return t.name == table.name; });
            if (index >= 0) {
                this.loadedTables.splice(index, 1);
            }
        }
    };
    SpannerQueryRunner.prototype.getSyncExtendSchemaObjects = function (table, column) {
        var ret = {
            add: [],
            remove: []
        };
        if (column.default !== undefined) {
            var defaultValue = this.driver.encodeDefaultValueGenerator(column.default);
            ret.add.push({ table: table.name, column: column.databaseName, type: "default", value: defaultValue });
        }
        else {
            if (column.isNullable) {
                var defaultValue = this.driver.encodeDefaultValueGenerator(null);
                ret.add.push({ table: table.name, column: column.databaseName, type: "default", value: defaultValue });
            }
            else {
                ret.remove.push({ table: table.name, column: column.databaseName, type: "default" });
            }
        }
        if (column.generationStrategy) {
            ret.add.push({ table: table.name, column: column.databaseName, type: "generator", value: column.generationStrategy });
        }
        else {
            ret.remove.push({ table: table.name, column: column.databaseName, type: "generator" });
        }
        return ret;
    };
    SpannerQueryRunner.prototype.deleteExtendSchema = function (table, column, type) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var wh, qb;
            return tslib_1.__generator(this, function (_a) {
                wh = column ? (type ?
                    "`table` = '" + table + "' AND `column` = '" + column + "' AND `type` = '" + type + "'" :
                    "`table` = '" + table + "' AND `column` = '" + column + "'") : ("`table` = '" + table + "'");
                qb = this.connection.manager
                    .createQueryBuilder(this)
                    .delete()
                    .from(this.driver.options.schemaTableName || "schemas")
                    .where(wh);
                return [2 /*return*/, this.delete(qb)];
            });
        });
    };
    SpannerQueryRunner.prototype.upsertExtendSchema = function (table, column, type, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var qb;
            return tslib_1.__generator(this, function (_a) {
                qb = this.connection.manager
                    .createQueryBuilder(this)
                    .update(this.driver.options.schemaTableName || "schemas")
                    .set({ table: table, column: column, type: type, value: value })
                    .where("`table` = '" + table + "' AND `column` = '" + column + "' AND `type` = '" + type + "'");
                return [2 /*return*/, this.upsert(qb)];
            });
        });
    };
    return SpannerQueryRunner;
}(BaseQueryRunner_1.BaseQueryRunner));
exports.SpannerQueryRunner = SpannerQueryRunner;

//# sourceMappingURL=SpannerQueryRunner.js.map
