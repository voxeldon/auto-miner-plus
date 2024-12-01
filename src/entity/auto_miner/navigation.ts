import { Block, Entity, system } from "@minecraft/server";
import { Vector3 } from "../../_import/spec/_module/util/vector";
import { AutoMinerUtil } from "./util";

export class AutoMinerNavigation {
    public static moveEntity(entity: Entity, block: Block | undefined): void {
        let distanceToNearestBlock: number = Vector3.distance(entity.location, block?.location || Vector3.ZERO);
        if (!block) distanceToNearestBlock = 100;
        if (distanceToNearestBlock <= 1) return;
        const modifiedMovementSpeed: number = AutoMinerUtil.getSpeedModifiers(entity);
        const facingDirection: Vector3 = entity.getViewDirection();
        const movementDirection: Vector3 = Vector3.normalize(facingDirection);
        const movementVector: Vector3 = Vector3.divide(movementDirection, 20);
        const modifiedMovementVector: Vector3 = Vector3.multiply(movementVector, modifiedMovementSpeed);
        const newPosition: Vector3 = Vector3.add(entity.location, modifiedMovementVector);
        entity.teleport(newPosition);     
    }

    public static snapEntityToGrid(entity: Entity): void {
        const snap: number = system.runInterval(()=>{
            entity.teleport(new Vector3(Math.floor(entity.location.x) + 0.5, entity.location.y, Math.floor(entity.location.z) + 0.5));
        })
        const resolveSnap: number = system.runTimeout(()=>{
            system.clearRun(snap);system.clearRun(resolveSnap)
        }, 10)
    }
}