import { BlockComponentPlayerInteractEvent, BlockCustomComponent, Entity, EntityDieAfterEvent, EntitySpawnAfterEvent,ItemStack,PlayerPlaceBlockAfterEvent, system, world } from "@minecraft/server";
import { itemPumpTypeId} from "../global";
import { ForEntity, ForEntityEvent, OnEntityRemoved, OnEntityRemovedEvent } from "../_import/spec/_module/singleton/entity_manager";
import { ItemPump } from "../entity/item_pump/main";

class InteractWithItemPumpComponent implements BlockCustomComponent {
    constructor() {
        this.onPlayerInteract = this.onPlayerInteract.bind(this);
    }

    onPlayerInteract(event: BlockComponentPlayerInteractEvent): void {
        const entity: Entity | undefined = event.dimension.getEntities({
            location: event.block.location,
            type: itemPumpTypeId,
            closest: 1
        })[0]
        
        if (entity && event.player) {
            ItemPump.onInteract(entity, event.player);
        }
    }
}

export class ItemPumpManager {
    private static initialized: boolean = false;
    public static initialize(): void {
        if (!ItemPumpManager.initialized) {
            world.beforeEvents.worldInitialize.subscribe(initEvent => {
                initEvent.blockComponentRegistry.registerCustomComponent('vxl:interact_with_pump', new InteractWithItemPumpComponent());
            });
            world.afterEvents.playerPlaceBlock.subscribe((event:PlayerPlaceBlockAfterEvent) =>{
                if (event.block.typeId === itemPumpTypeId) {
                    ItemPump.onBlockPlaced(event.player, event.block);
                }
            })
            world.afterEvents.entitySpawn.subscribe((event:EntitySpawnAfterEvent)=>{
                if (event.entity.typeId === itemPumpTypeId) ItemPump.onEntitySpawned(event.entity);
            })
            world.afterEvents.entityDie.subscribe((event:EntityDieAfterEvent)=>{
                const run: number = system.run(()=>{
                    if (event.deadEntity.typeId === itemPumpTypeId) {
                        event.deadEntity.runCommand('setblock ~ ~ ~ air destroy');
                    }
                system.clearRun(run);
                })
            })
            ForEntity.subscribe((event: ForEntityEvent) =>{ItemPump.forEntity(event.entity)}, {typeId: itemPumpTypeId});
            OnEntityRemoved.subscribe((event: OnEntityRemovedEvent)=>{
                if (event.entity.typeId === itemPumpTypeId) {
                    ItemPump.onEntityRemoved(event)
                }
            })
            ItemPumpManager.initialized = true;
        } else {
            console.warn('ERROR: AutoMiner already initialized.')
        }
    }
}