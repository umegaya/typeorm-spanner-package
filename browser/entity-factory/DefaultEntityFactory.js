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
export { DefaultEntityFactory };

//# sourceMappingURL=DefaultEntityFactory.js.map
