import { Dimension, Entity, EntityDieAfterEvent, EntityDieAfterEventSignal, system, world } from "@minecraft/server";
import { ItemOperations } from "./item";
import { Vector3 } from "./vector";

type LootTableProperties = {
    nameTag: string,
    loreList: string[]
}

type LootTableEntry = {
    typeId: string,
    amount: number[],
    weight: number,
    properties?:LootTableProperties
}

type LootTable = {
    rolls: number,
    entityTypes: string[],
    entries: LootTableEntry[]
}

class LootTableManager {
    public runProcess: boolean = true;
    private systemProcess: number;
    private eventSignal: EntityDieAfterEventSignal = world.afterEvents.entityDie;
    private lootTables: LootTable[]
    
    constructor(lootTables: LootTable[]) {
        this.lootTables = lootTables;
        this.onReady();
        this.systemProcess = system.run(() => {
            if (!this.runProcess) system.clearRun(this.systemProcess);
            system.runInterval(() => this.process());
        });
    }

    private onReady(): void {
        this.eventSignal.subscribe((event: EntityDieAfterEvent) => this.onEntityKilled(event));
    }

    private process(): void {
        return;
    }

    private onEntityKilled(event: EntityDieAfterEvent): void {
        this.processTables(event.deadEntity);
    }

    private processTables(entity: Entity): void {
        for (const table of this.lootTables) {
            if (table.entityTypes.includes(entity.typeId)) {
                LootTableManager.spawnTable(table, entity.dimension, entity.location);
            }
        }
    }

    public static spawnTable(table: LootTable, dimension: Dimension, location: Vector3): boolean {
        let allItemsGenerated: boolean = false;
        for (let i = 0; i < table.rolls; i++) {
            const weights: number[] = table.entries.map(entry => entry.weight);
            const totalWeight: number = weights.reduce((sum, weight) => sum + weight, 0);
            let randomWeight: number = Math.random() * totalWeight;
            let selectedEntry: LootTableEntry | undefined;

            for (const entry of table.entries) {
                randomWeight -= entry.weight;
                if (randomWeight <= 0) {
                    selectedEntry = entry;
                    break;
                }
            }

            if (selectedEntry) allItemsGenerated = this.generateItem(selectedEntry, dimension, location);  
        }
        return allItemsGenerated;
    }

    private static generateItem(entry: LootTableEntry, dimension: Dimension, location: Vector3): boolean {
        const typeId: string = entry.typeId;
        const amount: number = Math.floor(Math.random() * (entry.amount[1] - entry.amount[0] + 1)) + entry.amount[0];
        const itemStack = ItemOperations.new(typeId, amount);
        const properties: LootTableProperties | undefined = entry.properties
        if (properties) {
            const nameTag: string | undefined = properties.nameTag;
            const loreList: string[] | undefined = properties.loreList;
            if (nameTag) ItemOperations.setNameTag(itemStack, nameTag);
            if (loreList) ItemOperations.setLore(itemStack, loreList);
        }
        return ItemOperations.spawn(itemStack, dimension, location);
    }
}


export {LootTableManager, LootTable, LootTableEntry, LootTableProperties }