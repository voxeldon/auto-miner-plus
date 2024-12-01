import { Block, BlockComponentTypes, BlockInventoryComponent, BlockPermutation, Container, ContainerSlot, Dimension, ItemStack } from "@minecraft/server";
import { Vector3 } from "./vector";

/**
 * Represents the neighbors of a block in six directions: up, down, north, south, east, and west.
 */
type BlockNeighbors = {
    up:   Block | undefined,
    down: Block | undefined,
    north:Block | undefined,
    south:Block | undefined,
    east: Block | undefined,
    west: Block | undefined
}

/**
 * Represents an index for an item stack container.
 */
type ItemStackContainerIndex = {
    position: number,
    itemStack: ItemStack
};

class BlockOperations {
    /**
     * A map that represents the possible directions and their corresponding opposite directions.
     */
    public static direction_map: Record<string, Record<string, string>> = {
        north: { north: 'north', south: 'south', east: 'east', west: 'west' },
        south: { north: 'south', south: 'north', east: 'west', west: 'east' },
        east: { north: 'west', south: 'east', east: 'north', west: 'south' },
        west: { north: 'east', south: 'west', east: 'south', west: 'north' },
    };

    // ---------- DATA OPERATIONS ----------

    /**
     * Generates a block address based on the block's location and dimension.
     * @param block - The block for which to generate the address.
     * @returns The generated block address.
     */
    public static generateBlockAddress(block: Block): string {
        const pos: Vector3 = block.location;
        const dimension: string = block.dimension.id;
        return `${pos.x}_${pos.y}_${pos.z}_${dimension}`
    }

    /**
     * Retrieves the neighboring blocks of the given block based on its facing direction else north.
     * 
     * @param block - The block for which to retrieve the neighbors.
     * @returns An object containing the neighboring blocks in different directions.
     */
    public static getNeighbors(block: Block): BlockNeighbors {
        const permutation: BlockPermutation = block.permutation;
        let facing_direction: string | undefined = permutation.getState('minecraft:cardinal_direction')?.toString().toLowerCase();
        if (!facing_direction) facing_direction = 'north';
        const direction_map = BlockOperations.direction_map[facing_direction];

        return {
            up: block.above(),
            down: block.below(),
            north: BlockOperations.getBlockInDirection(block, direction_map.north),
            south: BlockOperations.getBlockInDirection(block, direction_map.south),
            east: BlockOperations.getBlockInDirection(block, direction_map.east),
            west: BlockOperations.getBlockInDirection(block, direction_map.west),
        };
    }

    /**
     * Retrieves the block in the specified direction relative to the given direction.
     */
    private static getBlockInDirection(block: Block, direction: string): Block | undefined {
        switch (direction) {
            case 'north': return block.north();
            case 'south': return block.south();
            case 'east': return block.east();
            case 'west': return block.west();
            default: throw new Error(`Unknown direction: ${direction}`);
        }
    }

    // ---------- INVENTORY OPERATIONS ----------

    /**
     * Retrieves the block container associated with the given block.
     * @param block The block for which to retrieve the container.
     * @returns The block container if found, otherwise undefined.
     */
    public static getBlockContainer(block: Block): Container | undefined {
        const inventory: BlockInventoryComponent | undefined = block.getComponent(BlockComponentTypes.Inventory);
        return inventory?.container;
    }

    /**
     * Retrieves the container slots from a given container.
     * 
     * @param container - The container to retrieve slots from.
     * @param container_size - The size of the container.
     * @returns An array of ContainerSlot objects representing the slots in the container.
     */
    public static getContainerSlot(container: Container, container_size: number): ContainerSlot[] {
        const slots: ContainerSlot[] = [];
        if (container) {
            for (let i = 0; i < container_size; i++) {
                const slot: ContainerSlot = container.getSlot(i);
                slots.push(slot);
            }
        }
        return slots;
    }

    /**
     * Retrieves the items from the given container slots and returns an array of ItemStackContainerIndex.
     * @param slots - The container slots to retrieve items from.
     * @returns An array of ItemStackContainerIndex containing the position and itemStack of each item in the slots.
     */
    public static getItemsFromContainerSlot(slots: ContainerSlot[]): ItemStackContainerIndex[] {
        const item_stack_index: ItemStackContainerIndex[] = [];
        let slot_index: number = 0
        for (const slot of slots) {
            const item_stack = slot.getItem() as ItemStack;
            if (slot.hasItem()) {
                const index_entry: ItemStackContainerIndex = {
                    position: slot_index,
                    itemStack: item_stack
                }
                item_stack_index.push(index_entry)
            }
            slot_index += 1;
        }
        return item_stack_index;
    }
}

export {BlockNeighbors, BlockOperations, ItemStackContainerIndex}