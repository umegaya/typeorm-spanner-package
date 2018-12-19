var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * Thrown when specified entity property in the find options were not found.
 */
var FindCriteriaNotFoundError = /** @class */ (function (_super) {
    __extends(FindCriteriaNotFoundError, _super);
    function FindCriteriaNotFoundError(propertyPath, metadata) {
        var _this = _super.call(this) || this;
        Object.setPrototypeOf(_this, FindCriteriaNotFoundError.prototype);
        _this.message = "Property \"" + propertyPath + "\" was not found in " + metadata.targetName + ". Make sure your query is correct.";
        return _this;
    }
    return FindCriteriaNotFoundError;
}(Error));
export { FindCriteriaNotFoundError };

//# sourceMappingURL=FindCriteriaNotFoundError.js.map
