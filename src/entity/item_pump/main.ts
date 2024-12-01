import { Block, Dimension, Entity, ItemStack, Player, ScoreboardObjective, world } from "@minecraft/server";
import { entitySpawnerTypeId, lang, propertyId } from "../../global";
import { Vector3 } from "../../_import/spec/_module/util/vector";
import { SpawnManager } from "../../util/spawn_manager";
import { ItemPumpInterface } from "./interface";
import { OnEntityRemovedEvent } from "../../_import/spec/_module/singleton/entity_manager";
import { CommonOperations } from "../../util/common_operations";
import { SDB } from "../../_import/spec/_module/util/db";
import { ItemOperations } from "../../_import/spec/_module/util/item";
import { Inventory } from "../../_import/spec/_module/util/inventory";

export class ItemPump {

    public static onBlockPlaced(player: Player, block: Block): void {
        const entity: Entity = block.dimension.spawnEntity(entitySpawnerTypeId, new Vector3(block.location.x + 0.5, block.location.y, block.location.z + 0.5));
        entity.triggerEvent('type_item_pump');
        block.setPermutation(block.permutation.withState('vxl:placed', true));
    }

    public static onEntityRemoved(event: OnEntityRemovedEvent){
        const ownerId = event.dynamicPropertyMap.get(propertyId.owner) as string | undefined;
        if (ownerId) {
            const autoMiners: Entity[] = CommonOperations.getOwnedEntities(ownerId,'auto_miner');
            for (const autoMiner of autoMiners) {
                const routePath = autoMiner.getDynamicProperty(propertyId.routePathId) as string | undefined;
                if (routePath && routePath === event.entity.id) {
                    autoMiner.setDynamicProperty(propertyId.routePathId, undefined);
                    console.warn('cleared route path');
                }
            }
        }
    }

    public static onEntitySpawned(entity:Entity): void {
        const location: Vector3 = Vector3.floor(entity.location);
        const indexAdress: string = SpawnManager.generateAdress(location, entity.dimension);
        const owner: Player | undefined = SpawnManager.getOwnerFromIndex(indexAdress);
        if (owner) {
            entity.setDynamicProperty(propertyId.owner, owner.id);
            entity.nameTag = `${owner.nameTag}${lang.plural} ${lang.itemPump}`
        }
    }

    public static onInteract(entity: Entity, player: Player): void{
        player.playSound('vxl_auto.upgrade');
        ItemPumpInterface.pageHome(player, entity);
    }

    public static forEntity(entity: Entity): void {
        const isPowered = entity.getProperty(propertyId.powered) as boolean;
        if (!isPowered) return;
        const ownerId = entity.getDynamicProperty(propertyId.owner) as string | undefined;
        if (ownerId) {
            const connectedAutoMiners: Entity[] = ItemPump.getConnectedAutoMiners(entity, ownerId);
            const isPowered: boolean = entity.getProperty(propertyId.powered) as boolean || false;
            if (connectedAutoMiners.length === 0) {
                if (isPowered) entity.setProperty(propertyId.powered, false);
            } else {
                if (!isPowered) entity.setProperty(propertyId.powered, true);
                for (const autoMiner of connectedAutoMiners) {
                    try {
                        const itemsToSpawn: ItemStack[] = ItemPump.getItemsToSpawn(autoMiner.id, autoMiner.dimension);
                        ItemPump.spawnItems(itemsToSpawn, entity.dimension, entity.location);
                    } catch (error) {
                        console.warn(error)
                    }
                }
            }
            
        }
    }

    private static getConnectedAutoMiners(entity: Entity, ownerId: string): Entity[] {
        const connectedAutoMiners: Entity[] = [];
        const autoMiners: Entity[] = CommonOperations.getOwnedEntities(ownerId, 'auto_miner');
        for (const autoMiner of autoMiners) {
            const routePath = autoMiner.getDynamicProperty(propertyId.routePathId) as string | undefined;
            if (routePath && routePath === entity.id) {
                connectedAutoMiners.push(autoMiner);
            }
        }
        return connectedAutoMiners;
    }

    private static getItemsToSpawn(autoMinerId: string, dimension: Dimension): ItemStack[] {
        const db: ScoreboardObjective | undefined = SDB.getDb(`vxl_auto:inventory.${autoMinerId}`);
        const itemsToSpawn: ItemStack[] = [];
        if (db) {
            for (const i of db.getParticipants()) {
                let amount: number = db.getScore(i) || 1;
                while (amount > 0) {
                    const stackAmount = Math.min(amount, 16);
                    itemsToSpawn.push(new ItemStack(i.displayName, stackAmount));
                    amount -= stackAmount;
                }
                db.removeParticipant(i);  
            }
        }
        return itemsToSpawn;
    }

    private static spawnItems(itemsToSpawn: ItemStack[], dimension: Dimension, location: Vector3): void {
        for (const itemStack of itemsToSpawn) {
            ItemOperations.spawn(itemStack, dimension, location);
        }
    }
}