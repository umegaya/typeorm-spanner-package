import { EntityFactoryInterface } from './EntityFactoryInterface';
export declare class DefaultEntityFactory implements EntityFactoryInterface {
    /**
     * Returns an entity object
     */
    createEntity(target: Function): Object;
}
