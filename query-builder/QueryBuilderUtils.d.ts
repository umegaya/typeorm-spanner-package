/**
 * Helper utility functions for QueryBuilder.
 */
export declare class QueryBuilderUtils {
    /**
     * Checks if given value is a string representation of alias property,
     * e.g. "post.category" or "post.id".
     */
    static isAliasProperty(str: any): str is string;
    static extractAliasAndPropertyPath(str: string): [string, string];
}
