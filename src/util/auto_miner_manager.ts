import { EntityHitEntityAfterEvent, EntitySpawnAfterEvent, Player, PlayerInteractWithEntityAfterEvent, world } from "@minecraft/server";
import { autoMinerTypeId } from "../global";
import { ForEntity, ForEntityEvent, OnEntityRemoved, OnEntityRemovedEvent } from "../_import/spec/_module/singleton/entity_manager";
import { AutoMiner } from "../entity/auto_miner/main";
export class AutoMinerManager {
    private static initialized: boolean = false;
    public static initialize(): void {
        if (AutoMinerManager.initialized === false) {
            ForEntity.subscribe((event: ForEntityEvent) =>{AutoMiner.forEntity(event.entity)}, {typeId: 'vxl_auto:auto_miner'});
            world.afterEvents.playerInteractWithEntity.subscribe((event: PlayerInteractWithEntityAfterEvent)=>{
                if (event.target.typeId === autoMinerTypeId) {
                    AutoMiner.onInteract(event)
                }
            })
            world.afterEvents.entitySpawn.subscribe((event: EntitySpawnAfterEvent)=>{
                if (event.entity.typeId === autoMinerTypeId) {
                    try {
                        AutoMiner.onEntitySpawned(event.entity);
                    } catch (error) {
                        console.warn(error)
                    }
                }
            })
            world.afterEvents.entityHitEntity.subscribe((event: EntityHitEntityAfterEvent)=>{
                if (
                    event.damagingEntity.typeId === 'minecraft:player' &&
                    event.hitEntity.typeId === autoMinerTypeId
                ) {
                    AutoMiner.onHit(event.hitEntity, event.damagingEntity as Player);
                }
            })

            OnEntityRemoved.subscribe((event: OnEntityRemovedEvent)=>{
                if (event.entity.typeId === autoMinerTypeId) {
                    AutoMiner.onEntityRemoved(event)
                }
            })
            
            AutoMinerManager.initialized = true;
            return;
        } else {
            console.warn('ERROR: AutoMiner already initialized.')
        }
    }
}