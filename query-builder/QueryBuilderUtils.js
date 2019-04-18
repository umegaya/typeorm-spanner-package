"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
/**
 * Helper utility functions for QueryBuilder.
 */
var QueryBuilderUtils = /** @class */ (function () {
    function QueryBuilderUtils() {
    }
    /**
     * Checks if given value is a string representation of alias property,
     * e.g. "post.category" or "post.id".
     */
    QueryBuilderUtils.isAliasProperty = function (str) {
        // alias property must be a string and must have a dot separator
        if (typeof str !== "string" || str.indexOf(".") === -1)
            return false;
        // extra alias and its property relation
        var _a = tslib_1.__read(QueryBuilderUtils.extractAliasAndPropertyPath(str), 2), aliasName = _a[0], propertyName = _a[1];
        if (!aliasName || !propertyName)
            return false;
        // alias and property must be represented in a special format
        // const aliasNameRegexp = /^[a-zA-Z0-9_-]+$/;
        // if (!aliasNameRegexp.test(aliasName) || !aliasNameRegexp.test(propertyName))
        //     return false;
        // make sure string is not a subquery
        if (str.indexOf("(") !== -1 || str.indexOf(")") !== -1)
            return false;
        return true;
    };
    QueryBuilderUtils.extractAliasAndPropertyPath = function (str) {
        var dotPos = str.indexOf(".");
        var alias = str.substr(0, dotPos);
        var propertyPath = str.substr(dotPos + 1);
        return [alias, propertyPath];
    };
    return QueryBuilderUtils;
}());
exports.QueryBuilderUtils = QueryBuilderUtils;

//# sourceMappingURL=QueryBuilderUtils.js.map
