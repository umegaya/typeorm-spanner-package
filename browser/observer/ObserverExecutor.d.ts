import { QueryObserver } from "./QueryObserver";
/**
 * Executes all given observers.
 */
export declare class ObserverExecutor {
    private observers;
    constructor(observers: QueryObserver[]);
    /**
     * Executes given observers.
     */
    execute(): Promise<void>;
    private handleInsertEvent;
    private findInserted;
    private handleUpdateEvent;
    private hasChanges;
    private handleRemoveEvent;
    private hasRemoved;
}
