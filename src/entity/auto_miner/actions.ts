import { Block, BlockPermutation, Dimension, Entity } from "@minecraft/server";
import { MinecraftBlockTypes } from "../../_import/vanilla_data/_module/mojang-block";
import { Vector3 } from "../../_import/spec/_module/util/vector";

export class AutoMinerActions {
    private static breakBlock(block: Block): void {
        if (
            block.typeId !== MinecraftBlockTypes.Bedrock && 
            block.typeId !== MinecraftBlockTypes.Barrier &&
            block.typeId !== MinecraftBlockTypes.StructureVoid
        ) {
            block.dimension.runCommand(`setblock ${block.x} ${block.y} ${block.z} air destroy`);
        }
    }

    private static getBlockVolume(location: Vector3, direction: string, dimension: Dimension): Block[] {
        const startPos = Vector3.add(
            Vector3.add(
                location, 
                AutoMinerActions.directionVector(direction)
            ),
            AutoMinerActions.startVector(direction)
        );
        const endPos = Vector3.add(
            Vector3.add(
                location, 
                AutoMinerActions.directionVector(direction)
            ),
            AutoMinerActions.endVector(direction)
        );
        const blocks: Block[] = [];
    
        const minX = Math.min(startPos.x, endPos.x);
        const maxX = Math.max(startPos.x, endPos.x);
        const minY = Math.min(startPos.y, endPos.y);
        const maxY = Math.max(startPos.y, endPos.y);
        const minZ = Math.min(startPos.z, endPos.z);
        const maxZ = Math.max(startPos.z, endPos.z);
    
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const pos = new Vector3(x, y, z);
                    const block = dimension.getBlock(pos);
                    if (block) blocks.push(block);
                }
            }
        }
    
        return blocks;
    }

    public static breakBlocks(entity:Entity, direction: string){
        const blockAtLocation: Block | undefined = entity.dimension.getBlock(entity.location);
        if (blockAtLocation && !blockAtLocation.isAir && !blockAtLocation.isLiquid) {
            AutoMinerActions.breakBlock(blockAtLocation);
        }
        const blocks = AutoMinerActions.getBlockVolume(entity.location, direction, entity.dimension);
        for (const block of blocks) {
            AutoMinerActions.breakBlock(block);
        } 
    }

    private static directionVector(direction: string): Vector3 {
        switch (direction) {
            case 'north': return new Vector3(0,0,1);
            case 'south': return new Vector3(0,0,-1);
            case 'east' : return new Vector3(1,0,0);
            case 'west' : return new Vector3(-1,0,0);
            default: return Vector3.ZERO;
        }
    }
    private static startVector(direction: string): Vector3 {
        switch (direction) {
            case 'north': return new Vector3(1,0,0);
            case 'south': return new Vector3(-1,0,0);
            case 'east' : return new Vector3(0,0,-1);
            case 'west' : return new Vector3(0,0,1);
            default: return Vector3.ZERO;
        }
    }
    private static endVector(direction: string): Vector3 {
        switch (direction) {
            case 'north': return new Vector3(-1,2,0);
            case 'south': return new Vector3(1,2,0);
            case 'east' : return new Vector3(0,2,1);
            case 'west' : return new Vector3(0,2,-1);
            default: return Vector3.ZERO;
        }
    }

    public static buildBridge(entity:Entity, direction: string) {
        let offset = this.directionVector(direction);
        offset = new Vector3(offset.x,offset.y-1,offset.z);
        const block = entity.dimension.getBlock(Vector3.add(entity.location, offset));
        if (!block || block?.isAir || block?.isLiquid) {
            const blockToPlace = BlockPermutation.resolve('minecraft:stone');
            block?.setPermutation(blockToPlace);
        }
    }
}