import { FindOperator } from "../FindOperator";
/**
 * If Helper Operator.
 */
export function If(condition, value1, value2) {
    if (value2 === void 0) { value2 = undefined; }
    if (condition) {
        if (value1 instanceof FindOperator)
            return value1;
        return value1;
    }
    else {
        if (value2 instanceof FindOperator)
            return value2;
        if (value2 === undefined)
            return undefined;
        return value2;
    }
}

//# sourceMappingURL=If.js.map
