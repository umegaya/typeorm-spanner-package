var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { RdbmsSchemaBuilder } from "../../schema-builder/RdbmsSchemaBuilder";
import { SpannerQueryRunner } from "./SpannerQueryRunner";
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError";
import { PlatformTools } from "../../platform/PlatformTools";
import { DateUtils } from "../../util/DateUtils";
import { Table } from "../../schema-builder/table/Table";
import { DataTypeNotSupportedError } from "../../error/DataTypeNotSupportedError";
import { SpannerUtil } from "./SpannerUtil";
import * as Long from "long";
//import { filter } from "minimatch";
export var SpannerColumnUpdateWithCommitTimestamp = "commit_timestamp";
/**
 * Organizes communication with MySQL DBMS.
 */
var SpannerDriver = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function SpannerDriver(connection) {
        /**
         * Indicates if replication is enabled.
         */
        this.isReplicated = false;
        /**
         * Indicates if tree tables are supported by this driver.
         */
        this.treeSupport = true;
        /**
         * Gets list of supported column data types by a driver.
         *
         * @see https://www.tutorialspoint.com/mysql/mysql-data-types.htm
         * @see https://dev.mysql.com/doc/refman/5.7/en/data-types.html
         */
        this.supportedDataTypes = [
            "int64",
            "bytes",
            "bool",
            "date",
            "float64",
            "string",
            "timestamp",
        ];
        /**
         * Gets list of spatial column data types.
         */
        this.spatialTypes = [];
        /**
         * Gets list of column data types that support length by a driver.
         */
        this.withLengthColumnTypes = [
            "bytes",
            "string",
        ];
        /**
         * Gets list of column data types that support length by a driver.
         */
        this.withWidthColumnTypes = [
            "bytes",
            "string",
        ];
        /**
         * Gets list of column data types that support precision by a driver.
         */
        this.withPrecisionColumnTypes = [
            "float64",
        ];
        /**
         * Gets list of column data types that supports scale by a driver.
         */
        this.withScaleColumnTypes = [
            "float64",
        ];
        /**
         * Gets list of column data types that supports UNSIGNED and ZEROFILL attributes.
         */
        this.unsignedAndZerofillTypes = [];
        /**
         * ORM has special columns and we need to know what database column types should be for those columns.
         * Column types are driver dependant.
         */
        this.mappedDataTypes = {
            createDate: "timestamp",
            createDatePrecision: 20,
            createDateDefault: "CURRENT_TIMESTAMP(6)",
            updateDate: "timestamp",
            updateDatePrecision: 20,
            updateDateDefault: "CURRENT_TIMESTAMP(6)",
            version: "int64",
            treeLevel: "int64",
            migrationId: "int64",
            migrationName: "string",
            migrationTimestamp: "timestamp",
            cacheId: "int64",
            cacheIdentifier: "string",
            cacheTime: "int64",
            cacheDuration: "int64",
            cacheQuery: "string",
            cacheResult: "string",
        };
        /**
         * Default values of length, precision and scale depends on column data type.
         * Used in the cases when length/precision/scale is not specified by user.
         */
        this.dataTypeDefaults = {
            "string": { length: 255 },
            "bytes": { length: 255 },
        };
        this.connection = connection;
        this.options = connection.options;
        this.enableTransaction = false;
        // load mysql package
        this.loadDependencies();
    }
    // -------------------------------------------------------------------------
    // static Public Methods (SpannerDriver specific)
    // -------------------------------------------------------------------------
    SpannerDriver.updateTableWithExtendSchema = function (db, extendSchemas, ignoreColumnNotFound) {
        db.schemas = extendSchemas;
        for (var tableName in db.tables) {
            var table = db.tables[tableName];
            var extendSchema = extendSchemas[tableName];
            if (extendSchema) {
                for (var columnName in extendSchema) {
                    var columnSchema = extendSchema[columnName];
                    var column = table.findColumnByName(columnName);
                    if (column) {
                        column.isGenerated = !!columnSchema.generator;
                        column.default = columnSchema.default;
                        column.generationStrategy = columnSchema.generatorStorategy;
                    }
                    else if (!ignoreColumnNotFound) {
                        throw new Error("extendSchema for column " + columnName + " exists but table does not have it");
                    }
                }
            }
            else {
                // console.log('extendSchema for ', tableName, 'does not exists', extendSchemas);
            }
            // console.log('table', tableName, table);
        }
    };
    SpannerDriver.randomInt64 = function () {
        var e_1, _a;
        var bytes = SpannerUtil.randomBytes(8);
        var as_numbers = [];
        try {
            // TODO: is there any better(faster) way? 
            for (var bytes_1 = __values(bytes), bytes_1_1 = bytes_1.next(); !bytes_1_1.done; bytes_1_1 = bytes_1.next()) {
                var b = bytes_1_1.value;
                as_numbers.push(b);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (bytes_1_1 && !bytes_1_1.done && (_a = bytes_1.return)) _a.call(bytes_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return Long.fromBytes(as_numbers, true).toString();
    };
    // -------------------------------------------------------------------------
    // Public Methods (SpannerDriver specific)
    // -------------------------------------------------------------------------
    /**
     * returns spanner database object. used as databaseConnection of query runner.
     */
    SpannerDriver.prototype.getDatabaseHandle = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.spanner) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.connect()];
                    case 1:
                        _a.sent();
                        if (!this.spanner) {
                            throw new Error('fail to reconnect');
                        }
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.spanner.database.handle];
                }
            });
        });
    };
    SpannerDriver.prototype.getAllTablesForDrop = function (force) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.spanner) {
                            throw new Error('connect() driver first');
                        }
                        this.spanner.database.tables = {};
                        return [4 /*yield*/, this.loadTables(this.getSchemaTableName())];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.spanner.database.tables];
                }
            });
        });
    };
    SpannerDriver.prototype.getSystemTables = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.spanner) {
                            throw new Error('connect() driver first');
                        }
                        db = this.spanner.database;
                        return [4 /*yield*/, this.loadTables(this.getSchemaTableName())];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, [
                                this.options.migrationsTableName || "migrations"
                            ].map(function (name) { return db.tables[name]; }).filter(function (t) { return !!t; })];
                }
            });
        });
    };
    SpannerDriver.prototype.getExtendSchemas = function () {
        if (!this.spanner) {
            throw new Error('connect() driver first');
        }
        return this.spanner.database.schemas || {};
    };
    /**
     * create and drop database of arbiter name.
     * if name equals this.options.database, change driver state accordingly
     */
    SpannerDriver.prototype.createDatabase = function (name) {
        if (!this.spanner) {
            throw new Error('connect() driver first');
        }
        if (name == this.options.database) {
            return Promise.resolve(this.spanner.database.handle);
        }
        return this.spanner.instance.database(name).get({ autoCreate: true });
    };
    SpannerDriver.prototype.dropDatabase = function (name) {
        var _this = this;
        if (!this.spanner) {
            throw new Error('connect() driver first');
        }
        if (name == this.options.database) {
            return this.spanner.database.handle.delete.then(function () {
                _this.disconnect();
            });
        }
        return this.spanner.instance.database(name).delete();
    };
    /**
     * set tables object cache.
     */
    SpannerDriver.prototype.setTable = function (table) {
        if (!this.spanner) {
            throw new Error('connect() driver first');
        }
        this.spanner.database.tables[table.name] = table;
    };
    SpannerDriver.prototype.dropTable = function (tableName) {
        return __awaiter(this, void 0, void 0, function () {
            var t;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.spanner) {
                            throw new Error('connect() driver first');
                        }
                        t = this.spanner.database.tables[tableName];
                        if (!t) return [3 /*break*/, 2];
                        console.log("deleting table[" + tableName + "]...");
                        return [4 /*yield*/, this.spanner.database.handle.table(tableName)
                                .delete()
                                .then(function (data) {
                                // need to wait until table deletion
                                return data[0].promise();
                            })
                                .then(function () {
                                if (_this.spanner) {
                                    delete _this.spanner.database.tables[tableName];
                                    if (_this.getSchemaTableName() == tableName) {
                                        _this.spanner.database.schemas = null;
                                    }
                                }
                            })];
                    case 1:
                        _a.sent();
                        console.log("deleted table[" + tableName + "]");
                        return [3 /*break*/, 3];
                    case 2:
                        console.log("deleting table[" + tableName + "]", 'not exists', this.spanner.database.tables);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * load tables. cache them into this.spanner.databases too.
     * @param tableNames table names which need to load.
     */
    SpannerDriver.prototype.loadTables = function (tableNames) {
        var _this = this;
        if (!this.spanner) {
            throw new Error('connect() driver first');
        }
        if (typeof tableNames === 'string') {
            tableNames = [tableNames];
        }
        else if (tableNames instanceof Table) {
            tableNames = [tableNames.name];
        }
        var database = this.spanner.database;
        return (function () { return __awaiter(_this, void 0, void 0, function () {
            var tables;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(tableNames.map(function (tableName) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, dbname, name, handle, schemas, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _a = __read(tableName.split("."), 2), dbname = _a[0], name = _a[1];
                                        if (!name) {
                                            name = dbname;
                                        }
                                        if (!(Object.keys(database.tables).length === 0)) return [3 /*break*/, 3];
                                        handle = database.handle;
                                        return [4 /*yield*/, handle.getSchema()];
                                    case 1:
                                        schemas = _c.sent();
                                        _b = database;
                                        return [4 /*yield*/, this.parseSchema(schemas)];
                                    case 2:
                                        _b.tables = _c.sent();
                                        _c.label = 3;
                                    case 3: return [2 /*return*/, database.tables[name]];
                                }
                            });
                        }); }))];
                    case 1:
                        tables = _a.sent();
                        return [2 /*return*/, tables.filter(function (t) { return !!t; })];
                }
            });
        }); })();
    };
    SpannerDriver.prototype.getDatabases = function () {
        return Object.keys([this.options.database]);
    };
    SpannerDriver.prototype.isSchemaTable = function (table) {
        return this.getSchemaTableName() === table.name;
    };
    SpannerDriver.prototype.getSchemaTableName = function () {
        return this.options.schemaTableName || "schemas";
    };
    SpannerDriver.prototype.getTableEntityMetadata = function () {
        return this.connection.entityMetadatas.filter(function (metadata) { return metadata.synchronize && metadata.tableType !== "entity-child"; });
    };
    SpannerDriver.prototype.autoGenerateValue = function (tableName, columnName) {
        if (!this.spanner) {
            throw new Error('connect() driver first');
        }
        var database = this.spanner.database;
        if (!database.schemas ||
            !database.schemas[tableName] ||
            !database.schemas[tableName][columnName]) {
            return undefined;
        }
        var generator = database.schemas[tableName][columnName].generator;
        if (!generator) {
            return undefined;
        }
        return generator();
    };
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Performs connection to the database.
     */
    SpannerDriver.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var Spanner, client, instance, database;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.spanner) return [3 /*break*/, 2];
                        Spanner = this.spannerLib.Spanner;
                        client = new Spanner({
                            projectId: this.options.projectId,
                        });
                        instance = client.instance(this.options.instanceId);
                        database = instance.database(this.options.database);
                        return [4 /*yield*/, database.get({ autoCreate: true })];
                    case 1:
                        _a.sent();
                        this.spanner = {
                            client: client, instance: instance,
                            database: {
                                handle: database,
                                tables: {},
                                schemas: null,
                            }
                        };
                        //actual database creation done in createDatabase (called from SpannerQueryRunner)
                        return [2 /*return*/, Promise.resolve()];
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     * here update extend schema.
     */
    SpannerDriver.prototype.afterConnect = function () {
        var _this = this;
        return (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.spanner) {
                            throw new Error('connect() driver first');
                        }
                        if (!!this.options.dropSchema) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.setupExtendSchemas(this.spanner.database, false)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); })();
    };
    /**
     * Makes any action after any synchronization happens (e.g. sync extend schema table in Spanner driver)
     */
    SpannerDriver.prototype.afterSynchronize = function () {
        var _this = this;
        return (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.spanner) {
                            throw new Error('connect() driver first');
                        }
                        return [4 /*yield*/, this.setupExtendSchemas(this.spanner.database, true)];
                    case 1:
                        _a.sent();
                        this.enableTransaction = true;
                        return [2 /*return*/];
                }
            });
        }); })();
    };
    /**
     * Closes connection with the database.
     */
    SpannerDriver.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.spanner = null;
                return [2 /*return*/];
            });
        });
    };
    /**
     * Creates a schema builder used to build and sync a schema.
     */
    SpannerDriver.prototype.createSchemaBuilder = function () {
        return new RdbmsSchemaBuilder(this.connection);
    };
    /**
     * Creates a query runner used to execute database queries.
     */
    SpannerDriver.prototype.createQueryRunner = function (mode) {
        if (mode === void 0) { mode = "master"; }
        return new SpannerQueryRunner(this);
    };
    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    SpannerDriver.prototype.escapeQueryWithParameters = function (sql, parameters, nativeParameters) {
        // written values (for update) are likely to put in nativeParameter
        // OTOH read values (for select, update, delete) are likely to put in parameter. 
        var escapedParameters = Object.keys(nativeParameters).map(function (key) { return nativeParameters[key]; });
        if (!parameters || !Object.keys(parameters).length)
            return [sql, escapedParameters];
        var keys = Object.keys(parameters).map(function (parameter) { return "(:(\\.\\.\\.)?" + parameter + "\\b)"; }).join("|");
        sql = sql.replace(new RegExp(keys, "g"), function (key) {
            var value;
            var paramName;
            var placeHolder;
            if (key.substr(0, 4) === ":...") {
                paramName = key.substr(4);
                placeHolder = "UNNEST(@" + paramName + ")";
            }
            else {
                paramName = key.substr(1);
                placeHolder = "@" + paramName;
            }
            value = parameters[paramName];
            if (value instanceof Function) {
                return value();
            }
            else {
                return placeHolder;
            }
            // IN (UNNEST(@val)) causes error
        }).replace(/\s+IN\s+\(([^)]+)\)/g, function (key, p1) {
            return " IN " + p1;
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, [parameters]];
    };
    /**
     * Escapes a column name.
     */
    SpannerDriver.prototype.escape = function (columnName) {
        return "`" + columnName + "`";
    };
    /**
     * Build full table name with database name, schema name and table name.
     * E.g. "myDB"."mySchema"."myTable"
     * but spanner does not allow to prefix database name, we just returns table name.
     */
    SpannerDriver.prototype.buildTableName = function (tableName, schema, database) {
        return tableName;
    };
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    SpannerDriver.prototype.preparePersistentValue = function (value, columnMetadata) {
        if (columnMetadata.transformer)
            value = columnMetadata.transformer.to(value);
        if (value === null || value === undefined)
            return value;
        if (columnMetadata.type === "timestamp" ||
            columnMetadata.type === "date" ||
            columnMetadata.type === Date) {
            return DateUtils.mixedDateToDate(value);
        } /*else if (columnMetadata.type === "simple-array") {
            return DateUtils.simpleArrayToString(value);

        } else if (columnMetadata.type === "simple-json") {
            return DateUtils.simpleJsonToString(value);
        } */
        else if (columnMetadata.type == Number ||
            columnMetadata.type == String ||
            columnMetadata.type == Boolean ||
            columnMetadata.type == "int64" ||
            columnMetadata.type == "float64" ||
            columnMetadata.type == "bool" ||
            columnMetadata.type == "string" ||
            columnMetadata.type == "bytes") {
            return value;
        }
        else if (columnMetadata.type == "uuid") {
            return value.toString();
        }
        throw new DataTypeNotSupportedError(columnMetadata, columnMetadata.type, "spanner");
    };
    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    SpannerDriver.prototype.prepareHydratedValue = function (value, columnMetadata) {
        try {
            return this.preparePersistentValue(value, columnMetadata);
        }
        catch (e) {
            if (columnMetadata.transformer)
                return columnMetadata.transformer.from(value);
            throw e;
        }
    };
    /**
     * Creates a database type from a given column metadata.
     */
    SpannerDriver.prototype.normalizeType = function (column) {
        if (column.type === Number || column.type === "integer") {
            return "int64";
        }
        else if (column.type === String || column.type === "nvarchar") {
            return "string";
        }
        else if (column.type === Date) {
            return "timestamp";
        }
        else if (column.type === Buffer) {
            return "bytes";
        }
        else if (column.type === Boolean) {
            return "bool";
        }
        else if (column.type === "simple-array" || column.type === "simple-json" || column.type === "uuid") {
            return "string";
        }
        else {
            return column.type || "";
        }
    };
    /**
     * Normalizes "default" value of the column.
     */
    SpannerDriver.prototype.normalizeDefault = function (columnMetadata) {
        var defaultValue = columnMetadata.default;
        if (columnMetadata.isUpdateDate) {
            return SpannerColumnUpdateWithCommitTimestamp;
        }
        else if (typeof defaultValue === "number") {
            return "" + defaultValue;
        }
        else if (typeof defaultValue === "boolean") {
            return defaultValue === true ? "true" : "false";
        }
        else if (typeof defaultValue === "function") {
            return defaultValue();
        }
        else if (typeof defaultValue === "string") {
            return "'" + defaultValue + "'";
        }
        else {
            return defaultValue;
        }
    };
    /**
     * Normalizes "isUnique" value of the column.
     */
    SpannerDriver.prototype.normalizeIsUnique = function (column) {
        return column.entityMetadata.indices.some(function (idx) { return idx.isUnique && idx.columns.length === 1 && idx.columns[0] === column; });
    };
    /**
     * Returns default column lengths, which is required on column creation.
     */
    SpannerDriver.prototype.getColumnLength = function (column) {
        if (column.length)
            return column.length.toString();
        switch (column.type) {
            case String:
            case "string":
                return "255";
            case "bytes":
                return "255";
            default:
                return "";
        }
    };
    /**
     * Creates column type definition including length, precision and scale
     */
    SpannerDriver.prototype.createFullType = function (column) {
        var type = column.type;
        // used 'getColumnLength()' method, because MySQL requires column length for `varchar`, `nvarchar` and `varbinary` data types
        if (this.getColumnLength(column)) {
            type += "(" + this.getColumnLength(column) + ")";
        }
        else if (this.withWidthColumnTypes.indexOf(type) >= 0 && column.width) {
            type += "(" + column.width + ")";
        }
        else if (this.withPrecisionColumnTypes.indexOf(type) >= 0) {
            if (column.precision !== null && column.precision !== undefined && column.scale !== null && column.scale !== undefined) {
                type += "(" + column.precision + "," + column.scale + ")";
            }
            else if (column.precision !== null && column.precision !== undefined) {
                type += "(" + column.precision + ")";
            }
        }
        if (column.isArray)
            type = "Array<" + type + ">";
        //console.log('createFullType', type, column);
        return type;
    };
    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    SpannerDriver.prototype.obtainMasterConnection = function () {
        if (!this.spanner) {
            throw new Error("no active database");
        }
        return Promise.resolve(this.spanner.database.handle);
    };
    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    SpannerDriver.prototype.obtainSlaveConnection = function () {
        return this.obtainMasterConnection();
    };
    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    SpannerDriver.prototype.createGeneratedMap = function (metadata, insertResult) {
        return insertResult;
    };
    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    SpannerDriver.prototype.findChangedColumns = function (tableColumns, columnMetadatas) {
        var _this = this;
        //console.log('columns', tableColumns);
        var filtered = columnMetadatas.filter(function (columnMetadata) {
            var tableColumn = tableColumns.find(function (c) { return c.name === columnMetadata.databaseName; });
            if (!tableColumn)
                return false; // we don't need new columns, we only need exist and changed
            /* console.log("changed property ==========================================");
            console.log("table.column:", columnMetadata.entityMetadata.tableName, columnMetadata.databaseName);
            if (tableColumn.name !== columnMetadata.databaseName)
                console.log("name:", tableColumn.name, columnMetadata.databaseName);
            if (tableColumn.type.toLowerCase() !== this.normalizeType(columnMetadata).toLowerCase())
                console.log("type:", tableColumn.type.toLowerCase(), this.normalizeType(columnMetadata).toLowerCase());
            if (tableColumn.length !== columnMetadata.length)
               console.log("length:", tableColumn.length, columnMetadata.length.toString());
            if (tableColumn.width !== columnMetadata.width)
               console.log("width:", tableColumn.width, columnMetadata.width);
            // if (tableColumn.precision !== columnMetadata.precision)
               // console.log("precision:", tableColumn.precision, columnMetadata.precision);
            if (tableColumn.scale !== columnMetadata.scale)
               console.log("scale:", tableColumn.scale, columnMetadata.scale);
            if (tableColumn.zerofill !== columnMetadata.zerofill)
               console.log("zerofill:", tableColumn.zerofill, columnMetadata.zerofill);
            if (tableColumn.unsigned !== columnMetadata.unsigned)
               console.log("unsigned:", tableColumn.unsigned, columnMetadata.unsigned);
            if (tableColumn.asExpression !== columnMetadata.asExpression)
               console.log("asExpression:", tableColumn.asExpression, columnMetadata.asExpression);
            if (tableColumn.generatedType !== columnMetadata.generatedType)
               console.log("generatedType:", tableColumn.generatedType, columnMetadata.generatedType);
            // if (tableColumn.comment !== columnMetadata.comment)
               // console.log("comment:", tableColumn.comment, columnMetadata.comment);
            if (tableColumn.default !== columnMetadata.default)
               console.log("default:", tableColumn.default, columnMetadata.default);
            if (!this.compareDefaultValues(this.normalizeDefault(columnMetadata), tableColumn.default))
               console.log("default changed:", !this.compareDefaultValues(this.normalizeDefault(columnMetadata), tableColumn.default));
            if (tableColumn.onUpdate !== columnMetadata.onUpdate)
               console.log("onUpdate:", tableColumn.onUpdate, columnMetadata.onUpdate);
            if (tableColumn.isPrimary !== columnMetadata.isPrimary)
               console.log("isPrimary:", tableColumn.isPrimary, columnMetadata.isPrimary);
            if (tableColumn.isNullable !== columnMetadata.isNullable)
               console.log("isNullable:", tableColumn.isNullable, columnMetadata.isNullable);
            if (tableColumn.isUnique !== this.normalizeIsUnique(columnMetadata))
               console.log("isUnique:", tableColumn.isUnique, this.normalizeIsUnique(columnMetadata));
            if (tableColumn.isGenerated !== columnMetadata.isGenerated)
               console.log("isGenerated:", tableColumn.isGenerated, columnMetadata.isGenerated);
            console.log("=========================================="); */
            return tableColumn.name !== columnMetadata.databaseName
                || tableColumn.type.toLowerCase() !== _this.normalizeType(columnMetadata).toLowerCase()
                || tableColumn.length !== columnMetadata.length
                || tableColumn.width !== columnMetadata.width
                // || tableColumn.precision !== columnMetadata.precision : spanner has no precision specifier
                || tableColumn.scale !== columnMetadata.scale
                || tableColumn.zerofill !== columnMetadata.zerofill
                || tableColumn.unsigned !== columnMetadata.unsigned
                || tableColumn.asExpression !== columnMetadata.asExpression
                || tableColumn.generatedType !== columnMetadata.generatedType
                // || tableColumn.comment !== columnMetadata.comment // todo
                || !_this.compareDefaultValues(_this.normalizeDefault(columnMetadata), tableColumn.default)
                || tableColumn.onUpdate !== columnMetadata.onUpdate
                || tableColumn.isPrimary !== columnMetadata.isPrimary
                || tableColumn.isNullable !== columnMetadata.isNullable
                || tableColumn.isUnique !== _this.normalizeIsUnique(columnMetadata)
                || (columnMetadata.generationStrategy !== "uuid" && tableColumn.isGenerated !== columnMetadata.isGenerated);
        });
        //console.log('filtered', filtered);
        return filtered;
    };
    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     * for Spanner, no auto assigned value (default/generatedStorategy(uuid, increment)) at database side.
     * every such values are defined in client memory, so just return insertValue.
     */
    SpannerDriver.prototype.isReturningSqlSupported = function () {
        return true;
    };
    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    SpannerDriver.prototype.isUUIDGenerationSupported = function () {
        return false;
    };
    /**
     * Creates an escaped parameter.
     */
    SpannerDriver.prototype.createParameter = function (parameterName, index) {
        return "@" + parameterName;
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Loads all driver dependencies.
     */
    SpannerDriver.prototype.loadDependencies = function () {
        try {
            this.spannerLib = PlatformTools.load('@google-cloud/spanner'); // try to load first supported package
            if (this.options.migrationDDLType) {
                var parser = PlatformTools.load('sql-ddl-to-json-schema');
                this.ddlParser = new parser(this.options.migrationDDLType);
            }
            else {
                this.ddlParser = undefined;
            }
            /*
             * Some frameworks (such as Jest) may mess up Node's require cache and provide garbage for the 'mysql' module
             * if it was not installed. We check that the object we got actually contains something otherwise we treat
             * it as if the `require` call failed.
             *
             * @see https://github.com/typeorm/typeorm/issues/1373
             */
            [this.spannerLib, this.ddlParser].map(function (lib) {
                if (lib && Object.keys(lib).length === 0) {
                    throw new Error("dependency was found but it is empty.");
                }
            });
        }
        catch (e) {
            throw new DriverPackageNotInstalledError("Spanner", "@google-cloud/spanner");
        }
    };
    /**
     * Checks if "DEFAULT" values in the column metadata and in the database are equal.
     */
    SpannerDriver.prototype.compareDefaultValues = function (columnMetadataValue, databaseValue) {
        if (typeof columnMetadataValue === "string" && typeof databaseValue === "string") {
            // we need to cut out "'" because in mysql we can understand returned value is a string or a function
            // as result compare cannot understand if default is really changed or not
            columnMetadataValue = columnMetadataValue.replace(/^'+|'+$/g, "");
            databaseValue = databaseValue.replace(/^'+|'+$/g, "");
        }
        return columnMetadataValue === databaseValue;
    };
    /**
     * parse typename and return additional information required by TableColumn object.
     */
    SpannerDriver.prototype.parseTypeName = function (typeName) {
        typeName = typeName.toLowerCase();
        var tm = typeName.match(/([^\(]+)\((\d+)\)/);
        if (tm) {
            var typeDefault = this.dataTypeDefaults[tm[1]];
            return {
                typeName: tm[1],
                isArray: false,
                length: typeDefault && typeDefault.length &&
                    tm[2] == typeDefault.length.toString() ? undefined : tm[2]
            };
        }
        var am = typeName.match(/([^<]+)<(\w+)>/);
        if (am) {
            return {
                typeName: typeName,
                isArray: true,
            };
        }
        return {
            typeName: typeName,
            isArray: false,
        };
    };
    /**
    * parse output of database.getSchema to generate Table object
    */
    SpannerDriver.prototype.parseSchema = function (schemas) {
        return __awaiter(this, void 0, void 0, function () {
            var e_2, _a, e_3, _b, e_4, _c, e_5, _d, e_6, _e, tableOptionsMap, _f, _g, stmt, indices, foreignKeys, uniques, columns, m, im, tableIndexOptions, tableOptions, _loop_1, _h, _j, uniqueColumnName, tableName, columnStmts, indexStmts, _k, _l, columnStmt, cm, type, _m, _o, idxStmt, im, pm, _loop_2, _p, _q, primaryColumnName, result, tableName;
            return __generator(this, function (_r) {
                this.connection.logger.log("info", schemas);
                tableOptionsMap = {};
                try {
                    for (_f = __values(schemas[0]), _g = _f.next(); !_g.done; _g = _f.next()) {
                        stmt = _g.value;
                        indices = [];
                        foreignKeys = [];
                        uniques = [];
                        columns = [];
                        m = stmt.match(/\s*CREATE\s+TABLE\s+(\w+)\s?[^\(]*\(([\s\S]*?),(?=\s*\))\s*\)([\s\S]*)/);
                        if (!m) {
                            im = stmt.match(/(\w[\w\s]+?)\s+INDEX\s+(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)(.*)/);
                            if (im) {
                                //console.log('process as index', im);
                                if (im[5] && im[5].indexOf("INTERLEAVE") >= 0) {
                                    // interleaved index. this seems to be same as `partially interleaved table`.
                                    // we use interleaved table for relation, difficult to use this feature
                                    // because no way to specify interleaved table from @Index annotation.
                                    // one hack is use where property of IndexOptions to specify table name.
                                    throw new Error('TODO: spanner: interleaved index support');
                                }
                                else {
                                    tableIndexOptions = {
                                        name: im[2],
                                        columnNames: im[4].split(",").map(function (e) { return e.trim(); }),
                                        isUnique: im[1].indexOf("UNIQUE") >= 0,
                                        isSpatial: im[1].indexOf("NULL_FILTERED") >= 0,
                                        isFulltext: false
                                    };
                                    tableOptions = tableOptionsMap[im[3]];
                                    if (tableOptions) {
                                        tableOptions.indices = tableOptions.indices || [];
                                        tableOptions.indices.push(tableIndexOptions);
                                        if (tableIndexOptions.isUnique) {
                                            tableOptions.uniques = tableOptions.uniques || [];
                                            tableOptions.columns = tableOptions.columns || [];
                                            tableOptions.uniques.push({
                                                name: tableIndexOptions.name,
                                                columnNames: tableIndexOptions.columnNames
                                            });
                                            _loop_1 = function (uniqueColumnName) {
                                                var options = tableOptions.columns.find(function (c) { return c.name == uniqueColumnName; });
                                                if (options) {
                                                    options.isUnique = true;
                                                }
                                                else {
                                                    throw new Error("unique columns should exists in table " + im[3] + " <= " + uniqueColumnName);
                                                }
                                            };
                                            try {
                                                for (_h = __values(tableIndexOptions.columnNames), _j = _h.next(); !_j.done; _j = _h.next()) {
                                                    uniqueColumnName = _j.value;
                                                    _loop_1(uniqueColumnName);
                                                }
                                            }
                                            catch (e_3_1) { e_3 = { error: e_3_1 }; }
                                            finally {
                                                try {
                                                    if (_j && !_j.done && (_b = _h.return)) _b.call(_h);
                                                }
                                                finally { if (e_3) throw e_3.error; }
                                            }
                                        }
                                    }
                                    else {
                                        throw new Error("index ddl appears before main table ddl: " + im[3]);
                                    }
                                }
                                continue;
                            }
                            else {
                                throw new Error("invalid ddl format:" + stmt);
                            }
                        }
                        tableName = m[1];
                        columnStmts = m[2];
                        indexStmts = m[3];
                        try {
                            // parse columns
                            for (_k = __values(columnStmts.split(',')), _l = _k.next(); !_l.done; _l = _k.next()) {
                                columnStmt = _l.value;
                                cm = columnStmt.match(/(\w+)\s+([\w\(\)]+)\s*([^\n]*)/);
                                if (!cm) {
                                    throw new Error("invalid ddl column format:" + columnStmt);
                                }
                                type = this.parseTypeName(cm[2]);
                                // check and store constraint with m[3]
                                columns.push({
                                    name: cm[1],
                                    type: type.typeName,
                                    isNullable: cm[3].indexOf("NOT NULL") < 0,
                                    isGenerated: false,
                                    isPrimary: false,
                                    isUnique: false,
                                    isArray: type.isArray,
                                    length: type.length ? type.length : undefined,
                                    default: undefined,
                                    generationStrategy: undefined,
                                });
                            }
                        }
                        catch (e_4_1) { e_4 = { error: e_4_1 }; }
                        finally {
                            try {
                                if (_l && !_l.done && (_c = _k.return)) _c.call(_k);
                            }
                            finally { if (e_4) throw e_4.error; }
                        }
                        // parse primary and interleave statements
                        // probably tweak required (need to see actual index/interleave statements format)
                        if (indexStmts == null) {
                            continue;
                        }
                        try {
                            for (_m = __values((indexStmts.match(/(\w+[\w\s]+\([^)]+\)[^,]*)/g) || [])), _o = _m.next(); !_o.done; _o = _m.next()) {
                                idxStmt = _o.value;
                                // console.log('idxStmt', idxStmt);
                                // distinguish index and foreignKey. fk should contains INTERLEAVE
                                if (idxStmt.indexOf("INTERLEAVE") == 0) {
                                    im = idxStmt.match(/INTERLEAVE\s+IN\s+PARENT\s+(\w+)/);
                                    if (im) {
                                        foreignKeys.push({
                                            name: tableName,
                                            columnNames: [m[2] + "_id"],
                                            referencedTableName: im[1],
                                            referencedColumnNames: [] // set afterwards (primary key column of referencedTable)
                                        });
                                    }
                                    else {
                                        throw new Error("invalid ddl interleave format:" + idxStmt);
                                    }
                                }
                                else if (idxStmt.indexOf("PRIMARY") == 0) {
                                    pm = idxStmt.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/);
                                    if (pm) {
                                        _loop_2 = function (primaryColumnName) {
                                            var options = columns.find(function (c) { return c.name == primaryColumnName; });
                                            if (options) {
                                                options.isPrimary = true;
                                            }
                                        };
                                        try {
                                            for (_p = __values(pm[1].split(',').map(function (e) { return e.trim(); })), _q = _p.next(); !_q.done; _q = _p.next()) {
                                                primaryColumnName = _q.value;
                                                _loop_2(primaryColumnName);
                                            }
                                        }
                                        catch (e_6_1) { e_6 = { error: e_6_1 }; }
                                        finally {
                                            try {
                                                if (_q && !_q.done && (_e = _p.return)) _e.call(_p);
                                            }
                                            finally { if (e_6) throw e_6.error; }
                                        }
                                    }
                                    else {
                                        throw new Error("invalid ddl pkey format:" + idxStmt);
                                    }
                                }
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (_o && !_o.done && (_d = _m.return)) _d.call(_m);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                        tableOptionsMap[tableName] = {
                            name: tableName,
                            columns: columns,
                            indices: indices,
                            foreignKeys: foreignKeys,
                            uniques: uniques
                        };
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_g && !_g.done && (_a = _f.return)) _a.call(_f);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                result = {};
                for (tableName in tableOptionsMap) {
                    // console.log('tableOptions', tableName, tableOptionsMap[tableName]);
                    result[tableName] = new Table(tableOptionsMap[tableName]);
                }
                return [2 /*return*/, result];
            });
        });
    };
    SpannerDriver.prototype.setupExtendSchemas = function (db, afterSync) {
        return __awaiter(this, void 0, void 0, function () {
            var queryRunner, extendSchemas, ignoreColumnNotFound, newExtendSchemas;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = this.createQueryRunner("master");
                        return [4 /*yield*/, queryRunner.createAndLoadSchemaTable(this.getSchemaTableName())];
                    case 1:
                        extendSchemas = _a.sent();
                        ignoreColumnNotFound = !afterSync;
                        SpannerDriver.updateTableWithExtendSchema(db, extendSchemas, ignoreColumnNotFound);
                        if (!(this.options.dropSchema || this.options.synchronize || this.options.migrationsRun)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.syncExtendSchemas(this.getTableEntityMetadata())];
                    case 2:
                        newExtendSchemas = _a.sent();
                        SpannerDriver.updateTableWithExtendSchema(db, newExtendSchemas, ignoreColumnNotFound);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return SpannerDriver;
}());
export { SpannerDriver };

//# sourceMappingURL=SpannerDriver.js.map