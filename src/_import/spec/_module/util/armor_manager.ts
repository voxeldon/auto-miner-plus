import { Entity, EntityEquippableComponent, EntityHitEntityAfterEvent, EquipmentSlot, ItemStack, Player, TicksPerSecond, world } from "@minecraft/server";
import { ForEachPlayer } from "../singleton/player_instance_manager";

export type WhileArmorEquippedEvent = {
    player: Player,
    armor_stack: ArmorStack
};

export type ArmorSetTypeIds = {
    'helmet': string,
    'chestplate': string,
    'leggings': string,
    'boots': string
};

export type ArmorSet = {
    'type_ids': ArmorSetTypeIds,
    'onHurt'?: Function,
    'while_wearing'?: Function,
    'on_equipped'?: Function,
    'on_unequipped'?: Function
};

export type ArmorStack = {
    'helmet'?: ItemStack,
    'chestplate'?: ItemStack,
    'leggings'?: ItemStack,
    'boots'?: ItemStack
};

type ArmorData = {
    set: ArmorSet,
    armor_stack: ArmorStack
};

class ArmorManager {
    private equipment: ArmorSet[];
    private valid_equipment: ArmorSet[];
    private playerArmorSets: Map<string, ArmorSet | undefined>;

    constructor(equipment: ArmorSet[]) {
        this.equipment = equipment;
        this.valid_equipment = [];
        this.playerArmorSets = new Map();
        this.onReady();
    }

    private onReady() {
        if (!this.verifyEquipment()) return;
        ForEachPlayer.subscribe((player: Player)=>this.forEachPlayer(player))
        world.afterEvents.entityHitEntity.subscribe(this.onHurt);
    }

    private onHurt = (event: EntityHitEntityAfterEvent) => {
        const hit_entity: Entity = event.hitEntity;
        if (hit_entity.typeId !== 'minecraft:player') return;
        const player: Player = hit_entity as Player;
        const armor_set: ArmorSet | undefined = this.matchEquipment(this.getEquipment(player))?.set;
        if (!armor_set) return;
        if (!armor_set.onHurt) return;
        armor_set.onHurt(event);
    }

    private verifyEquipment(): boolean {
        for (const set of this.equipment) {
            const { helmet, chestplate, leggings, boots } = set.type_ids;
            if (helmet && chestplate && leggings && boots) {
                this.valid_equipment.push(set);
            }
        }
        return this.valid_equipment.length > 0;
    }

    private forEachPlayer = (player: Player) => {
        const armor_data: ArmorData | undefined = this.matchEquipment(this.getEquipment(player));
        const armor_set: ArmorSet | undefined = armor_data?.set;
        const player_id = player.id;
        const current_set = this.playerArmorSets.get(player_id);

        if (current_set !== armor_set) {
            if (current_set?.on_unequipped) {
                current_set.on_unequipped(player);
            }

            if (armor_set?.on_equipped) {
                armor_set.on_equipped(player);
            }

            this.playerArmorSets.set(player_id, armor_set);
        }

        if (armor_set && armor_data?.armor_stack && armor_set.while_wearing) {
            const event_data: WhileArmorEquippedEvent = {
                player, armor_stack: armor_data.armor_stack
            };
            armor_set.while_wearing(event_data);
        }
    }

    private getEquipment(player: Player): ArmorStack {
        const equipment: EntityEquippableComponent = player.getComponent('equippable') as EntityEquippableComponent;
        const helmet: ItemStack | undefined = equipment.getEquipment(EquipmentSlot.Head);
        const chestplate: ItemStack | undefined = equipment.getEquipment(EquipmentSlot.Chest);
        const leggings: ItemStack | undefined = equipment.getEquipment(EquipmentSlot.Legs);
        const boots: ItemStack | undefined = equipment.getEquipment(EquipmentSlot.Feet);
        return {
            helmet,
            chestplate,
            leggings,
            boots
        };
    }

    private matchEquipment(armor_stack: ArmorStack): ArmorData | undefined {
        for (const set of this.valid_equipment) {
            if (this.isMatchingSet(set.type_ids, armor_stack)) {
                return { set, armor_stack };
            }
        }
        return undefined;
    }

    private isMatchingSet(type_ids: ArmorSetTypeIds, armor_stack: ArmorStack): boolean {
        return (
            type_ids.helmet === armor_stack.helmet?.typeId &&
            type_ids.chestplate === armor_stack.chestplate?.typeId &&
            type_ids.leggings === armor_stack.leggings?.typeId &&
            type_ids.boots === armor_stack.boots?.typeId
        );
    }
}

export { ArmorManager };
