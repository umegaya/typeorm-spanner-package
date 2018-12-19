"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FindOperator_1 = require("../FindOperator");
/**
 * If Helper Operator.
 */
function If(condition, value1, value2) {
    if (value2 === void 0) { value2 = undefined; }
    if (condition) {
        if (value1 instanceof FindOperator_1.FindOperator)
            return value1;
        return value1;
    }
    else {
        if (value2 instanceof FindOperator_1.FindOperator)
            return value2;
        if (value2 === undefined)
            return undefined;
        return value2;
    }
}
exports.If = If;

//# sourceMappingURL=If.js.map
