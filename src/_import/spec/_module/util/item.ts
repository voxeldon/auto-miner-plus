import { Dimension, Entity, EntityComponentTypes, EntityItemComponent, EntityQueryOptions, ItemStack } from "@minecraft/server";
import { Vector3 } from "./vector";

class ItemOperations {
    /**
     * Creates a new ItemStack with the specified type ID and amount.
     * @param type_id - The type ID of the item.
     * @param amount - The amount of the item. Defaults to 1.
     * @returns The created ItemStack.
     */
    static new(type_id: string, amount: number = 1): ItemStack {
        return new ItemStack(type_id, amount);
    }

    /**
     * Spawns the specified item stack in the given dimension at the specified location.
     * @param itemStack - The item stack to spawn.
     * @param dimension - The dimension to spawn the item stack in.
     * @param location - The location to spawn the item stack at.
     * @returns A boolean indicating whether the item stack was successfully spawned.
     */
    static spawn(itemStack: ItemStack, dimension: Dimension, location: Vector3): boolean {
        try {
            dimension.spawnItem(itemStack, location);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Sets the lore of the specified item stack.
     * @param itemStack - The item stack to set the lore for.
     * @param lore_list - The list of lore strings.
     * @returns A boolean indicating whether the lore was successfully set.
     */
    static setLore(itemStack: ItemStack, lore_list: string[]): boolean {
        try {
            itemStack.setLore(lore_list);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Sets the name tag of the specified item stack.
     * @param itemStack - The item stack to set the name tag for.
     * @param name_tag - The name tag string.
     * @returns A boolean indicating whether the name tag was successfully set.
     */
    static setNameTag(itemStack: ItemStack, name_tag: string): boolean {
        try {
            itemStack.nameTag = name_tag;
            return true;
        } catch (error) {
            return false;
        }
    }
}

class ItemEntity {
    public static collectItems(entity: Entity, radius: number = 1, itemTypeIds?: string[]): ItemStack[] {
        const entitiesToRemove: Map<string, Entity> = new Map<string, Entity>();
        const itemStacks: ItemStack[] = [];
        ItemEntity.processesItemEntities(entity, entitiesToRemove, itemStacks, radius, itemTypeIds);

        for (const itemStack of itemStacks) {
            const entityToRemove: Entity | undefined = entitiesToRemove.get(itemStack.typeId);
            if (entityToRemove && entityToRemove.isValid()) entityToRemove.remove();
        }
        return itemStacks;
    }

    public static collectItem(entity: Entity, radius: number = 1, itemTypeIds?: string[]): ItemStack | undefined {  
        const entitiesToRemove: Map<string, Entity> = new Map<string, Entity>();
        const itemStacks: ItemStack[] = [];
        ItemEntity.processesItemEntities(entity, entitiesToRemove, itemStacks, radius, itemTypeIds);
        let itemStack: ItemStack | undefined = undefined;
        itemStack = itemStacks[Math.floor(Math.random() * itemStacks.length)];
        const entityToRemove: Entity | undefined = entitiesToRemove.get(itemStack?.typeId);
        if (entityToRemove) entityToRemove.remove();
        return itemStack;
    }

    private static processesItemEntities(entity: Entity, entitiesToRemove: Map<string, Entity>, itemStacks: ItemStack[], radius: number, itemTypeIds?: string[]){
        const dimension: Dimension = entity.dimension;
        const pos: Vector3 = entity.location;
        const filter: EntityQueryOptions = {
            type: 'minecraft:item',
            location: new Vector3(pos.x, pos.y + 1, pos.z),
            maxDistance: radius,
            minDistance: 0,

        };
        const item_entities: Entity[] = dimension.getEntities(filter);
        for (const entity of item_entities) {
            const itemComponent = entity.getComponent(EntityComponentTypes.Item) as EntityItemComponent;
            const itemStack: ItemStack = itemComponent.itemStack;
            const itemTypeId: string = itemStack.typeId;
            if (itemTypeIds && itemTypeIds.length > 0 && !itemTypeIds.includes(itemTypeId)) continue;
            entitiesToRemove.set(itemStack.typeId, entity);
            itemStacks.push(itemStack);
        }
    }

    public static respawnReducedItemStack(itemStack: ItemStack, dimension: Dimension, location: Vector3){
        if (itemStack.amount > 1) {
            itemStack.amount -= 1;
            dimension.spawnItem(itemStack, location);
        }
    }
}

export {ItemOperations, ItemEntity}
