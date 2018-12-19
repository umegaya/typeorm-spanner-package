/**
 * Switch Helper Operator.
 */
export function Switch(condition, cases) {
    var hasMatch = false, result = undefined;
    Object.keys(cases).forEach(function (key) {
        if (condition === key) {
            hasMatch = true;
            result = cases[key];
        }
    });
    if (!hasMatch && cases._ !== undefined)
        result = cases._;
    return result;
}

//# sourceMappingURL=Switch.js.map
