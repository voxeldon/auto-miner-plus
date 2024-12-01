import { Entity, EntityDieAfterEvent, EntityDieAfterEventSignal, EntityLoadAfterEvent, EntityLoadAfterEventSignal, EntityRemoveAfterEventSignal, EntityRemoveBeforeEvent, EntityRemoveBeforeEventSignal, EntitySpawnAfterEvent, EntitySpawnAfterEventSignal, Player, ScoreboardIdentity, ScoreboardIdentityType, ScoreboardObjective, system, world } from "@minecraft/server";
import { SDB } from "../util/db";
import { DynamicPropertyMap, EntityOperations } from "../util/entity";

export interface ForEntityOptions {
    typeId?: string,
    delayInterval?: number,
    requireSimulationRange?: boolean
}
export type ForEntityEvent = { entity: Entity };
export type ForEntityEventSignal = (event: ForEntityEvent) => void;

export interface RegisteredEntityOptions{
    typeId: string,
    delayInterval?: number,
    requireSimulationRange?: boolean
    
}

export class ForEntity {
    public static forEntityEventSignal: ForEntityEventSignal[] = [];
    public static forEntityOptionsIndex: Map<ForEntityEventSignal,ForEntityOptions> = new Map<ForEntityEventSignal,ForEntityOptions>();

    public static subscribe(callback: ForEntityEventSignal, forEntityOptions?: ForEntityOptions): ForEntityEventSignal {
        ForEntity.forEntityEventSignal.push(callback);
        if (forEntityOptions) ForEntity.forEntityOptionsIndex.set(callback, forEntityOptions);
        return callback;
    }

    public static unsubscribe(callback: ForEntityEventSignal): void {
        const index = ForEntity.forEntityEventSignal.indexOf(callback);
        if (index !== -1) {
            ForEntity.forEntityEventSignal.splice(index, 1);
            if (ForEntity.forEntityOptionsIndex.has(callback)) {
                ForEntity.forEntityOptionsIndex.delete(callback);
            }
        }
    }
}

export type OnEntityRemovedEvent = {entity: Entity, dynamicPropertyMap: DynamicPropertyMap};
export type OnEntityRemovedEventSignal = (event: OnEntityRemovedEvent) => void;

export class OnEntityRemoved {
    public static OnEntityRemovedEventSignal: OnEntityRemovedEventSignal[] = [];

    public static subscribe(callback: OnEntityRemovedEventSignal): OnEntityRemovedEventSignal {
        OnEntityRemoved.OnEntityRemovedEventSignal.push(callback);
        return callback
    }

    public static unsubscribe(callback: OnEntityRemovedEventSignal): void {
        const index = OnEntityRemoved.OnEntityRemovedEventSignal.indexOf(callback);
        if (index !== -1) {
            OnEntityRemoved.OnEntityRemovedEventSignal.splice(index, 1);
        }
    }
}

export type OnEntitySpawnedEvent = {entity: Entity};
export type OnEntitySpawnedEventSignal = (event: OnEntitySpawnedEvent) => void;

export class OnEntitySpawned {
    public static OnEntitySpawnedEventSignal: OnEntitySpawnedEventSignal[] = [];

    public static subscribe(callback: OnEntitySpawnedEventSignal): OnEntitySpawnedEventSignal {
        OnEntitySpawned.OnEntitySpawnedEventSignal.push(callback);
        return callback
    }

    public static unsubscribe(callback: OnEntitySpawnedEventSignal): void {
        const index = OnEntitySpawned.OnEntitySpawnedEventSignal.indexOf(callback);
        if (index !== -1) {
            OnEntitySpawned.OnEntitySpawnedEventSignal.splice(index, 1);
        }
    }
}

export class EntityManager {
    public static delayInterval: number = 0;
    public static readonly simulationDistance: number = 4 * 16;

    private static packId: string = '';
    private static registeredEntityOptions: RegisteredEntityOptions[] = [];
    private static entityOptionsIndex: Map<string, RegisteredEntityOptions> = new Map<string, RegisteredEntityOptions>();

    private static readonly forEntitiesSystemProcesses: number[] = [];
    private static readonly registeredEntities  : Map<string, Entity> = new Map<string, Entity>();

    private static readonly entitySpawnSignal  : EntitySpawnAfterEventSignal   = world.afterEvents.entitySpawn;
    private static readonly entityLoadSignal   : EntityLoadAfterEventSignal    = world.afterEvents.entityLoad;
    private static readonly entityDieSignal    : EntityDieAfterEventSignal     = world.afterEvents.entityDie;
    private static readonly entityRemoveSignal : EntityRemoveBeforeEventSignal = world.beforeEvents.entityRemove;

    private static onSpawnSubscription         : ((arg: EntitySpawnAfterEvent)   => void ) | undefined = undefined;
    private static onLoadSubscription          : ((arg: EntityLoadAfterEvent)    => void ) | undefined = undefined;
    private static onDieSubscription           : ((arg: EntityDieAfterEvent)     => void ) | undefined = undefined;
    private static onRemoveSubscription        : ((arg: EntityRemoveBeforeEvent) => void ) | undefined = undefined;

    //--- Public Methods ---

    public static initialize(packId: string, entityOptions: RegisteredEntityOptions[]): boolean {
        let error_occurred: boolean = false;
        let error: string = ''
        if (EntityManager.packId === '') EntityManager.packId = packId; else error_occurred = true; error = '@packId';
        if (EntityManager.registeredEntityOptions.length === 0) {EntityManager.registeredEntityOptions = entityOptions; EntityManager.initalizeOptionsIndex()} else error_occurred = true; error = '@registeredTypeIds';
        if (!EntityManager.onSpawnSubscription) EntityManager.onSpawnSubscription = EntityManager.entitySpawnSignal.subscribe(EntityManager.onSpawn); else error_occurred = true; error = '@entitySpawnSignal';
        if (!EntityManager.onLoadSubscription) EntityManager.onLoadSubscription = EntityManager.entityLoadSignal.subscribe(EntityManager.onLoad); else error_occurred = true; error = '@entityLoadSignal';
        if (!EntityManager.onDieSubscription) EntityManager.onDieSubscription = EntityManager.entityDieSignal.subscribe(EntityManager.onDie); else error_occurred = true; error = '@entityDieSignal';
        if (!EntityManager.onRemoveSubscription) EntityManager.onRemoveSubscription = EntityManager.entityRemoveSignal.subscribe(EntityManager.onRemove); else error_occurred = true; error = '@entityRemoveSignal';
        if (EntityManager.forEntitiesSystemProcesses.length === 0) EntityManager.forEntitiesOfIndex(); else error_occurred = true; error = '@forEntitiesOfIndex';
        if (error_occurred) console.warn('EntityManager.initialize', error);
        return error_occurred;
    }

    public static deactivate(): boolean {
        let error_occurred: boolean = false;
        let error: string = ''
        if (EntityManager.packId !== '') EntityManager.packId = ''; else error_occurred = true; error = '@packId';
        if (EntityManager.registeredEntityOptions.length > 0) EntityManager.registeredEntityOptions = []; else error_occurred = true; error = '@registeredTypeIds';
        if (EntityManager.onSpawnSubscription) EntityManager.entitySpawnSignal.unsubscribe(EntityManager.onSpawnSubscription); else error_occurred = true; error = '@entitySpawnSignal';
        if (EntityManager.onLoadSubscription) EntityManager.entityLoadSignal.unsubscribe(EntityManager.onLoadSubscription); else error_occurred = true; error = '@entityLoadSignal';
        if (EntityManager.onDieSubscription) EntityManager.entityDieSignal.unsubscribe(EntityManager.onDieSubscription); else error_occurred = true; error = '@entityDieSignal';
        if (EntityManager.onRemoveSubscription) EntityManager.entityRemoveSignal.unsubscribe(EntityManager.onRemoveSubscription); else error_occurred = true; error = '@entityRemoveSignal';
        if (EntityManager.forEntitiesSystemProcesses.length !== 0) EntityManager.clearSystemProcesses(); else error_occurred = true; error = '@forEntitiesOfIndex';
        if (error_occurred) console.warn('EntityManager.deactivate', error);
        return error_occurred;
    }

    public static generateEntityData(entity: Entity): boolean {
        if (entity && entity.isValid()) {
            const id: string = entity.id;
            const typeId: string = entity.typeId;
            const database: ScoreboardObjective = EntityManager.generateDatabase(typeId);
            const length = database.getParticipants().length;
            database.setScore(entity, length);
            EntityManager.registeredEntities.set(id, entity);
            return true;
        } return false;
    }
    
    public static deleteEntityData(entity: Entity): boolean {
        if (entity) {
            const id: string = entity.id;
            const typeId: string = entity.typeId;
            const database: ScoreboardObjective = EntityManager.generateDatabase(typeId);
            database.removeParticipant(entity);
            EntityManager.registeredEntities.delete(id);
            return true;
        } return false;
    }

    //--- Private Methods ---

    private static initalizeOptionsIndex(): void {
        for (const option of EntityManager.registeredEntityOptions) {
            EntityManager.entityOptionsIndex.set(option.typeId, option);
        }
    }

    private static clearSystemProcesses(): void {
        for (const process of EntityManager.forEntitiesSystemProcesses) {
            system.clearRun(process);
            EntityManager.forEntitiesSystemProcesses.splice(process, 1);
        }
    }

    private static onSpawn(event: EntitySpawnAfterEvent): void {
        if (!EntityManager.isValidEntityType(event.entity.typeId)) return;
        EntityManager.processesEntity(event.entity, false);
        //Re Emit
        for (const handler of OnEntitySpawned.OnEntitySpawnedEventSignal) {
            handler({entity: event.entity});
        }
    }
    
    private static onLoad(event: EntityLoadAfterEvent): void {
        if (!EntityManager.isValidEntityType(event.entity.typeId)) return;
        EntityManager.processesEntity(event.entity, false);
    }
    
    private static onDie(event: EntityDieAfterEvent): void {
        if (!EntityManager.isValidEntityType(event.deadEntity.typeId)) return;
    }
    
    private static onRemove(event: EntityRemoveBeforeEvent): void {
        const entity: Entity = event.removedEntity;
        EntityManager.processEmissionData(entity);
        EntityManager.processesEntity(event.removedEntity, true);
    }

    private static processEmissionData(entity: Entity) {
        if (!EntityManager.isValidEntityType(entity.typeId)) return;
        const dynamicPropertyMap: DynamicPropertyMap = EntityOperations.getDynamicProperties(entity);
        const eventData: OnEntityRemovedEvent = { entity, dynamicPropertyMap }; //here
        const emitToSubscriptions: number = system.run(()=>{
            for (const handler of OnEntityRemoved.OnEntityRemovedEventSignal) {
                handler(eventData);
            }
            system.clearRun(emitToSubscriptions);
        })
    }

    private static processesEntity(entity: Entity, remove: boolean): void {
        const runProcesses: number = system.run(() => {
            if (!remove) EntityManager.generateEntityData(entity);
            else EntityManager.deleteEntityData(entity);
            system.clearRun(runProcesses);
        });
    }

    private static repopulateDatabase(): void {
        if (EntityManager.registeredEntityOptions.length > 0) {
            for (const option of EntityManager.registeredEntityOptions) {
                const database: ScoreboardObjective = this.generateDatabase(option.typeId);
                const participants: ScoreboardIdentity[] = database.getParticipants();
                if (participants.length > 0) {
                    for (const participant of participants) {
                        if (participant.isValid() && participant.type === ScoreboardIdentityType.Entity) {
                            let entity: Entity | undefined = undefined;
                            try {entity = participant.getEntity();} catch (e) {}
                            if (entity) {
                                const id: string = entity.id
                                EntityManager.registeredEntities.set(id, entity);
                            } else EntityManager.registeredEntities.clear;
                        }
                    }
                }
            }
        }
    }

    private static forEntitiesOfIndex(): void {
        const entities: Map<string, Entity> = EntityManager.registeredEntities;
    
        for (const option of EntityManager.registeredEntityOptions) {
            let delayInterval: number = EntityManager.delayInterval;
    
            if (EntityManager.entityOptionsIndex.has(option.typeId) && option.delayInterval) {
                delayInterval = option.delayInterval;
            }
    
            EntityManager.forEntitiesSystemProcesses.push(
                system.runInterval(() => this.processEntities(entities, option), delayInterval)
            );
        }
    }
    
    private static processEntities(entities: Map<string, Entity>, option: ForEntityOptions): void {
        if (entities.size === 0) {
            EntityManager.repopulateDatabase();
            return;
        }
    
        for (const [id, entity] of entities) {
            if (this.shouldProcessEntity(entity, option)) {
                EntityManager.emitForEntityEvent(entity);
            }
        }
    }
    
    private static shouldProcessEntity(entity: Entity, option: ForEntityOptions): boolean {
        if (
            typeof option.requireSimulationRange === "boolean" && 
            option.requireSimulationRange === false
        ) {
            return entity.isValid() &&
                    entity.typeId === option.typeId;
        }
        return entity.isValid() &&
                entity.typeId === option.typeId &&
                EntityOperations.distanceToNearestPlayer(entity, EntityManager.simulationDistance) 
                    <= EntityManager.simulationDistance;
    }

    private static emitForEntityEvent(entity: Entity): void {
        const event: ForEntityEvent = { entity };
        for (const handler of ForEntity.forEntityEventSignal) {
            if (ForEntity.forEntityOptionsIndex.has(handler)) {
                const forEntityOptions: ForEntityOptions | undefined = 
                    ForEntity.forEntityOptionsIndex.get(handler);
                if (forEntityOptions && (forEntityOptions.typeId !== entity.typeId)) {
                    continue;
                }
                if (forEntityOptions && forEntityOptions.delayInterval) {
                    let storedDelayValue = entity.getDynamicProperty('spec:for_entity_delay') as number | undefined
                    if (!storedDelayValue) storedDelayValue = 0;
                    if (storedDelayValue < forEntityOptions.delayInterval) {
                        entity.setDynamicProperty('spec:for_entity_delay', storedDelayValue + 1);
                        continue;
                    } else {
                        entity.setDynamicProperty('spec:for_entity_delay', 0);
                    }
                }
            }
            handler(event);
        }
    }

    //--- Utility Methods ---
    private static generateDatabase(database_key: string): ScoreboardObjective {
        const databaseId: string = `${EntityManager.packId}_${database_key}`;
        let database: ScoreboardObjective | undefined = SDB.getDb(databaseId);
        if (!database) database = SDB.newDb(databaseId) as ScoreboardObjective;
        return database; 
    }

    private static isValidEntityType(typeId: string): boolean {
        const typeIds: string[] = [];
        for (const option of EntityManager.registeredEntityOptions) {
            typeIds.push(option.typeId);
        }
        return typeIds.includes(typeId);
    }
}