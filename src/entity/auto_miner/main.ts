import { Block, BlockRaycastHit, Entity,  ItemStack, Player, PlayerInteractWithEntityAfterEvent, ScoreboardObjective, system, world } from "@minecraft/server";
import { MinecraftBlockTypes } from "../../_import/vanilla_data/_module/mojang-block";
import {  lang, propertyId } from "../../global";
import { Vector3 } from "../../_import/spec/_module/util/vector";
import { AutoMinerUtil } from "./util";
import { AutoMinerInteracts } from "./interaction";
import { MinecraftItemTypes } from "../../_import/vanilla_data/_module/mojang-item";
import { ItemEntity, ItemOperations } from "../../_import/spec/_module/util/item";
import { AutoMinerNavigation } from "./navigation";
import { AutoMinerActions } from "./actions";
import { AutoMinerInterface } from "./interface";
import { SpawnManager } from "../../util/spawn_manager";
import { SDB } from "../../_import/spec/_module/util/db";
import { OnEntityRemovedEvent } from "../../_import/spec/_module/singleton/entity_manager";
import { PilotCamera } from "../../util/camera";


export const upgradeBlocks: string[] = [
    MinecraftBlockTypes.IronBlock,
    MinecraftBlockTypes.CopperBlock,
    MinecraftBlockTypes.GoldBlock,
    MinecraftBlockTypes.DiamondBlock,
    MinecraftBlockTypes.NetheriteBlock
]

export class AutoMiner {
    //#Methods
    public static onEntitySpawned(entity: Entity): void {
        const location: Vector3 = Vector3.floor(entity.location);
        const indexAdress: string = AutoMinerUtil.generateAdress(location, entity.dimension);
        const owner: Player | undefined = SpawnManager.getOwnerFromIndex(indexAdress);
        entity.setDynamicProperty(propertyId.canBuildBridge, false);
        if (owner) {
            entity.setDynamicProperty(propertyId.owner, owner.id);
            const db = SDB.getDbElseNew(`vxl_auto:player.${owner.id}`);
            if (!db) {
                AutoMiner.onErrorRemove(entity, location);
                return;
            }
            SDB.setKey(db, `auto_miner.${entity.id}`);
            entity.nameTag = AutoMiner.getEntityName(owner, db);
            AutoMinerNavigation.snapEntityToGrid(entity);
            AutoMinerInterface.reName(entity, owner);
        }  else {
            AutoMiner.onErrorRemove(entity, location);
        }
        SpawnManager.deleteOwnerFromIndex(indexAdress);
    }

    private static getEntityName(owner: Player, db: ScoreboardObjective): string {
        const i = db.getParticipants().length;
        let x = '';
        if (i > 1) x = i.toString()
        return `${owner.nameTag}'s Auto-Miner ${x}`;
    }

    public static onEntityRemoved(event: OnEntityRemovedEvent): void {
        const itemDb: ScoreboardObjective | undefined = SDB.getDb(`vxl_auto:inventory.${event.entity.id}`);
        if (itemDb) SDB.removeDb(itemDb);
        const ownerId = event.dynamicPropertyMap.get(propertyId.owner) as string | undefined;
            if (ownerId) {
                const owner = world.getEntity(ownerId) as Player;
                if (owner) {
                    if (owner.getDynamicProperty(propertyId.cameraPathId) !== undefined) {
                        PilotCamera.onCameraExit(owner);
                    }
                    const db: ScoreboardObjective | undefined = SDB.getDbElseNew(`vxl_auto:player.${owner.id}`);
                    if (db) SDB.removeKey(db, `auto_miner.${event.entity.id}`);
                }
            }
    }

    public static forEntity(entity: Entity): void {
        const isPowered = entity.getProperty(propertyId.powered) as boolean;
        if (isPowered) {
            try {
                const canBuildBridge = entity.getDynamicProperty(propertyId.canBuildBridge) as boolean;
                let direction = entity.getProperty(propertyId.direction) as string;
                if (!direction) direction === 'north';
                const nearestBlockHit: BlockRaycastHit | undefined = entity.getBlockFromViewDirection({maxDistance: 1});
                const nearestBlock: Block | undefined = nearestBlockHit?.block;
                if (canBuildBridge) AutoMinerActions.buildBridge(entity, direction);
                AutoMinerNavigation.moveEntity(entity, nearestBlock);
                if (nearestBlockHit && nearestBlock) AutoMinerActions.breakBlocks(entity,direction);
                if (AutoMiner.canpickupItems(entity)) {
                    const itemStacks: ItemStack[] = ItemEntity.collectItems(entity);
                    AutoMiner.processPickedUpItems(entity, itemStacks)
                }
            } catch (error) {
                //out of bounds
            }

        }
    }

    public static onInteract(event: PlayerInteractWithEntityAfterEvent): void {
        const entity: Entity = event.target;
        const player: Player = event.player;
        const itemStack: ItemStack | undefined = event.itemStack;
        entity.playAnimation('animation.miner.interact')
        if (event.itemStack && event.itemStack.typeId.includes('dye')) { // Change Color Pallet
            AutoMinerInteracts.changeColorPallet(entity, event.itemStack, player);
        }
        else if (itemStack && upgradeBlocks.includes(itemStack.typeId)){ // Change Upgrade State
            AutoMinerInteracts.changeUpgradeState(entity, itemStack, player);
        }
        else if (itemStack && itemStack.typeId === MinecraftItemTypes.Hopper){ 
            AutoMinerInteracts.onHopperEquip(entity, player, itemStack);
        }
        else if (itemStack && itemStack.typeId === MinecraftItemTypes.Stick){
            AutoMinerInterface.pageHome(player);
        }
        else if (player.isSneaking) { // Change Direction
            AutoMinerInteracts.changeDirection(entity);
        }
        else { // Toggle Power
            AutoMinerInteracts.togglePower(entity);
        }
    }

    public static onHit(entity: Entity, player: Player) {
        const ownerId: string | undefined = AutoMiner.getOwnerId(entity);
        if (player.id === ownerId) {
            if (player.isSneaking) AutoMiner.removeEntity(entity);
        } else {
            player.sendMessage(lang.notOwner)
        }
    }

    public static recallEntity(entity: Entity, player: Player) {
        entity.setProperty(propertyId.powered, false);
        entity.teleport(new Vector3(player.location.x,player.location.y + 1,player.location.z));
        const awaitRemoval: number = system.runTimeout(()=>{
            AutoMiner.removeEntity(entity);
            system.clearRun(awaitRemoval);
        }, 10);
    }

    //&Private Methods

    private static removeEntity(entity: Entity) {
        const color: string = AutoMinerUtil.getColorFromIndex(entity);
        const upgradeBlockTypeId: string = AutoMinerUtil.getUpgradeFromIndex(entity);
        const placer: ItemStack = ItemOperations.new(`vxl_auto:auto_miner_placer_${color}`);
        ItemOperations.spawn(placer, entity.dimension, entity.location);
        if (upgradeBlockTypeId !== MinecraftBlockTypes.IronBlock) {
            const upgradeBlock: ItemStack = ItemOperations.new(upgradeBlockTypeId);
            ItemOperations.spawn(upgradeBlock, entity.dimension, entity.location);
        }
        const canPickUpItems = entity.getProperty(propertyId.pickupItems) as boolean
        if (canPickUpItems) {
            const hopper: ItemStack = ItemOperations.new(MinecraftItemTypes.Hopper);
            ItemOperations.spawn(hopper, entity.dimension, entity.location);
        }
        entity.remove();
    }

    private static processPickedUpItems(entity: Entity, itemStacks: ItemStack[]){
        const db = SDB.getDbElseNew(`vxl_auto:inventory.${entity.id}`);
        if (db) {
            for (const itemStack of itemStacks) {
                SDB.addToKey(db, itemStack.typeId, itemStack.amount);
            }
        }
    }

    private static getOwnerId(entity: Entity): string | undefined {
        return entity.getDynamicProperty(propertyId.owner) as string | undefined
    }

    private static getOwner(entity: Entity): Player | undefined {
        const ownerId: string | undefined = AutoMiner.getOwnerId(entity);
        if (ownerId) return world.getEntity(ownerId) as Player | undefined
    }

    private static canpickupItems(entity: Entity): boolean{
        let arg = entity.getProperty(propertyId.pickupItems) as boolean;
        return arg;
    }

    private static onErrorRemove(entity: Entity, location: Vector3): void {
        world.sendMessage(`${lang.spawnError} @(x:${location.x} y:${location.y} z:${location.z})`);
        entity.remove();
    }
}