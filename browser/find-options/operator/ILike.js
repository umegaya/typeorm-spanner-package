import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: ILike("%some sting%") }
 */
export function ILike(value) {
    return new FindOperator("ilike", value);
}

//# sourceMappingURL=ILike.js.map
