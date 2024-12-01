import { ScoreboardIdentityType, ScoreboardScoreInfo, world } from '@minecraft/server';
import { ScoreboardObjective, Scoreboard } from '@minecraft/server';

/**
* Defines the structure of a ScoreboardObjective | undefined.
*/

export interface RegisteredSet {
    successful: boolean,
    dataSet: ScoreboardObjective[]
}

class SDB {
    private static scoreboard: Scoreboard = world.scoreboard;

    public static registerSet(objectiveIds: string[]): RegisteredSet {
        const objective_count: number = objectiveIds.length;
        let success_count: number = 0;
        const dataSet: ScoreboardObjective[] = [];
        for (const objectiveId of objectiveIds) {
            let db: ScoreboardObjective | undefined = undefined;
            try {
                db = SDB.newDb(objectiveId)
            } catch (e) {/*Already Exists*/} finally {
                if (db !== undefined) {
                    dataSet.push(db);
                    success_count += 1;
                }
            }
        }
        if (success_count === objective_count) {
            return {
                successful: true,
                dataSet: dataSet
            }
        } else {
            return {
                successful: false,
                dataSet: dataSet
            }
        }
    }

    public static newDb(objectiveId: string): ScoreboardObjective | undefined {
        return this.scoreboard.addObjective(objectiveId);
    }

    public static removeDb(objectiveId: string | ScoreboardObjective): boolean {
        objectiveId = SDB.getAdressFromObjective(objectiveId);
        const db: ScoreboardObjective | undefined = this.getDb(objectiveId);
        if (!db) return false;

        try {
            this.scoreboard.removeObjective(objectiveId);
            return true;
        } catch {
            return false;
        }
    }

    public static getAllDb(): ScoreboardObjective[] {
        return this.scoreboard.getObjectives();
    }

    public static getDb(objectiveId: string): ScoreboardObjective | undefined {
        return this.scoreboard.getObjective(objectiveId);
    }

    public static getDbElseNew(objectiveId: string): ScoreboardObjective | undefined {
        let db: ScoreboardObjective | undefined = this.getDb(objectiveId);
        if (!db) {
            const created = this.newDb(objectiveId);
            if (created) db = this.getDb(objectiveId);
        }
        return db as ScoreboardObjective | undefined;
    }

    public static setKey(objectiveId: string | ScoreboardObjective, keyId: string, value: number = 0): boolean {
        objectiveId = SDB.getAdressFromObjective(objectiveId);
        const db: ScoreboardObjective | undefined = this.getDb(objectiveId);
        if (db) {
            db.setScore(keyId, value);
            return true;
        } else return false;
    }

    public static addToKey(objectiveId: string | ScoreboardObjective, keyId: string, value: number = 0): boolean {
        objectiveId = SDB.getAdressFromObjective(objectiveId);
        const db: ScoreboardObjective | undefined = this.getDb(objectiveId);
        if (db) {
            db.addScore(keyId, value);
            return true;
        } else return false;
    }

    public static removeKey(objectiveId: string | ScoreboardObjective, keyId: string): boolean {
        objectiveId = SDB.getAdressFromObjective(objectiveId);
        const db: ScoreboardObjective | undefined = this.getDb(objectiveId);
        if (db){
            db.removeParticipant(keyId);
            return true;
        } else return false;
    }

    public static getKeyValue(objectiveId: string | ScoreboardObjective, keyId: string): number {
        objectiveId = SDB.getAdressFromObjective(objectiveId);
        try {
            const db: ScoreboardObjective | undefined = this.getDb(objectiveId);
            const key = db?.getScore(keyId);
            if (key) return key;
        } catch (error) {};
        return 0;
    }

    public static getAllKeys(objectiveId: string | ScoreboardObjective): ScoreboardScoreInfo[] {
        objectiveId = SDB.getAdressFromObjective(objectiveId);
        const result: ScoreboardScoreInfo[] = [];
        const objective: ScoreboardObjective | undefined = this.getDb(objectiveId);
        if (objective) {
            const scores: ScoreboardScoreInfo[] = objective.getScores()
            if (scores) {
                for (const score of scores) {
                    if (score.participant.type === ScoreboardIdentityType.FakePlayer) {
                        result.push(score);
                    }
                }
            }
        }
        return result;
    }

    public static newUUID(): number {
        const min: number = -2147483647;
        const max: number = 2147483647;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public static setArray(dbID: string, key: string, array: any[]): boolean {
        try {
            const arrayString: string = JSON.stringify(array);
            let uuid: number;

            const existingUUID: number = this.getKeyValue(dbID, key);
            if (!existingUUID || existingUUID == 0) uuid = this.newUUID();
            else uuid = existingUUID

            this.removeKey(dbID, key);
            const allKeysWithSameUUID: ScoreboardScoreInfo[] = this.getAllKeys(dbID).filter(entry => entry.score === uuid);

            for (const entry of allKeysWithSameUUID) {
                this.removeKey(dbID, entry.participant.displayName);
            }
            this.setKey(dbID, key, uuid);
            this.setKey(dbID, arrayString, uuid);
            return true
        } catch (error) {console.warn(Error(`Error setting array @${dbID} | ${key} | ${error}`))}
        return false
    }

    public static getArray(dbID: string, key: string):[] {
        const uuid: number = this.getKeyValue(dbID, key);
        if (uuid !== undefined) {
            const allKeys = this.getAllKeys(dbID);
            for (const entry of allKeys) {
                if (entry.score === uuid && entry.participant.displayName !== key) {
                    return JSON.parse(entry.participant.displayName);
                }
            }
        }
        return [];
    }

    public static removeArray(dbID: string, key: string): boolean {
        const uuid: number = this.getKeyValue(dbID, key);
        if (uuid !== undefined) {
            const allKeysWithSameUUID = this.getAllKeys(dbID).filter(entry => entry.score === uuid);
            for (const entry of allKeysWithSameUUID) {
                this.removeKey(dbID, entry.participant.displayName);
            }
            return true
        } 
        return false   
    }

    public static setDictionary (dbID: string, key: string, dictionary : object): boolean {
        try {
            const dictionaryString: string = JSON.stringify(dictionary);
            let uuid: number;

            const existingUUID: number = this.getKeyValue(dbID, key);
            if (!existingUUID || existingUUID == 0) uuid = this.newUUID();
            else uuid = existingUUID

            this.removeKey(dbID, key);
            const allKeysWithSameUUID: ScoreboardScoreInfo[] = this.getAllKeys(dbID).filter(entry => entry.score === uuid);

            for (const entry of allKeysWithSameUUID) {
                this.removeKey(dbID, entry.participant.displayName);
            }
            this.setKey(dbID, key, uuid);
            this.setKey(dbID, dictionaryString, uuid);
            return true
        } catch (error) {console.warn(Error(`Error setting dictionary @${dbID} | ${key} | ${error}`))}
        return false
    }

    public static getDictionary(dbID: string, key: string): object {
        const uuid: number = this.getKeyValue(dbID, key);
        if (uuid !== undefined) {
            const allKeys = this.getAllKeys(dbID);
            for (const entry of allKeys) {
                if (entry.score === uuid && entry.participant.displayName !== key) {
                    return JSON.parse(entry.participant.displayName);
                }
            }
        }
        return {};
    }

    public static removeDictionary(dbID: string, key: string): boolean {
        if (this.removeArray(dbID,key)) return true
        else return false; 
    }

    private static getAdressFromObjective(db: string | ScoreboardObjective): string {
        if (typeof db === "string") return db as string;
        else return (db as ScoreboardObjective).displayName;
    }
}

export { SDB };
