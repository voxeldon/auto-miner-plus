import { Entity, ItemStack, Player } from "@minecraft/server";
import { MinecraftItemTypes } from "../../_import/vanilla_data/_module/mojang-item";
import { MinecraftBlockTypes } from "../../_import/vanilla_data/_module/mojang-block";
import { AutoMinerUtil } from "./util";
import { ItemOperations } from "../../_import/spec/_module/util/item";
import { Vector3 } from "../../_import/spec/_module/util/vector";
import { lang, propertyId } from "../../global";
import { Inventory } from "../../_import/spec/_module/util/inventory";
import { AutoMinerNavigation } from "./navigation";

export class AutoMinerInteracts {

    public static togglePower(entity: Entity) {
        const isPowered = entity.getProperty(propertyId.powered) as boolean;
        entity.setProperty(propertyId.powered, !isPowered)
    }

    public static onHopperEquip(entity: Entity, player: Player, itemStack: ItemStack): void {
        const canpickupItems = entity.getProperty(propertyId.pickupItems) as boolean;
        if (!canpickupItems) {
            entity.setProperty(propertyId.pickupItems, true);
            Inventory.reduceItem(player, itemStack);
            player.onScreenDisplay.setActionBar(lang.upgradeEquipped);
            player.playSound('vxl_auto.upgrade');
        } else {
            player.onScreenDisplay.setActionBar(lang.alreadyEquipped);
            player.playSound('vxl_auto.error');
        }
    }

    public static changeDirection(entity: Entity): void {
        const direction = entity.getProperty(propertyId.direction) as string;
        let newDirection: string = '';
        switch (direction) {
            case 'north': newDirection = 'east' ; break;
            case 'east' : newDirection = 'south'; break;
            case 'south': newDirection = 'west' ; break;
            case 'west' : newDirection = 'north'; break;
        }
        entity.setProperty(propertyId.direction, newDirection);
        AutoMinerNavigation.snapEntityToGrid(entity);
    }

    public static changeDirectionCounterClockwise(entity: Entity): void {
        const direction = entity.getProperty(propertyId.direction) as string;
        let newDirection: string = '';
        switch (direction) {
            case 'north': newDirection = 'west' ; break;
            case 'west' : newDirection = 'south'; break;
            case 'south': newDirection = 'east' ; break;
            case 'east' : newDirection = 'north'; break;
        }
        entity.setProperty(propertyId.direction, newDirection);
        AutoMinerNavigation.snapEntityToGrid(entity);
    }

    public static changeColorPallet(entity: Entity, itemStack: ItemStack, player: Player): void {
        //player.onScreenDisplay.setActionBar(lang.alreadyEquipped);
        const colorIndexId = entity.getProperty(propertyId.color) as number ;
        let newColorIndexId: number = colorIndexId;
        if (colorIndexId >= 14) {
            player.onScreenDisplay.setActionBar(lang.cantDyeUniqueSkins)
            return;
        }
        switch (itemStack.typeId) {
            case MinecraftItemTypes.BlackDye     : newColorIndexId = 1;  break;
            case MinecraftItemTypes.BlueDye      : newColorIndexId = 2;  break;
            case MinecraftItemTypes.BrownDye     : newColorIndexId = 3;  break;
            case MinecraftItemTypes.CyanDye      : newColorIndexId = 4;  break;
            case MinecraftItemTypes.GreenDye     : newColorIndexId = 5;  break;
            case MinecraftItemTypes.LightBlueDye : newColorIndexId = 6;  break;
            case MinecraftItemTypes.LimeDye      : newColorIndexId = 7;  break;
            case MinecraftItemTypes.MagentaDye   : newColorIndexId = 8;  break;  
            case MinecraftItemTypes.OrangeDye    : newColorIndexId = 9;  break;
            case MinecraftItemTypes.PinkDye      : newColorIndexId = 10; break;
            case MinecraftItemTypes.PurpleDye    : newColorIndexId = 11; break;
            case MinecraftItemTypes.RedDye       : newColorIndexId = 12; break;
            case MinecraftItemTypes.YellowDye    : newColorIndexId = 13; break;
            default: newColorIndexId = 0; break;
        }
        if (colorIndexId === newColorIndexId) {
            player.onScreenDisplay.setActionBar(lang.alreadyThisColor)
            player.playSound('vxl_auto.error');
            return;
        }
        player.playSound('vxl_auto.interact');
        entity.setProperty(propertyId.color, newColorIndexId)
        Inventory.reduceItem(player, itemStack);
    }

    public static changeUpgradeState(entity:Entity, itemStack: ItemStack, player: Player): void {
        const currentUpgrade: string =  AutoMinerUtil.getUpgradeFromIndex(entity);
        if (currentUpgrade === itemStack.typeId) {
            player.playSound('vxl_auto.error');
            player.onScreenDisplay.setActionBar(lang.alreadyEquipped)
            return;
        }
        switch (itemStack.typeId) {
            case MinecraftBlockTypes.IronBlock     : entity.setProperty(propertyId.upgradeLevel, 0); break;
            case MinecraftBlockTypes.CopperBlock   : entity.setProperty(propertyId.upgradeLevel, 1); break;
            case MinecraftBlockTypes.GoldBlock     : entity.setProperty(propertyId.upgradeLevel, 2); break;
            case MinecraftBlockTypes.DiamondBlock  : entity.setProperty(propertyId.upgradeLevel, 3); break;
            case MinecraftBlockTypes.NetheriteBlock: entity.setProperty(propertyId.upgradeLevel, 4); break;
        };

        let returnItem: ItemStack = ItemOperations.new(MinecraftBlockTypes.IronBlock);
        switch (currentUpgrade) {
            case MinecraftBlockTypes.CopperBlock   : returnItem = ItemOperations.new(MinecraftBlockTypes.CopperBlock); break;
            case MinecraftBlockTypes.GoldBlock     : returnItem = ItemOperations.new(MinecraftBlockTypes.GoldBlock); break;
            case MinecraftBlockTypes.DiamondBlock  : returnItem = ItemOperations.new(MinecraftBlockTypes.DiamondBlock); break;
            case MinecraftBlockTypes.NetheriteBlock: returnItem = ItemOperations.new(MinecraftBlockTypes.NetheriteBlock); break;
        };
        player.playSound('vxl_auto.upgrade');
        Inventory.reduceItem(player, itemStack);
        ItemOperations.spawn(returnItem, entity.dimension, new Vector3(entity.location.x, entity.location.y + 1, entity.location.z));
    }
}