"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Subject_1 = require("../persistence/Subject");
var SubjectChangedColumnsComputer_1 = require("../persistence/SubjectChangedColumnsComputer");
/**
 * Executes all given observers.
 */
var ObserverExecutor = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function ObserverExecutor(observers) {
        this.observers = observers;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Executes given observers.
     */
    ObserverExecutor.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var e_1, _a, _b, _c, observer, e_1_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 9, 10, 11]);
                        _b = __values(this.observers), _c = _b.next();
                        _d.label = 1;
                    case 1:
                        if (!!_c.done) return [3 /*break*/, 8];
                        observer = _c.value;
                        if (!(observer.insertEvents.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.handleInsertEvent(observer)];
                    case 2:
                        _d.sent();
                        observer.insertEvents = [];
                        _d.label = 3;
                    case 3:
                        if (!(observer.updateEvents.length > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.handleUpdateEvent(observer)];
                    case 4:
                        _d.sent();
                        observer.updateEvents = [];
                        _d.label = 5;
                    case 5:
                        if (!(observer.removeEvents.length > 0)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.handleRemoveEvent(observer)];
                    case 6:
                        _d.sent();
                        observer.removeEvents = [];
                        _d.label = 7;
                    case 7:
                        _c = _b.next();
                        return [3 /*break*/, 1];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 11];
                    case 10:
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------
    ObserverExecutor.prototype.handleInsertEvent = function (observer) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(observer.type === "find")) return [3 /*break*/, 2];
                        return [4 /*yield*/, observer.connection.manager.find(observer.metadata.target, observer.options).then(function (entities) {
                                var newEntities = _this.findInserted(observer.metadata, entities, observer.lastEmitEntities);
                                if (newEntities) {
                                    observer.lastEmitEntities = newEntities;
                                    observer.subscriptionObserver.next(observer.lastEmitEntities);
                                }
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 2:
                        if (!(observer.type === "findOne")) return [3 /*break*/, 4];
                        return [4 /*yield*/, observer.connection.manager.findOne(observer.metadata.target, observer.options).then(function (entity) {
                                if (!entity || !observer.lastEmitEntity) {
                                    if (entity === undefined && observer.lastEmitEntity === undefined) {
                                        return;
                                    }
                                    observer.lastEmitEntity = entity;
                                    observer.subscriptionObserver.next(observer.lastEmitEntity);
                                    return;
                                }
                                var newEntities = _this.findInserted(observer.metadata, [entity], [observer.lastEmitEntity]);
                                if (newEntities) {
                                    observer.lastEmitEntity = newEntities[0];
                                    observer.subscriptionObserver.next(observer.lastEmitEntity);
                                }
                            })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 4:
                        if (!(observer.type === "findAndCount")) return [3 /*break*/, 6];
                        return [4 /*yield*/, observer.connection.manager.findAndCount(observer.metadata.target, observer.options).then(function (_a) {
                                var _b = __read(_a, 2), entities = _b[0], count = _b[1];
                                var newEntities = _this.findInserted(observer.metadata, entities, observer.lastEmitEntities);
                                if (newEntities || count !== observer.lastEmitCount) {
                                    if (newEntities)
                                        observer.lastEmitEntities = newEntities;
                                    if (count !== observer.lastEmitCount)
                                        observer.lastEmitCount = count;
                                    observer.subscriptionObserver.next([observer.lastEmitEntities, observer.lastEmitCount]);
                                }
                            })];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 6:
                        if (!(observer.type === "count")) return [3 /*break*/, 8];
                        return [4 /*yield*/, observer.connection.manager.count(observer.metadata.target, observer.options, { observers: false }).then(function (count) {
                                if (count !== observer.lastEmitCount) {
                                    observer.lastEmitCount = count;
                                    observer.subscriptionObserver.next(observer.lastEmitCount);
                                }
                            })];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    ObserverExecutor.prototype.findInserted = function (metadata, entities, lastEmitEntities) {
        // to make sure we won't have instance mess we try to return array of NEW entities
        // in the same NEW order we have, but with OLD instances that we can find in the
        var hasChange = false;
        entities = entities.map(function (entity) {
            var sameEntityInPrevious = lastEmitEntities.find(function (previousEntity) {
                return metadata.compareEntities(entity, previousEntity);
            });
            if (sameEntityInPrevious) {
                return sameEntityInPrevious;
            }
            else {
                hasChange = true;
                return entity;
            }
        });
        // if we have any new entity emit a new event
        if (hasChange)
            return entities;
        return undefined;
    };
    ObserverExecutor.prototype.handleUpdateEvent = function (observer) {
        return __awaiter(this, void 0, void 0, function () {
            var events, hasEntities, hasAnyEntityChanges;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        events = observer.updateEvents;
                        hasEntities = events.every(function (event) {
                            return event.entity && observer.metadata.hasId(event.entity);
                        });
                        if (hasEntities && observer.type !== "count") {
                            hasAnyEntityChanges = events.some(function (event) { return _this.hasChanges(observer, event.entity); });
                            if (hasAnyEntityChanges === false)
                                return [2 /*return*/];
                        }
                        if (!(observer.type === "find")) return [3 /*break*/, 2];
                        return [4 /*yield*/, observer.connection.manager
                                .find(observer.metadata.target, observer.options)
                                .then(function (entities) {
                                var hasChanges = entities.some(function (entity) { return _this.hasChanges(observer, entity); });
                                if (hasChanges || entities.length !== observer.lastEmitEntities.length) {
                                    observer.lastEmitEntities = entities;
                                    observer.subscriptionObserver.next(observer.lastEmitEntities);
                                }
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 2:
                        if (!(observer.type === "findOne")) return [3 /*break*/, 4];
                        return [4 /*yield*/, observer.connection.manager
                                .findOne(observer.metadata.target, observer.options)
                                .then(function (entity) {
                                if (!entity) {
                                    observer.lastEmitEntity = undefined;
                                    observer.subscriptionObserver.next(observer.lastEmitEntity);
                                }
                                else if (_this.hasChanges(observer, entity)) {
                                    observer.lastEmitEntity = entity;
                                    observer.subscriptionObserver.next(observer.lastEmitEntity);
                                }
                            })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 4:
                        if (!(observer.type === "findAndCount")) return [3 /*break*/, 6];
                        return [4 /*yield*/, observer.connection.manager
                                .findAndCount(observer.metadata.target, observer.options)
                                .then(function (_a) {
                                var _b = __read(_a, 2), entities = _b[0], count = _b[1];
                                var hasChanges = entities.some(function (entity) { return _this.hasChanges(observer, entity); });
                                if (hasChanges || count !== observer.lastEmitCount || entities.length !== observer.lastEmitEntities.length) {
                                    if (hasChanges || entities.length !== observer.lastEmitEntities.length)
                                        observer.lastEmitEntities = entities;
                                    if (count !== observer.lastEmitCount)
                                        observer.lastEmitCount = count;
                                    observer.subscriptionObserver.next([observer.lastEmitEntities, observer.lastEmitCount]);
                                }
                            })];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 6:
                        if (!(observer.type === "count")) return [3 /*break*/, 8];
                        return [4 /*yield*/, observer.connection.manager
                                .count(observer.metadata.target, observer.options)
                                .then(function (count) {
                                if (count !== observer.lastEmitCount) {
                                    observer.lastEmitCount = count;
                                    observer.subscriptionObserver.next(observer.lastEmitCount);
                                }
                            })];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    ObserverExecutor.prototype.hasChanges = function (observer, entity) {
        var previousEntity;
        if (observer.type === "find" || observer.type === "findAndCount") {
            previousEntity = observer.lastEmitEntities.find(function (previousEntity) {
                return observer.metadata.compareEntities(previousEntity, entity);
            });
        }
        else if (observer.type === "findOne") {
            previousEntity = observer.lastEmitEntity;
        }
        // if previous entity is not set it probably means it was failed off the condition first,
        // then update causes it to match the condition
        if (!previousEntity)
            return true;
        var subject = new Subject_1.Subject({
            metadata: observer.metadata,
            entity: entity,
            databaseEntity: previousEntity,
        });
        // find changed columns - if we have them
        new SubjectChangedColumnsComputer_1.SubjectChangedColumnsComputer().compute([subject]);
        return subject.changeMaps.length > 0;
    };
    ObserverExecutor.prototype.handleRemoveEvent = function (observer) {
        return __awaiter(this, void 0, void 0, function () {
            var events, allEntities;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        events = observer.removeEvents;
                        allEntities = events.every(function (event) { return event.entityId; });
                        if (!(allEntities && observer.type !== "count")) return [3 /*break*/, 1];
                        events.forEach(function (event) {
                            if (observer.type === "find") {
                                var findPreviousEntity = observer.lastEmitEntities.find(function (entity) {
                                    return observer.metadata.compareEntities(entity, observer.metadata.ensureEntityIdMap(event.entityId));
                                });
                                if (findPreviousEntity) {
                                    observer.lastEmitEntities.splice(observer.lastEmitEntities.indexOf(findPreviousEntity), 1);
                                    observer.subscriptionObserver.next(observer.lastEmitEntities);
                                }
                            }
                            else if (observer.type === "findAndCount") {
                                var findAndCountPreviousEntity = observer.lastEmitEntities.find(function (entity) {
                                    return observer.metadata.compareEntities(entity, observer.metadata.ensureEntityIdMap(event.entityId));
                                });
                                if (findAndCountPreviousEntity) {
                                    observer.lastEmitEntities.splice(observer.lastEmitEntities.indexOf(findAndCountPreviousEntity), 1);
                                    observer.lastEmitCount--;
                                    observer.subscriptionObserver.next([observer.lastEmitEntities, observer.lastEmitCount]);
                                }
                            }
                            else if (observer.type === "findOne") {
                                if (observer.lastEmitEntity) {
                                    if (observer.metadata.compareEntities(observer.lastEmitEntity, observer.metadata.ensureEntityIdMap(event.entityId))) {
                                        observer.lastEmitEntity = undefined;
                                        observer.subscriptionObserver.next(observer.lastEmitEntity);
                                    }
                                }
                            }
                        });
                        return [2 /*return*/];
                    case 1:
                        if (!(observer.type === "find")) return [3 /*break*/, 3];
                        if (!observer.lastEmitEntities.length && !observer.lastEmitCount)
                            return [2 /*return*/];
                        return [4 /*yield*/, observer.connection.manager.find(observer.metadata.target, observer.options).then(function (entities) {
                                // if we have any new entity emit a new event
                                if (_this.hasRemoved(observer, entities)) {
                                    observer.lastEmitEntities = entities;
                                    observer.subscriptionObserver.next(observer.lastEmitEntities);
                                }
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 3:
                        if (!(observer.type === "findAndCount")) return [3 /*break*/, 5];
                        if (!observer.lastEmitEntities.length && !observer.lastEmitCount)
                            return [2 /*return*/];
                        return [4 /*yield*/, observer.connection.manager.findAndCount(observer.metadata.target, observer.options).then(function (_a) {
                                var _b = __read(_a, 2), entities = _b[0], count = _b[1];
                                // if we have any new entity emit a new event
                                if (_this.hasRemoved(observer, entities) || observer.lastEmitCount !== count) {
                                    observer.lastEmitEntities = entities;
                                    observer.lastEmitCount = count;
                                    observer.subscriptionObserver.next([observer.lastEmitEntities, observer.lastEmitCount]);
                                }
                            })];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 5:
                        if (!(observer.type === "findOne")) return [3 /*break*/, 7];
                        if (!observer.lastEmitEntity)
                            return [2 /*return*/];
                        return [4 /*yield*/, observer.connection.manager.findOne(observer.metadata.target, observer.options).then(function (entity) {
                                if (!entity) {
                                    observer.lastEmitEntity = undefined;
                                    observer.subscriptionObserver.next(observer.lastEmitEntity);
                                    return;
                                }
                                // if we have any new entity emit a new event
                                if (_this.hasRemoved(observer, [entity])) {
                                    observer.lastEmitEntity = undefined;
                                    observer.subscriptionObserver.next(observer.lastEmitEntity);
                                }
                            })];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 7:
                        if (!(observer.type === "count")) return [3 /*break*/, 9];
                        if (!observer.lastEmitCount)
                            return [2 /*return*/];
                        return [4 /*yield*/, observer.connection.manager.count(observer.metadata.target, observer.options, { observers: false }).then(function (count) {
                                if (observer.lastEmitCount !== count) {
                                    observer.lastEmitCount = count;
                                    observer.subscriptionObserver.next(observer.lastEmitCount);
                                }
                            })];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    ObserverExecutor.prototype.hasRemoved = function (observer, entities) {
        var hasChange = false;
        if (observer.type === "find" || observer.type === "findAndCount") {
            observer.lastEmitEntities.forEach(function (previousEntity) {
                var entity = entities.find(function (entity) {
                    return observer.metadata.compareEntities(previousEntity, entity);
                });
                if (!entity) {
                    hasChange = true;
                    observer.lastEmitEntities.splice(observer.lastEmitEntities.indexOf(previousEntity), 1);
                }
            });
        }
        else if (observer.type === "findOne") {
            if (!observer.lastEmitEntity)
                return false;
            var entity = entities.find(function (entity) {
                return observer.metadata.compareEntities(observer.lastEmitEntity, entity);
            });
            if (!entity)
                return false;
        }
        return hasChange;
    };
    return ObserverExecutor;
}());
exports.ObserverExecutor = ObserverExecutor;

//# sourceMappingURL=ObserverExecutor.js.map
