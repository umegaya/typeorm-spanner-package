import * as tslib_1 from "tslib";
import { Any, Between, Equal, ILike, In, LessThan, Like, MoreThan, Not, Raw } from "..";
import { FindOperator } from "./FindOperator";
/**
 * Utilities to work with FindOptions.
 */
var FindOptionsUtils = /** @class */ (function () {
    function FindOptionsUtils() {
    }
    /**
     * Checks if given object is really instance of FindOneOptions interface.
     */
    FindOptionsUtils.isFindOptions = function (obj) {
        var possibleOptions = obj;
        return possibleOptions && (possibleOptions.select instanceof Object ||
            possibleOptions.where instanceof Object ||
            possibleOptions.relations instanceof Object ||
            possibleOptions.order instanceof Object ||
            possibleOptions.options instanceof Object ||
            possibleOptions.cache instanceof Object ||
            typeof possibleOptions.cache === "boolean" ||
            typeof possibleOptions.cache === "number" ||
            typeof possibleOptions.skip === "number" ||
            typeof possibleOptions.take === "number" ||
            typeof possibleOptions.skip === "string" ||
            typeof possibleOptions.take === "string");
    };
    return FindOptionsUtils;
}());
export { FindOptionsUtils };
/**
 * Normalizes find options.
 */
export function normalizeFindOptions(options) {
    var where = options.where;
    if (!where)
        return tslib_1.__assign({}, options);
    if (!(where instanceof Object))
        return tslib_1.__assign({}, options);
    if (where instanceof FindOperator)
        return tslib_1.__assign({}, options);
    var recursively$FindOption = function (obj) {
        var valueKeys = Object.keys(obj);
        if (valueKeys.length === 1) {
            var value = obj[valueKeys[0]];
            if (value instanceof Object && !(value instanceof Array) && !(value instanceof Function))
                value = recursively$FindOption(value);
            if (valueKeys[0] === "$any") {
                return Any(value);
            }
            else if (valueKeys[0] === "$between") {
                return Between(value[0], value[1]);
            }
            else if (valueKeys[0] === "$equal") {
                return Equal(value);
            }
            else if (valueKeys[0] === "$iLike") {
                return ILike(value);
            }
            else if (valueKeys[0] === "$in") {
                return In(value);
            }
            else if (valueKeys[0] === "$lessThan") {
                return LessThan(value);
            }
            else if (valueKeys[0] === "$like") {
                return Like(value);
            }
            else if (valueKeys[0] === "$moreThan") {
                return MoreThan(value);
            }
            else if (valueKeys[0] === "$not") {
                return Not(value);
            }
            else if (valueKeys[0] === "$raw") {
                return Raw(value);
            }
        }
        return false;
    };
    var recursivelyWhere = function (where) {
        if (where instanceof Array)
            return where.map(function (where) { return recursivelyWhere(where); });
        return Object.keys(where).reduce(function (newWhere, key) {
            if (where[key] instanceof Object && !(where[key] instanceof FindOperator)) {
                newWhere[key] = recursively$FindOption(where[key]);
                // in the case if $find operator was not found we'll have a false as a value
                // we need to recursive where because it can be another where options
                if (newWhere[key] === false)
                    newWhere[key] = recursivelyWhere(where[key]);
            }
            else {
                newWhere[key] = where[key];
            }
            return newWhere;
        }, {});
    };
    return tslib_1.__assign({}, options, { where: recursivelyWhere(options.where) });
}

//# sourceMappingURL=FindOptionsUtils.js.map
