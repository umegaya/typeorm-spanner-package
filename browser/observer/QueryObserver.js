import * as tslib_1 from "tslib";
import * as Observable from "zen-observable";
// todo: we probably need operation-level subscribers
// todo: right now if we save 1000 entities within a single save call its going to call this code 1000 times
// todo: which is not efficient
/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 */
var QueryObserver = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function QueryObserver(connection, type, metadata, options) {
        var _this = this;
        this.connection = connection;
        this.type = type;
        this.metadata = metadata;
        this.options = options;
        // -------------------------------------------------------------------------
        // Public Properties
        // -------------------------------------------------------------------------
        this.insertEvents = [];
        this.updateEvents = [];
        this.removeEvents = [];
        // -------------------------------------------------------------------------
        // Private Properties
        // -------------------------------------------------------------------------
        this.isSubscriberActive = false;
        this.lastEmitEntities = [];
        // -------------------------------------------------------------------------
        // Private Properties
        // -------------------------------------------------------------------------
        this.subscriber = {
            listenTo: function () {
                return _this.metadata.target;
            },
            afterInsert: function (event) {
                if (!_this.subscriptionObserver || !_this.isSubscriberActive)
                    return;
                _this.insertEvents.push(event);
            },
            afterUpdate: function (event) {
                if (!_this.subscriptionObserver || !_this.isSubscriberActive)
                    return;
                _this.updateEvents.push(event);
            },
            afterRemove: function (event) {
                if (!_this.subscriptionObserver || !_this.isSubscriberActive)
                    return;
                _this.removeEvents.push(event);
            }
        };
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Finds entities that match given options and returns observable.
     * Whenever new data appears that matches given query observable emits new value.
     */
    QueryObserver.prototype.observe = function () {
        var _this = this;
        this.connection.observers.push(this);
        return new Observable(function (subscriptionObserver) {
            _this.subscriptionObserver = subscriptionObserver;
            _this.isSubscriberActive = true;
            // we find entities matching our query
            switch (_this.type) {
                case "find":
                    _this.connection.manager.find(_this.metadata.target, _this.options).then(function (entities) {
                        subscriptionObserver.next(entities);
                        _this.lastEmitEntities = entities;
                        _this.connection.subscribers.push(_this.subscriber);
                    });
                    break;
                case "findOne":
                    _this.connection.manager.findOne(_this.metadata.target, _this.options).then(function (entity) {
                        subscriptionObserver.next(entity);
                        _this.lastEmitEntity = entity;
                        _this.connection.subscribers.push(_this.subscriber);
                    });
                    break;
                case "findAndCount":
                    _this.connection.manager.findAndCount(_this.metadata.target, _this.options).then(function (_a) {
                        var _b = tslib_1.__read(_a, 2), entities = _b[0], count = _b[1];
                        subscriptionObserver.next([entities, count]);
                        _this.lastEmitCount = count;
                        _this.lastEmitEntities = entities;
                        _this.connection.subscribers.push(_this.subscriber);
                    });
                    break;
                case "count":
                    _this.connection.manager.count(_this.metadata.target, _this.options, { observers: false }).then(function (count) {
                        subscriptionObserver.next(count);
                        _this.lastEmitCount = count;
                        _this.connection.subscribers.push(_this.subscriber);
                    });
                    break;
            }
            // remove subscription on cancellation
            return function () {
                // remove registered subscriber
                if (_this.subscriber) {
                    var index_1 = _this.connection.subscribers.indexOf(_this.subscriber);
                    if (index_1 !== -1)
                        _this.connection.subscribers.splice(index_1, 1);
                }
                // remove registered observer
                var index = _this.connection.observers.indexOf(_this);
                if (index !== -1)
                    _this.connection.observers.splice(index, 1);
            };
        });
    };
    return QueryObserver;
}());
export { QueryObserver };

//# sourceMappingURL=QueryObserver.js.map
