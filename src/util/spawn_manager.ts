import { Dimension, Entity, EntityProjectileComponent, EntityQueryOptions, EntitySpawnAfterEvent, Player, world } from "@minecraft/server";
import { Vector3 } from "../_import/spec/_module/util/vector";


const lang = {
    plural: `'s`,
    spawnError: 'Error spawning Vehicle'
}

export class SpawnManager{
    private static ownerIndex: Map<string, Player> = new Map<string, Player>();
    private static initialized: boolean = false;
    public static initialize(spawnerTypeId: string): void {
        if (!SpawnManager.initialized) {
            world.afterEvents.entitySpawn.subscribe((event: EntitySpawnAfterEvent)=>{
                if (event.entity.typeId === spawnerTypeId) SpawnManager.processSpawn(event.entity);
            });
            SpawnManager.initialized = true;
        } else {
            console.warn('ERROR: Instance of SpawnManager already in use.')
        }
    }

    public static getOwnerFromIndex(indexAdress: string): Player | undefined{
        return SpawnManager.ownerIndex.get(indexAdress);
    }

    public static deleteOwnerFromIndex(indexAdress: string): void {
        SpawnManager.ownerIndex.delete(indexAdress);
    }

    private static processSpawn(spawner: Entity) {
        SpawnManager.setOwner(spawner)
    }

    private static setOwner(spawner: Entity) {
        const playerFilter: EntityQueryOptions = {location: spawner.location,maxDistance: 8,minDistance: 0,closest: 1};
        const nearestPlayer: Player | undefined = spawner.dimension.getPlayers(playerFilter)[0];
        const projectileComponent= spawner.getComponent(EntityProjectileComponent.componentId) as EntityProjectileComponent | undefined;
        const location: Vector3 = Vector3.floor(spawner.location);
        if (projectileComponent && nearestPlayer.isValid()) {
            projectileComponent.owner = nearestPlayer;
            SpawnManager.ownerIndex.set(SpawnManager.generateAdress(location, spawner.dimension),nearestPlayer);
        } else SpawnManager.onErrorRemove(spawner, location);
    }

    public static generateAdress(location: Vector3, dimension: Dimension): string {
        const pos: Vector3 = location;
        return `${pos.x}_${pos.y}_${pos.z}_${dimension.id}`
    }

    public static onErrorRemove(spawner: Entity, location: Vector3): void {
        world.sendMessage(`${lang.spawnError} @(x:${location.x} y:${location.y} z:${location.z})`);
        spawner.remove();
    }

}