import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: ILike("%some sting%") }
 */
export declare function ILike<T>(value: T | FindOperator<T>): FindOperator<T>;
