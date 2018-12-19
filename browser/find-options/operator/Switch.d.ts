/**
 * Switch Helper Operator.
 */
export declare function Switch<T>(condition: number, cases: {
    [key: number]: T;
} & {
    _?: T;
}): T | undefined;
/**
 * Switch Helper Operator.
 */
export declare function Switch<T>(condition: string, cases: {
    [key: string]: T;
} & {
    _?: T;
}): T | undefined;
