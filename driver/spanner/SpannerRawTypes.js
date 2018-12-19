"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SpannerExtendedColumnPropsFromTableColumn = /** @class */ (function () {
    function SpannerExtendedColumnPropsFromTableColumn(c) {
        this.databaseName = c.name;
        Object.assign(this, c);
    }
    return SpannerExtendedColumnPropsFromTableColumn;
}());
exports.SpannerExtendedColumnPropsFromTableColumn = SpannerExtendedColumnPropsFromTableColumn;

//# sourceMappingURL=SpannerRawTypes.js.map
