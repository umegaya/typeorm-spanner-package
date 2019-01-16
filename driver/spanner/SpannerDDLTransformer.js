"use strict";
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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
;
;
var SpannerDDLTransformer = /** @class */ (function () {
    function SpannerDDLTransformer() {
        this.primaryKeyColumns = [];
        this.indices = [];
    }
    SpannerDDLTransformer.prototype.transform = function (ast, extendSchemas) {
        var set = this;
        return (set[ast.id] || set["transform"]).call(this, ast.def, extendSchemas);
    };
    // common 
    SpannerDDLTransformer.prototype.addExtendSchema = function (extendSchemas, type, value) {
        var key = this.scopedColumn || this.scopedIndex;
        if (!key) {
            throw new Error('scoped index or column should be set');
        }
        if (!extendSchemas[this.scopedTable]) {
            extendSchemas[this.scopedTable] = {};
        }
        extendSchemas[this.scopedTable][key] = {
            type: type, value: value
        };
    };
    SpannerDDLTransformer.prototype.setScopedColumn = function (column) {
        this.scopedIndex = undefined;
        this.scopedColumn = column;
    };
    SpannerDDLTransformer.prototype.setScopedIndex = function (index) {
        this.scopedIndex = "idx@" + index;
        this.scopedColumn = undefined;
    };
    // AST Transformers
    // P_DDS: default
    // P_CREATE_TABLE: default
    SpannerDDLTransformer.prototype.P_CREATE_TABLE_COMMON = function (ast, extendSchemas) {
        this.scopedTable = ast.table;
        return "CREATE TABLE " + ast.table + " " +
            ("(" + this.P_CREATE_TABLE_CREATE_DEFINITIONS(ast.columnsDef.def, extendSchemas) + ")") +
            (this.P_CREATE_TABLE_OPTIONS(ast.tableOptions.def, extendSchemas) + " ") +
            (this.primaryKeyDefinitionHelper() + ";") +
            ("" + this.indexDefinitionsHelper());
    };
    SpannerDDLTransformer.prototype.P_CREATE_TABLE_CREATE_DEFINITIONS = function (ast, extendSchemas) {
        var _this = this;
        return "" + ast.map(function (d) { return _this.P_CREATE_TABLE_CREATE_DEFINITION(d.def, extendSchemas); }).filter(function (e) { return !!e; }).join(',');
    };
    SpannerDDLTransformer.prototype.P_CREATE_TABLE_CREATE_DEFINITION = function (ast, extendSchemas) {
        var _this = this;
        if (ast.column) {
            this.setScopedColumn(ast.column.name);
            return ast.column.name + " " + this.O_DATATYPE(ast.column.def.datatype, extendSchemas) + " " +
                ("" + ast.column.def.columnDefinition.map(function (cd) { return _this.O_COLUMN_DEFINITION(cd.def, extendSchemas); }).join(' '));
        }
        else if (ast.primaryKey) {
            this.primaryKeyColumns = this.primaryKeyColumns
                .concat(ast.primaryKey.columns.map(function (c) {
                return {
                    name: c.def.column,
                    sort: c.def.sort
                };
            }));
        }
        else if (ast.index) {
            this.indices.push(this.indexHelper(ast.index, { unique: false, sparse: false }));
        }
        else if (ast.uniqueKey) {
            this.indices.push(this.indexHelper(ast.uniqueKey, { unique: true, sparse: false }));
        }
        return "";
    };
    SpannerDDLTransformer.prototype.P_ALTER_TABLE = function (ast, extendSchemas) {
        var _this = this;
        this.scopedTable = ast.table;
        return "" + ast.specs.map(function (spec) { return _this.P_ALTER_TABLE_SPECS(spec, extendSchemas); }).join(';');
    };
    SpannerDDLTransformer.prototype.P_ALTER_TABLE_SPECS = function (ast, extendSchemas) {
        return this.O_ALTER_TABLE_SPEC(ast.def.spec, extendSchemas);
    };
    SpannerDDLTransformer.prototype.P_CREATE_TABLE_OPTIONS = function (ast, extendSchemas) {
        var _this = this;
        return "" + ast.map(function (cd) { return _this.P_CREATE_TABLE_OPTION(cd.def, extendSchemas); }).join();
    };
    SpannerDDLTransformer.prototype.P_CREATE_TABLE_OPTION = function (ast, extendSchemas) {
        if (ast.engine) {
            // InnoDB or MyISAM
        }
        return "";
    };
    SpannerDDLTransformer.prototype.P_RENAME_TABLE = function (ast, extendSchemas) {
        return ast.map(function (p) { return "RENAME TABLE " + p.table + " TO " + p.newName; }).join(';');
    };
    SpannerDDLTransformer.prototype.P_CREATE_INDEX = function (ast, extendSchemas) {
        this.scopedTable = ast.table;
        return this.indexDefinitionHelper(this.indexHelper(ast, ast.type));
    };
    SpannerDDLTransformer.prototype.P_DROP_INDEX = function (ast, extendSchemas) {
        return "DROP INDEX " + ast.index;
    };
    SpannerDDLTransformer.prototype.P_DROP_TABLE = function (ast, extendSchemas) {
        return ast.map(function (t) { return "DROP TABLE " + t; }).join(';');
    };
    SpannerDDLTransformer.prototype.O_ALTER_TABLE_SPEC = function (ast, extendSchemas) {
        var actionSqlMap = {
            addColumn: this.O_ALTER_TABLE_SPEC_addColumn,
            dropColumn: this.O_ALTER_TABLE_SPEC_dropColumn,
            changeColumn: this.O_ALTER_TABLE_SPEC_changeColumn,
            addIndex: this.O_ALTER_TABLE_SPEC_addIndex,
            addFulltextIndex: this.O_ALTER_TABLE_SPEC_addIndex,
            addSpatialIndex: this.O_ALTER_TABLE_SPEC_addSpatialIndex,
            addUniqueKey: this.O_ALTER_TABLE_SPEC_addUniqueKey,
            dropIndex: this.O_ALTER_TABLE_SPEC_dropIndex,
        };
        return actionSqlMap[ast.def.action].call(this, ast.def, extendSchemas);
    };
    SpannerDDLTransformer.prototype.O_ALTER_TABLE_SPEC_addColumn = function (ast, extendSchemas) {
        return "ALTER TABLE " + this.scopedTable + " ADD COLUMN " + ast.name + " " +
            this.alterColumnDefinitionHelper(ast, extendSchemas);
    };
    SpannerDDLTransformer.prototype.O_ALTER_TABLE_SPEC_dropColumn = function (ast, extendSchemas) {
        this.setScopedColumn(ast.column);
        return "ALTER TABLE " + this.scopedTable + " DROP COLUMN " + ast.column;
    };
    SpannerDDLTransformer.prototype.O_ALTER_TABLE_SPEC_changeColumn = function (ast, extendSchemas) {
        return "ALTER TABLE " + this.scopedTable + " ALTER COLUMN " + [ast.column, ast.newName].filter(function (e) { return !!e; }).join(' ') + " " +
            this.alterColumnDefinitionHelper(ast, extendSchemas);
    };
    SpannerDDLTransformer.prototype.O_ALTER_TABLE_SPEC_addIndex = function (ast, extendSchemas) {
        return this.indexDefinitionHelper(this.indexHelper(ast, { unique: false, sparse: false }));
    };
    SpannerDDLTransformer.prototype.O_ALTER_TABLE_SPEC_addSpatialIndex = function (ast, extendSchemas) {
        return this.indexDefinitionHelper(this.indexHelper(ast, { unique: false, sparse: true }));
    };
    SpannerDDLTransformer.prototype.O_ALTER_TABLE_SPEC_addUniqueKey = function (ast, extendSchemas) {
        return this.indexDefinitionHelper(this.indexHelper(ast, { unique: true, sparse: false }));
    };
    SpannerDDLTransformer.prototype.O_ALTER_TABLE_SPEC_dropIndex = function (ast, extendSchemas) {
        return "DROP INDEX " + ast.index;
    };
    SpannerDDLTransformer.prototype.O_DATATYPE = function (ast, extendSchemas) {
        // handle all O_XXXXX_DATATYPE 
        var lengthTypeChecker = function (ast) {
            if (ast.datatype.indexOf("blob") >= 0 || ast.datatype.indexOf("binary") >= 0) {
                return "bytes(" + ast.length + ")";
            }
            else {
                return "string(" + ast.length + ")";
            }
        };
        var dataTypeMap = {
            O_INTEGER_DATATYPE: "int64",
            O_FIXED_POINT_DATATYPE: "float64",
            O_FLOATING_POINT_DATATYPE: "float64",
            O_BIT_DATATYPE: "bool",
            O_BOOLEAN_DATATYPE: "bool",
            O_DATETIME_DATATYPE: "timestamp",
            O_YEAR_DATATYPE: "date",
            O_VARIABLE_STRING_DATATYPE: lengthTypeChecker,
            O_FIXED_STRING_DATATYPE: lengthTypeChecker,
            O_ENUM_DATATYPE: "string(max)",
            O_SET_DATATYPE: undefined,
            O_SPATIAL_DATATYPE: undefined,
            O_JSON_DATATYPE: "string(max)"
        };
        var t = dataTypeMap[ast.def.id];
        if (!t) {
            throw new Error("unsupported data type: " + ast.def.id);
        }
        else if (typeof (t) === "function") {
            this.scopedColumnType = t(ast.def.def);
        }
        else {
            this.scopedColumnType = t;
        }
        return this.scopedColumnType;
    };
    // O_XXXXX_DATATYPE: default (ignored)
    SpannerDDLTransformer.prototype.O_COLUMN_DEFINITION = function (ast, extendSchemas) {
        if (ast.nullable === true) {
            return ""; //spanner does not allow `NULL` to express nullable column. all column nullable by default.
        }
        else if (ast.nullable === false) {
            return "NOT NULL";
        }
        else if (ast.autoincrement) {
            this.addExtendSchema(extendSchemas, "generator", "increment");
        }
        else if (ast.default !== undefined) {
            this.addExtendSchema(extendSchemas, "default", JSON.stringify(ast.default));
        }
        return "";
    };
    // helpers
    SpannerDDLTransformer.prototype.alterColumnDefinitionHelper = function (ast, extendSchemas) {
        this.setScopedColumn(ast.name);
        return this.O_DATATYPE(ast.datatype, extendSchemas) + " " +
            ("" + this.O_COLUMN_DEFINITION(ast.columnDefinition, extendSchemas)) +
            (ast.position ? (ast.position.after ? "AFTER " + ast.position.after : "FIRST") : "");
    };
    SpannerDDLTransformer.prototype.primaryKeyDefinitionHelper = function () {
        return "PRIMARY KEY (" + this.indexColumnsHelper(this.primaryKeyColumns) + ")";
    };
    SpannerDDLTransformer.prototype.indexDefinitionsHelper = function () {
        var _this = this;
        return this.indices.map(function (idx) { return _this.indexDefinitionHelper(idx); }).join(';');
    };
    SpannerDDLTransformer.prototype.indexDefinitionHelper = function (idx) {
        return "CREATE " +
            (typeof (idx.type) === "string" ? idx.type :
                "" + [
                    idx.type.unique ? "UNIQUE" : undefined,
                    idx.type.sparse ? "NULL_FILTERED" : undefined,
                    "INDEX"
                ].filter(function (e) { return !!e; }).join(' ')) +
            (" " + idx.name + " ") +
            ("ON " + idx.table + "(" + this.indexColumnsHelper(idx.columns) + ")");
    };
    SpannerDDLTransformer.prototype.indexHelper = function (index, type) {
        var columns = index.columns.map(function (idx) {
            return { name: idx.def.column, sort: idx.def.sort };
        });
        var name = index.name || this.indexNameHelper(this.scopedTable, columns);
        this.setScopedIndex(name);
        return {
            name: name,
            type: type,
            table: this.scopedTable,
            columns: columns
        };
    };
    SpannerDDLTransformer.prototype.indexNameHelper = function (table, columns) {
        return table + "_idx_" + columns.map(function (c) { return c.name; }).join('_');
    };
    SpannerDDLTransformer.prototype.indexColumnsHelper = function (columns) {
        return columns.map(function (c) { return "" + [c.name, c.sort].filter(function (e) { return !!e; }).join(' '); }).join(',');
    };
    return SpannerDDLTransformer;
}());
exports.SpannerDDLTransformer = SpannerDDLTransformer;
;
function MakeDebug(t) {
    return new Proxy(t, {
        get: function (target, prop, receiver) {
            var origProp = Reflect.get(target, prop, receiver);
            if (typeof (origProp) === 'function') {
                return function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    console.log('-------------------------------------------');
                    console.log.apply(console, __spread([prop], args));
                    return origProp.call.apply(origProp, __spread([receiver], args));
                };
            }
            else {
                return origProp;
            }
        }
    });
}
exports.MakeDebug = MakeDebug;

//# sourceMappingURL=SpannerDDLTransformer.js.map
