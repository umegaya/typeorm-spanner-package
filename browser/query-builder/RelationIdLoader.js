import * as tslib_1 from "tslib";
/**
 * Loads relation ids for the given entities.
 */
var RelationIdLoader = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function RelationIdLoader(connection) {
        this.connection = connection;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Loads relation ids of the given entity or entities.
     */
    RelationIdLoader.prototype.load = function (relation, entityOrEntities, relatedEntityOrRelatedEntities) {
        var entities = entityOrEntities instanceof Array ? entityOrEntities : [entityOrEntities];
        var relatedEntities = relatedEntityOrRelatedEntities instanceof Array ? relatedEntityOrRelatedEntities : (relatedEntityOrRelatedEntities ? [relatedEntityOrRelatedEntities] : undefined);
        // load relation ids depend of relation type
        if (relation.isManyToMany) {
            return this.loadForManyToMany(relation, entities, relatedEntities);
        }
        else if (relation.isManyToOne || relation.isOneToOneOwner) {
            return this.loadForManyToOneAndOneToOneOwner(relation, entities, relatedEntities);
        }
        else { // if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            return this.loadForOneToManyAndOneToOneNotOwner(relation, entities, relatedEntities);
        }
    };
    /**
     * Loads relation ids of the given entities and groups them into the object with parent and children.
     *
     * todo: extract this method?
     */
    RelationIdLoader.prototype.loadManyToManyRelationIdsAndGroup = function (relation, entitiesOrEntities, relatedEntityOrEntities, queryBuilder) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var isMany, entities, relationIds, relatedEntities, columns, inverseColumns;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        isMany = relation.isManyToMany || relation.isOneToMany;
                        entities = entitiesOrEntities instanceof Array ? entitiesOrEntities : [entitiesOrEntities];
                        if (!!relatedEntityOrEntities) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.connection.relationLoader.load(relation, entitiesOrEntities, undefined, queryBuilder)];
                    case 1:
                        relatedEntityOrEntities = _a.sent();
                        if (!relatedEntityOrEntities.length)
                            return [2 /*return*/, entities.map(function (entity) { return ({ entity: entity, related: isMany ? [] : undefined }); })];
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.load(relation, entitiesOrEntities, relatedEntityOrEntities)];
                    case 3:
                        relationIds = _a.sent();
                        relatedEntities = relatedEntityOrEntities instanceof Array ? relatedEntityOrEntities : [relatedEntityOrEntities];
                        columns = [], inverseColumns = [];
                        if (relation.isManyToManyOwner) {
                            columns = relation.junctionEntityMetadata.inverseColumns.map(function (column) { return column.referencedColumn; });
                            inverseColumns = relation.junctionEntityMetadata.ownerColumns.map(function (column) { return column.referencedColumn; });
                        }
                        else if (relation.isManyToManyNotOwner) {
                            columns = relation.junctionEntityMetadata.ownerColumns.map(function (column) { return column.referencedColumn; });
                            inverseColumns = relation.junctionEntityMetadata.inverseColumns.map(function (column) { return column.referencedColumn; });
                        }
                        else if (relation.isManyToOne || relation.isOneToOneOwner) {
                            columns = relation.joinColumns.map(function (column) { return column.referencedColumn; });
                            inverseColumns = relation.entityMetadata.primaryColumns;
                        }
                        else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
                            columns = relation.inverseRelation.entityMetadata.primaryColumns;
                            inverseColumns = relation.inverseRelation.joinColumns.map(function (column) { return column.referencedColumn; });
                        }
                        else {
                        }
                        return [2 /*return*/, entities.map(function (entity) {
                                var group = { entity: entity, related: isMany ? [] : undefined };
                                var entityRelationIds = relationIds.filter(function (relationId) {
                                    return inverseColumns.every(function (column) {
                                        return column.compareEntityValue(entity, relationId[column.entityMetadata.name + "_" + column.propertyAliasName]);
                                    });
                                });
                                if (!entityRelationIds.length)
                                    return group;
                                relatedEntities.forEach(function (relatedEntity) {
                                    entityRelationIds.forEach(function (relationId) {
                                        var relatedEntityMatched = columns.every(function (column) {
                                            return column.compareEntityValue(relatedEntity, relationId[column.entityMetadata.name + "_" + relation.propertyPath.replace(".", "_") + "_" + column.propertyPath.replace(".", "_")]);
                                        });
                                        if (relatedEntityMatched) {
                                            if (isMany) {
                                                group.related.push(relatedEntity);
                                            }
                                            else {
                                                group.related = relatedEntity;
                                            }
                                        }
                                    });
                                });
                                return group;
                            })];
                }
            });
        });
    };
    /**
     * Loads relation ids of the given entities and maps them into the given entity property.

    async loadManyToManyRelationIdsAndMap(
        relation: RelationMetadata,
        entityOrEntities: ObjectLiteral|ObjectLiteral[],
        mapToEntityOrEntities: ObjectLiteral|ObjectLiteral[],
        propertyName: string
    ): Promise<void> {

        const relationIds = await this.loadManyToManyRelationIds(relation, entityOrEntities, mapToEntityOrEntities);
        const mapToEntities = mapToEntityOrEntities instanceof Array ? mapToEntityOrEntities : [mapToEntityOrEntities];
        const junctionMetadata = relation.junctionEntityMetadata!;
        const mainAlias = junctionMetadata.name;
        const columns = relation.isOwning ? junctionMetadata.inverseColumns : junctionMetadata.ownerColumns;
        const inverseColumns = relation.isOwning ? junctionMetadata.ownerColumns : junctionMetadata.inverseColumns;

        mapToEntities.forEach(mapToEntity => {
            mapToEntity[propertyName] = [];
            relationIds.forEach(relationId => {
                const match = inverseColumns.every(column => {
                    return column.referencedColumn!.getEntityValue(mapToEntity) === relationId[mainAlias + "_" + column.propertyName];
                });
                if (match) {
                    if (columns.length === 1) {
                        mapToEntity[propertyName].push(relationId[mainAlias + "_" + columns[0].propertyName]);

                    } else {
                        const value = {};
                        columns.forEach(column => {
                            column.referencedColumn!.setEntityValue(value, relationId[mainAlias + "_" + column.propertyName]);
                        });
                        mapToEntity[propertyName].push(value);
                    }
                }
            });
        });
    }*/
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Loads relation ids for the many-to-many relation.
     */
    RelationIdLoader.prototype.loadForManyToMany = function (relation, entities, relatedEntities) {
        var junctionMetadata = relation.junctionEntityMetadata;
        var mainAlias = junctionMetadata.name;
        var columns = relation.isOwning ? junctionMetadata.ownerColumns : junctionMetadata.inverseColumns;
        var inverseColumns = relation.isOwning ? junctionMetadata.inverseColumns : junctionMetadata.ownerColumns;
        var qb = this.connection.createQueryBuilder();
        // select all columns from junction table
        columns.forEach(function (column) {
            var columnName = column.referencedColumn.entityMetadata.name + "_" + column.referencedColumn.propertyPath.replace(".", "_");
            qb.addSelect(mainAlias + "." + column.propertyPath, columnName);
        });
        inverseColumns.forEach(function (column) {
            var columnName = column.referencedColumn.entityMetadata.name + "_" + relation.propertyPath.replace(".", "_") + "_" + column.referencedColumn.propertyPath.replace(".", "_");
            qb.addSelect(mainAlias + "." + column.propertyPath, columnName);
        });
        // add conditions for the given entities
        var condition1 = "";
        if (columns.length === 1) {
            var values = entities.map(function (entity) { return columns[0].referencedColumn.getEntityValue(entity); });
            var areAllNumbers = values.every(function (value) { return typeof value === "number"; });
            if (areAllNumbers) {
                qb.where(mainAlias + "." + columns[0].propertyPath + " IN (" + values.join(", ") + ")");
            }
            else {
                qb.setParameter("values1", values);
                condition1 = mainAlias + "." + columns[0].propertyPath + " IN (:...values1)"; // todo: use ANY for postgres
            }
        }
        else {
            condition1 = "(" + entities.map(function (entity, entityIndex) {
                return columns.map(function (column) {
                    var paramName = "entity1_" + entityIndex + "_" + column.propertyName;
                    qb.setParameter(paramName, column.referencedColumn.getEntityValue(entity));
                    return mainAlias + "." + column.propertyPath + " = :" + paramName;
                }).join(" AND ");
            }).map(function (condition) { return "(" + condition + ")"; }).join(" OR ") + ")";
        }
        // add conditions for the given inverse entities
        var condition2 = "";
        if (relatedEntities) {
            if (inverseColumns.length === 1) {
                var values = relatedEntities.map(function (entity) { return inverseColumns[0].referencedColumn.getEntityValue(entity); });
                var areAllNumbers = values.every(function (value) { return typeof value === "number"; });
                if (areAllNumbers) {
                    qb.where(mainAlias + "." + columns[0].propertyPath + " IN (" + values.join(", ") + ")");
                }
                else {
                    qb.setParameter("values2", values);
                    condition2 = mainAlias + "." + inverseColumns[0].propertyPath + " IN (:...values2)"; // todo: use ANY for postgres
                }
            }
            else {
                condition2 = "(" + relatedEntities.map(function (entity, entityIndex) {
                    return inverseColumns.map(function (column) {
                        var paramName = "entity2_" + entityIndex + "_" + column.propertyName;
                        qb.setParameter(paramName, column.referencedColumn.getEntityValue(entity));
                        return mainAlias + "." + column.propertyPath + " = :" + paramName;
                    }).join(" AND ");
                }).map(function (condition) { return "(" + condition + ")"; }).join(" OR ") + ")";
            }
        }
        // qb.from(junctionMetadata.target, mainAlias)
        //     .where(condition1 + (condition2 ? " AND " + condition2 : ""));
        //
        // // execute query
        // const { values1, values2 } = qb.getParameters();
        // console.log(`I can do it`, { values1, values2 });
        // if (inverseColumns.length === 1 &&
        //     columns.length === 1 &&
        //     this.connection.driver instanceof SqliteDriver &&
        //     (values1.length + values2.length) > 500 &&
        //     values1.length === values2.length) {
        //     console.log(`I can do it`);
        //     return qb.getRawMany();
        //
        // } else {
        //     return qb.getRawMany();
        // }
        // execute query
        return qb
            .from(junctionMetadata.target, mainAlias)
            .where(condition1 + (condition2 ? " AND " + condition2 : ""))
            .getRawMany();
    };
    /**
     * Loads relation ids for the many-to-one and one-to-one owner relations.
     */
    RelationIdLoader.prototype.loadForManyToOneAndOneToOneOwner = function (relation, entities, relatedEntities) {
        var mainAlias = relation.entityMetadata.targetName;
        // console.log("entitiesx", entities);
        // console.log("relatedEntitiesx", relatedEntities);
        var hasAllJoinColumnsInEntity = relation.joinColumns.every(function (joinColumn) {
            return !!relation.entityMetadata.nonVirtualColumns.find(function (column) { return column === joinColumn; });
        });
        if (relatedEntities && hasAllJoinColumnsInEntity) {
            var relationIdMaps_1 = [];
            entities.forEach(function (entity) {
                var relationIdMap = {};
                relation.entityMetadata.primaryColumns.forEach(function (primaryColumn) {
                    var key = primaryColumn.entityMetadata.name + "_" + primaryColumn.propertyPath.replace(".", "_");
                    relationIdMap[key] = primaryColumn.getEntityValue(entity);
                });
                relatedEntities.forEach(function (relatedEntity) {
                    relation.joinColumns.forEach(function (joinColumn) {
                        var entityColumnValue = joinColumn.getEntityValue(entity);
                        var relatedEntityColumnValue = joinColumn.referencedColumn.getEntityValue(relatedEntity);
                        if (entityColumnValue === undefined || relatedEntityColumnValue === undefined)
                            return;
                        if (entityColumnValue === relatedEntityColumnValue) {
                            var key = joinColumn.referencedColumn.entityMetadata.name + "_" + relation.propertyPath.replace(".", "_") + "_" + joinColumn.referencedColumn.propertyPath.replace(".", "_");
                            relationIdMap[key] = relatedEntityColumnValue;
                        }
                    });
                });
                if (Object.keys(relationIdMap).length === relation.entityMetadata.primaryColumns.length + relation.joinColumns.length) {
                    relationIdMaps_1.push(relationIdMap);
                }
            });
            // console.log("relationIdMap", relationIdMaps);
            // console.log("entities.length", entities.length);
            if (relationIdMaps_1.length === entities.length)
                return Promise.resolve(relationIdMaps_1);
        }
        // select all columns we need
        var qb = this.connection.createQueryBuilder();
        relation.entityMetadata.primaryColumns.forEach(function (primaryColumn) {
            var columnName = primaryColumn.entityMetadata.name + "_" + primaryColumn.propertyPath.replace(".", "_");
            qb.addSelect(mainAlias + "." + primaryColumn.propertyPath, columnName);
        });
        relation.joinColumns.forEach(function (column) {
            var columnName = column.referencedColumn.entityMetadata.name + "_" + relation.propertyPath.replace(".", "_") + "_" + column.referencedColumn.propertyPath.replace(".", "_");
            qb.addSelect(mainAlias + "." + column.propertyPath, columnName);
        });
        // add condition for entities
        var condition = "";
        if (relation.entityMetadata.primaryColumns.length === 1) {
            var values = entities.map(function (entity) { return relation.entityMetadata.primaryColumns[0].getEntityValue(entity); });
            var areAllNumbers = values.every(function (value) { return typeof value === "number"; });
            if (areAllNumbers) {
                condition = mainAlias + "." + relation.entityMetadata.primaryColumns[0].propertyPath + " IN (" + values.join(", ") + ")";
            }
            else {
                qb.setParameter("values", values);
                condition = mainAlias + "." + relation.entityMetadata.primaryColumns[0].propertyPath + " IN (:...values)"; // todo: use ANY for postgres
            }
        }
        else {
            condition = entities.map(function (entity, entityIndex) {
                return relation.entityMetadata.primaryColumns.map(function (column, columnIndex) {
                    var paramName = "entity" + entityIndex + "_" + columnIndex;
                    qb.setParameter(paramName, column.getEntityValue(entity));
                    return mainAlias + "." + column.propertyPath + " = :" + paramName;
                }).join(" AND ");
            }).map(function (condition) { return "(" + condition + ")"; }).join(" OR ");
        }
        // execute query
        return qb.from(relation.entityMetadata.target, mainAlias)
            .where(condition)
            .getRawMany();
    };
    /**
     * Loads relation ids for the one-to-many and one-to-one not owner relations.
     */
    RelationIdLoader.prototype.loadForOneToManyAndOneToOneNotOwner = function (relation, entities, relatedEntities) {
        relation = relation.inverseRelation;
        if (relation.entityMetadata.primaryColumns.length === relation.joinColumns.length) {
            var sameReferencedColumns = relation.entityMetadata.primaryColumns.every(function (column) {
                return relation.joinColumns.indexOf(column) !== -1;
            });
            if (sameReferencedColumns) {
                return Promise.resolve(entities.map(function (entity) {
                    var result = {};
                    relation.joinColumns.forEach(function (joinColumn) {
                        var value = joinColumn.referencedColumn.getEntityValue(entity);
                        var joinColumnName = joinColumn.referencedColumn.entityMetadata.name + "_" + joinColumn.referencedColumn.propertyPath.replace(".", "_");
                        var primaryColumnName = joinColumn.entityMetadata.name + "_" + relation.inverseRelation.propertyPath.replace(".", "_") + "_" + joinColumn.propertyPath.replace(".", "_");
                        result[joinColumnName] = value;
                        result[primaryColumnName] = value;
                    });
                    return result;
                }));
            }
        }
        var mainAlias = relation.entityMetadata.targetName;
        // select all columns we need
        var qb = this.connection.createQueryBuilder();
        relation.entityMetadata.primaryColumns.forEach(function (primaryColumn) {
            var columnName = primaryColumn.entityMetadata.name + "_" + relation.inverseRelation.propertyPath.replace(".", "_") + "_" + primaryColumn.propertyPath.replace(".", "_");
            qb.addSelect(mainAlias + "." + primaryColumn.propertyPath, columnName);
        });
        relation.joinColumns.forEach(function (column) {
            var columnName = column.referencedColumn.entityMetadata.name + "_" + column.referencedColumn.propertyPath.replace(".", "_");
            qb.addSelect(mainAlias + "." + column.propertyPath, columnName);
        });
        // add condition for entities
        var condition = "";
        if (relation.joinColumns.length === 1) {
            var values = entities.map(function (entity) { return relation.joinColumns[0].referencedColumn.getEntityValue(entity); });
            var areAllNumbers = values.every(function (value) { return typeof value === "number"; });
            if (areAllNumbers) {
                condition = mainAlias + "." + relation.joinColumns[0].propertyPath + " IN (" + values.join(", ") + ")";
            }
            else {
                qb.setParameter("values", values);
                condition = mainAlias + "." + relation.joinColumns[0].propertyPath + " IN (:...values)"; // todo: use ANY for postgres
            }
        }
        else {
            condition = entities.map(function (entity, entityIndex) {
                return relation.joinColumns.map(function (joinColumn, joinColumnIndex) {
                    var paramName = "entity" + entityIndex + "_" + joinColumnIndex;
                    qb.setParameter(paramName, joinColumn.referencedColumn.getEntityValue(entity));
                    return mainAlias + "." + joinColumn.propertyPath + " = :" + paramName;
                }).join(" AND ");
            }).map(function (condition) { return "(" + condition + ")"; }).join(" OR ");
        }
        // execute query
        return qb.from(relation.entityMetadata.target, mainAlias)
            .where(condition)
            .getRawMany();
    };
    return RelationIdLoader;
}());
export { RelationIdLoader };

//# sourceMappingURL=RelationIdLoader.js.map
