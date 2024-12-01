import { Entity, ScoreboardObjective, world } from "@minecraft/server";
import { SDB } from "../_import/spec/_module/util/db";

export class CommonOperations {
    public static getOwnedEntities(ownerId: string, typeKey: string): Entity[]{
        const db: ScoreboardObjective | undefined = SDB.getDb(`vxl_auto:player.${ownerId}`);
        const autoMinerIds: string[] = [];
        const autoMienrs: Entity[] = [];
        if (db) {
            for (const participant of db?.getParticipants()) {
                if (participant.displayName.includes(typeKey)) {
                    const cleanedId: string = participant.displayName.replace(`${typeKey}.`,'');
                    autoMinerIds.push(cleanedId);
                }
            }
        }
        if (autoMinerIds.length > 0) {
            for (const id of autoMinerIds) {
                const entity: Entity | undefined = world.getEntity(id);
                if (entity) autoMienrs.push(entity);
            }
        }
        return autoMienrs;
    }
    public static getOwnedEntityIds(ownerId: string, typeKey: string): string[]{
        const db: ScoreboardObjective | undefined = SDB.getDb(`vxl_auto:player.${ownerId}`);
        const autoMinerIds: string[] = [];
        if (db) {
            for (const participant of db?.getParticipants()) {
                if (participant.displayName.includes(typeKey)) {
                    const cleanedId: string = participant.displayName.replace(`${typeKey}.`,'');
                    autoMinerIds.push(cleanedId);
                }
            }
        }
        return autoMinerIds;
    }
}