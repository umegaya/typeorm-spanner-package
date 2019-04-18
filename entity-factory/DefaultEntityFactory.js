"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DefaultEntityFactory = /** @class */ (function () {
    function DefaultEntityFactory() {
    }
    /**
     * Returns an entity object
     */
    DefaultEntityFactory.prototype.createEntity = function (target) {
        var ret = {};
        Reflect.setPrototypeOf(ret, target.prototype);
        return ret;
    };
    return DefaultEntityFactory;
}());
exports.DefaultEntityFactory = DefaultEntityFactory;

//# sourceMappingURL=DefaultEntityFactory.js.map
