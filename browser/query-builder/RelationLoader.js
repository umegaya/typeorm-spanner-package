import * as tslib_1 from "tslib";
/**
 * Wraps entities and creates getters/setters for their relations
 * to be able to lazily load relations when accessing these relations.
 */
var RelationLoader = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function RelationLoader(connection) {
        this.connection = connection;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Loads relation data for the given entity and its relation.
     */
    RelationLoader.prototype.load = function (relation, entityOrEntities, queryRunner, queryBuilder) {
        if (queryRunner && queryRunner.isReleased)
            queryRunner = undefined; // get new one if already closed
        if (relation.isManyToOne || relation.isOneToOneOwner) {
            return this.loadManyToOneOrOneToOneOwner(relation, entityOrEntities, queryRunner, queryBuilder);
        }
        else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            return this.loadOneToManyOrOneToOneNotOwner(relation, entityOrEntities, queryRunner, queryBuilder);
        }
        else if (relation.isManyToManyOwner) {
            return this.loadManyToManyOwner(relation, entityOrEntities, queryRunner, queryBuilder);
        }
        else { // many-to-many non owner
            return this.loadManyToManyNotOwner(relation, entityOrEntities, queryRunner, queryBuilder);
        }
    };
    /**
     * Loads data for many-to-one and one-to-one owner relations.
     *
     * (ow) post.category<=>category.post
     * loaded: category from post
     * example: SELECT category.id AS category_id, category.name AS category_name FROM category category
     *              INNER JOIN post Post ON Post.category=category.id WHERE Post.id=1
     */
    RelationLoader.prototype.loadManyToOneOrOneToOneOwner = function (relation, entityOrEntities, queryRunner, queryBuilder) {
        var entities = entityOrEntities instanceof Array ? entityOrEntities : [entityOrEntities];
        var qb = queryBuilder ? queryBuilder : this.connection
            .createQueryBuilder(queryRunner)
            .select(relation.propertyName) // category
            .from(relation.type, relation.propertyName); // Category, category
        var mainAlias = qb.expressionMap.mainAlias.name;
        var columns = relation.entityMetadata.primaryColumns;
        var joinColumns = relation.isOwning ? relation.joinColumns : relation.inverseRelation.joinColumns;
        var conditions = joinColumns.map(function (joinColumn) {
            return relation.entityMetadata.name + "." + joinColumn.propertyName + " = " + mainAlias + "." + joinColumn.referencedColumn.propertyName;
        }).join(" AND ");
        var joinAliasName = relation.entityMetadata.name;
        qb.innerJoin(relation.entityMetadata.target, joinAliasName, conditions);
        if (columns.length === 1) {
            var values = entities.map(function (entity) { return columns[0].getEntityValue(entity); });
            var areAllNumbers = values.every(function (value) { return typeof value === "number"; });
            if (areAllNumbers) {
                qb.where(joinAliasName + "." + columns[0].propertyPath + " IN (" + values.join(", ") + ")");
            }
            else {
                qb.where(joinAliasName + "." + columns[0].propertyPath + " IN (:..." + (joinAliasName + "_" + columns[0].propertyName) + ")");
                qb.setParameter(joinAliasName + "_" + columns[0].propertyName, values);
            }
        }
        else {
            var condition = entities.map(function (entity, entityIndex) {
                return columns.map(function (column, columnIndex) {
                    var paramName = joinAliasName + "_entity_" + entityIndex + "_" + columnIndex;
                    qb.setParameter(paramName, column.getEntityValue(entity));
                    return joinAliasName + "." + column.propertyPath + " = :" + paramName;
                }).join(" AND ");
            }).map(function (condition) { return "(" + condition + ")"; }).join(" OR ");
            qb.where(condition);
        }
        return qb.getMany();
        // return qb.getOne(); todo: fix all usages
    };
    /**
     * Loads data for one-to-many and one-to-one not owner relations.
     *
     * SELECT post
     * FROM post post
     * WHERE post.[joinColumn.name] = entity[joinColumn.referencedColumn]
     */
    RelationLoader.prototype.loadOneToManyOrOneToOneNotOwner = function (relation, entityOrEntities, queryRunner, queryBuilder) {
        var entities = entityOrEntities instanceof Array ? entityOrEntities : [entityOrEntities];
        var columns = relation.inverseRelation.joinColumns;
        var qb = queryBuilder ? queryBuilder : this.connection
            .createQueryBuilder(queryRunner)
            .select(relation.propertyName)
            .from(relation.type, relation.propertyName);
        var aliasName = qb.expressionMap.mainAlias.name;
        if (columns.length === 1) {
            var values = entities.map(function (entity) { return columns[0].referencedColumn.getEntityValue(entity); });
            var areAllNumbers = values.every(function (value) { return typeof value === "number"; });
            if (areAllNumbers) {
                qb.where(aliasName + "." + columns[0].propertyPath + " IN (" + values.join(", ") + ")");
            }
            else {
                qb.where(aliasName + "." + columns[0].propertyPath + " IN (:..." + (aliasName + "_" + columns[0].propertyName) + ")");
                qb.setParameter(aliasName + "_" + columns[0].propertyName, values);
            }
        }
        else {
            var condition = entities.map(function (entity, entityIndex) {
                return columns.map(function (column, columnIndex) {
                    var paramName = aliasName + "_entity_" + entityIndex + "_" + columnIndex;
                    qb.setParameter(paramName, column.referencedColumn.getEntityValue(entity));
                    return aliasName + "." + column.propertyPath + " = :" + paramName;
                }).join(" AND ");
            }).map(function (condition) { return "(" + condition + ")"; }).join(" OR ");
            qb.where(condition);
        }
        return qb.getMany();
        // return relation.isOneToMany ? qb.getMany() : qb.getOne(); todo: fix all usages
    };
    /**
     * Loads data for many-to-many owner relations.
     *
     * SELECT category
     * FROM category category
     * INNER JOIN post_categories post_categories
     * ON post_categories.postId = :postId
     * AND post_categories.categoryId = category.id
     */
    RelationLoader.prototype.loadManyToManyOwner = function (relation, entityOrEntities, queryRunner, queryBuilder) {
        var entities = entityOrEntities instanceof Array ? entityOrEntities : [entityOrEntities];
        var qb = queryBuilder ? queryBuilder : this.connection
            .createQueryBuilder(queryRunner)
            .select(relation.propertyName)
            .from(relation.type, relation.propertyName);
        var mainAlias = qb.expressionMap.mainAlias.name;
        var joinAlias = relation.junctionEntityMetadata.tableName;
        var parameters = {};
        var joinColumnConditions = [];
        relation.joinColumns.forEach(function (joinColumn) {
            var values = entities.map(function (entity) { return joinColumn.referencedColumn.getEntityValue(entity); });
            var areAllNumbers = values.every(function (value) { return typeof value === "number"; });
            if (areAllNumbers) {
                joinColumnConditions.push(joinAlias + "." + joinColumn.propertyName + " IN (" + values.join(", ") + ")");
            }
            else {
                parameters[joinColumn.propertyName] = values;
                joinColumnConditions.push(joinAlias + "." + joinColumn.propertyName + " IN (:..." + joinColumn.propertyName + ")");
            }
        });
        var inverseJoinColumnConditions = relation.inverseJoinColumns.map(function (inverseJoinColumn) {
            return joinAlias + "." + inverseJoinColumn.propertyName + "=" + mainAlias + "." + inverseJoinColumn.referencedColumn.propertyName;
        });
        return qb
            .innerJoin(joinAlias, joinAlias, tslib_1.__spread(joinColumnConditions, inverseJoinColumnConditions).join(" AND "))
            .setParameters(parameters)
            .getMany();
    };
    /**
     * Loads data for many-to-many not owner relations.
     *
     * SELECT post
     * FROM post post
     * INNER JOIN post_categories post_categories
     * ON post_categories.postId = post.id
     * AND post_categories.categoryId = post_categories.categoryId
     */
    RelationLoader.prototype.loadManyToManyNotOwner = function (relation, entityOrEntities, queryRunner, queryBuilder) {
        var entities = entityOrEntities instanceof Array ? entityOrEntities : [entityOrEntities];
        var qb = queryBuilder ? queryBuilder : this.connection
            .createQueryBuilder(queryRunner)
            .select(relation.propertyName)
            .from(relation.type, relation.propertyName);
        var mainAlias = qb.expressionMap.mainAlias.name;
        var joinAlias = relation.junctionEntityMetadata.tableName;
        var joinColumnConditions = relation.inverseRelation.joinColumns.map(function (joinColumn) {
            return joinAlias + "." + joinColumn.propertyName + " = " + mainAlias + "." + joinColumn.referencedColumn.propertyName;
        });
        var parameters = {};
        var inverseJoinColumnConditions = [];
        relation.inverseRelation.inverseJoinColumns.forEach(function (column) {
            var values = entities.map(function (entity) { return column.referencedColumn.getEntityValue(entity); });
            var areAllNumbers = values.every(function (value) { return typeof value === "number"; });
            if (areAllNumbers) {
                joinColumnConditions.push(joinAlias + "." + column.propertyName + " IN (" + values.join(", ") + ")");
            }
            else {
                parameters[column.propertyName] = values;
                joinColumnConditions.push(joinAlias + "." + column.propertyName + " IN (:..." + column.propertyName + ")");
            }
        });
        return qb
            .innerJoin(joinAlias, joinAlias, tslib_1.__spread(joinColumnConditions, inverseJoinColumnConditions).join(" AND "))
            .setParameters(parameters)
            .getMany();
    };
    /**
     * Wraps given entity and creates getters/setters for its given relation
     * to be able to lazily load data when accessing this relation.
     */
    RelationLoader.prototype.enableLazyLoad = function (relation, entity, queryRunner, queryBuilder) {
        var relationLoader = this;
        var dataIndex = "__" + relation.propertyName + "__"; // in what property of the entity loaded data will be stored
        var promiseIndex = "__promise_" + relation.propertyName + "__"; // in what property of the entity loading promise will be stored
        var resolveIndex = "__has_" + relation.propertyName + "__"; // indicates if relation data already was loaded or not, we need this flag if loaded data is empty
        Object.defineProperty(entity, relation.propertyName, {
            get: function () {
                var _this = this;
                if (this[resolveIndex] === true || this[dataIndex]) // if related data already was loaded then simply return it
                    return Promise.resolve(this[dataIndex]);
                if (this[promiseIndex]) // if related data is loading then return a promise relationLoader loads it
                    return this[promiseIndex];
                // nothing is loaded yet, load relation data and save it in the model once they are loaded
                this[promiseIndex] = relationLoader.load(relation, this, queryRunner, queryBuilder).then(function (result) {
                    if (relation.isOneToOne || relation.isManyToOne)
                        result = result[0];
                    _this[dataIndex] = result;
                    _this[resolveIndex] = true;
                    delete _this[promiseIndex];
                    return _this[dataIndex];
                });
                return this[promiseIndex];
            },
            set: function (value) {
                var _this = this;
                if (value instanceof Promise) { // if set data is a promise then wait for its resolve and save in the object
                    value.then(function (result) {
                        _this[dataIndex] = result;
                        _this[resolveIndex] = true;
                    });
                }
                else { // if its direct data set (non promise, probably not safe-typed)
                    this[dataIndex] = value;
                    this[resolveIndex] = true;
                }
            },
            configurable: true
        });
    };
    return RelationLoader;
}());
export { RelationLoader };

//# sourceMappingURL=RelationLoader.js.map
