import { Entity, Player } from "@minecraft/server";
import { Vector3 } from "./vector";

export type DynamicPropertyValue = boolean | number | string | Vector3 | undefined;

export interface DynamicProperty {
    identifier: string;
    value?: DynamicPropertyValue;
}

export type DynamicPropertyMap = Map<string, DynamicPropertyValue>;

export class EntityOperations{
    public static getDynamicProperties(source: Entity | Player): DynamicPropertyMap {
        const dynamicPropertyIds: string[] = source.getDynamicPropertyIds();
        const dynamicPropertyMap: DynamicPropertyMap = new Map<string, DynamicPropertyValue>();
        for (const propId of dynamicPropertyIds) {
            const propertyValue: DynamicPropertyValue = source.getDynamicProperty(propId);
            dynamicPropertyMap.set(propId, propertyValue);
        }
        return dynamicPropertyMap;
    }

    public static distanceToNearestPlayer(entity: Entity, radius: number): number {
        const players: Player[] = entity.dimension.getPlayers({
            location: entity.location,
            closest: 1,
            maxDistance: radius,
            minDistance: 0,
        });
        if (players.length > 0) {
            const nearestPlayerLocation: Vector3 = players[0].location;
            return Vector3.distance(entity.location, nearestPlayerLocation);
        } else {
            return radius + 1;
        }
    }
}