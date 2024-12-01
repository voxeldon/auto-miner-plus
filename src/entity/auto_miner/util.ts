import { Dimension, Entity } from "@minecraft/server";
import { MinecraftBlockTypes } from "../../_import/vanilla_data/_module/mojang-block";
import { Vector3 } from "../../_import/spec/_module/util/vector";
import { propertyId } from "../../global";

export class AutoMinerUtil {
    public static generateAdress(location: Vector3, dimension: Dimension): string {
        const pos: Vector3 = location;
        return `${pos.x}_${pos.y}_${pos.z}_${dimension.id}`
    }

    public static getUpgradeFromIndex(entity: Entity): string {
        const upgradeLevel = entity.getProperty(propertyId.upgradeLevel) as number;
        let upgradeLevelString: string = '';
        switch (upgradeLevel) {
            case 0 : upgradeLevelString =  MinecraftBlockTypes.IronBlock;       break;
            case 1 : upgradeLevelString =  MinecraftBlockTypes.CopperBlock;     break;
            case 2 : upgradeLevelString =  MinecraftBlockTypes.GoldBlock;       break;
            case 3 : upgradeLevelString =  MinecraftBlockTypes.DiamondBlock;    break;
            case 4 : upgradeLevelString =  MinecraftBlockTypes.NetheriteBlock;  break;
        }
        return upgradeLevelString;
    }

    public static getColorFromIndex(entity: Entity): string {
        const color = entity.getProperty(propertyId.color) as number;
        let colorString: string = '';
        switch (color) {
            case 1 : colorString = 'black';       break;
            case 2 : colorString = 'blue';        break;
            case 3 : colorString = 'brown';       break;
            case 4 : colorString = 'cyan';        break;
            case 5 : colorString = 'green';       break;
            case 6 : colorString = 'light_blue';  break;
            case 7 : colorString = 'lime';        break;
            case 8 : colorString = 'magenta';     break;  
            case 9 : colorString = 'orange';      break;
            case 10: colorString = 'pink';        break;
            case 11: colorString = 'purple';      break;
            case 12: colorString = 'red';         break;
            case 13: colorString = 'yellow';      break;
            case 14: colorString = 'rainbow';     break;
            default: colorString = 'default';     break;
        }
        return colorString;
    }

    public static getSpeedModifiers(entity: Entity): number {
        const upgradeLevel = entity.getProperty(propertyId.upgradeLevel) as number;
        let modifiedMovementSpeed: number = 0;
        switch (upgradeLevel) {
            case 0: modifiedMovementSpeed = 1  ; break;
            case 1: modifiedMovementSpeed = 1.5; break;
            case 2: modifiedMovementSpeed = 2  ; break;
            case 3: modifiedMovementSpeed = 2.5; break;
            case 4: modifiedMovementSpeed = 3  ; break;
            case 5: modifiedMovementSpeed = 3.5; break;
        } return modifiedMovementSpeed;
    }
}