import { EntityMetadata } from "..";
/**
 * Thrown when specified entity property in the find options were not found.
 */
export declare class FindCriteriaNotFoundError extends Error {
    constructor(propertyPath: string, metadata: EntityMetadata);
}
