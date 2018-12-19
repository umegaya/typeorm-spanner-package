import { FindOptions } from "./FindOptions";
/**
 * Utilities to work with FindOptions.
 */
export declare class FindOptionsUtils {
    /**
     * Checks if given object is really instance of FindOneOptions interface.
     */
    static isFindOptions(obj: any): obj is FindOptions<any>;
}
/**
 * Normalizes find options.
 */
export declare function normalizeFindOptions<T>(options: FindOptions<T>): FindOptions<T>;
