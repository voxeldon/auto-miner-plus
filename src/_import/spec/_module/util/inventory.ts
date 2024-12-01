import { Container, Entity, EntityComponentTypes, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, GameMode, ItemStack, Player } from "@minecraft/server";

export class Inventory {
    /**
     * Retrieves the equipment from the specified source and equipment slot.
     * 
     * @param source - The player or entity from which to retrieve the equipment.
     * @param equipmentSlot? - The equipment slot from which to retrieve the equipment. Defaults to EquipmentSlot.Mainhand.
     * @returns The equipment item in the specified slot, or undefined if no equipment is found.
     */
    public static getEquipment(source: Player | Entity, equipmentSlot: EquipmentSlot = EquipmentSlot.Mainhand): ItemStack | undefined {
        const equipment: EntityEquippableComponent = source.getComponent('equippable') as EntityEquippableComponent;
        return equipment.getEquipment(equipmentSlot);
        
    }

    /**
     * Checks if the specified source has equipment of the given type in the specified equipment slot.
     * 
     * @param source - The player or entity to check for equipment.
     * @param typeId - The ID of the equipment type to check for.
     * @param equipmentSlot? - The equipment slot to check. Defaults to EquipmentSlot.Mainhand.
     * @returns Returns true if the source has equipment of the given type in the specified equipment slot, otherwise returns false.
     */
    public static hasEquipment(source: Player | Entity,typeId: string, equipmentSlot: EquipmentSlot = EquipmentSlot.Mainhand): boolean {
        const equipment: ItemStack | undefined = Inventory.getEquipment(source, equipmentSlot);
        if (equipment?.typeId === typeId) return true;
        else return false;
        
    }

    /**
     * Sets the equipment for a player.
     * 
     * @param player - The player for whom to set the equipment.
     * @param itemStack - The item stack to set as equipment.
     * @param equipmentSlot? - The equipment slot to set the item stack in. Defaults to EquipmentSlot.Mainhand.
     * @returns A boolean indicating whether the equipment was successfully set.
     */
    public static setEquipment(source: Player | Entity, itemStack: ItemStack, equipmentSlot: EquipmentSlot = EquipmentSlot.Mainhand): boolean {
        const equipment: EntityEquippableComponent = source.getComponent('equippable') as EntityEquippableComponent;
        if (equipment && itemStack.amount > 0) return equipment.setEquipment(equipmentSlot, itemStack);
        return false;
        
    }

    /**
     * Reduces the amount of an item in the player's or entity's inventory.
     * 
     * @param source - The player or entity whose inventory will be modified.
     * @param itemStack - The item stack to be reduced.
     * @param equipmentSlot? - The equipment slot to modify. Defaults to EquipmentSlot.Mainhand.
     * @returns A boolean indicating whether the item was successfully reduced.
     */
    public static reduceItem(source: Player | Entity, itemStack: ItemStack, equipmentSlot: EquipmentSlot = EquipmentSlot.Mainhand): boolean {
        const equipment: EntityEquippableComponent = source.getComponent('equippable') as EntityEquippableComponent;
        if (itemStack.amount <= 1) itemStack = new ItemStack('minecraft:air');
        else itemStack.amount -= 1;
        if (equipment) return equipment.setEquipment(equipmentSlot, itemStack);
        return false; 
    }
    
    /**
     * Retrieves the inventory of a player or entity.
     * 
     * @param source The player or entity to retrieve the inventory from.
     * @returns The inventory component of the player or entity, or undefined if not found.
     */
    public static getInventory(source: Player | Entity): EntityInventoryComponent | undefined {
        return source.getComponent(EntityComponentTypes.Inventory) as EntityInventoryComponent | undefined;
    }

    /**
     * Retrieves the container associated with the given source.
     * 
     * @param source - The player or entity for which to retrieve the container.
     * @returns The container associated with the source, or undefined if no container is found.
     */
    public static getContainer(source: Player | Entity): Container | undefined {
        const inventory: EntityInventoryComponent | undefined = Inventory.getInventory(source);
        return inventory?.container;
    }

    /**
     * Checks if the specified item is present in the inventory of the given source.
     * 
     * @param source - The player or entity whose inventory will be checked.
     * @param itemStack - The item stack or item ID to search for in the inventory.
     * @returns `true` if the item is found in the inventory, `false` otherwise.
     */
    public static hasItemInInventory(source: Player | Entity, itemStack: ItemStack | string): boolean {
        const itemStackId: string = Inventory.ensureStringFromStack(itemStack);
        const container: Container | undefined = Inventory.getContainer(source);
        if (!container) return false;
        return Array.from({ length: container.size }, (_, i) => container.getItem(i))
                    .some(item => item && item.typeId === itemStackId);
    }

    /**
     * Checks if a player has a specific item in their hotbar.
     * 
     * @param player - The player to check.
     * @param itemStack - The item stack or item ID to search for.
     * @returns `true` if the player has the item in their hotbar, `false` otherwise.
     */
    public static hasItemInHotbar(player: Player, itemStack: ItemStack | string): boolean {
        const itemStackId: string = Inventory.ensureStringFromStack(itemStack);
        const container: Container | undefined = Inventory.getContainer(player);
        if (!container) return false;
        return Array.from({ length: 9 }, (_, i) => container.getItem(i))
                    .some(item => item && item.typeId === itemStackId);
    }

    //Private Helpers
    private static ensureStringFromStack(itemStack: ItemStack | string){
        let itemStackId: string = '';
        if (typeof itemStack === "string") itemStackId = itemStack;
        else {itemStack as ItemStack; itemStackId = itemStack.typeId}
        return itemStackId;
    }
}