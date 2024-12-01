import { CameraDefaultOptions, CameraEaseOptions, CameraSetPosOptions, CameraSetRotOptions, Container, ContainerSlot, EasingType, Entity, EntityInventoryComponent, Player, system } from "@minecraft/server";
import { MinecraftCameraPresetsTypes } from "../_import/vanilla_data/_module/mojang-cameraPresets";
import { Vector2, Vector3 } from "../_import/spec/_module/util/vector";
import { propertyId } from "../global";
import { OnEntityRemoved, OnEntityRemovedEvent, OnEntityRemovedEventSignal } from "../_import/spec/_module/singleton/entity_manager";

export class PilotCamera {
    private player: Player;
    private entity: Entity;
    private runCameraProcess: number;
    private static activeCameraIndex: Map<string, number> = new Map<string, number>();
    constructor(player: Player, entity: Entity){
        this.player = player;
        this.entity = entity;
        this.runCameraProcess = system.runInterval(()=>this.processCamera())
        this.onCameraEntry();
    }
    private onCameraEntry(){
        this.player.setDynamicProperty(propertyId.cameraPathId, this.entity.id);
        PilotCamera.activeCameraIndex.set(this.player.id, this.runCameraProcess);
    }
    public static onCameraExit(player: Player){
        const index: number | undefined = PilotCamera.activeCameraIndex.get(player.id);
        if (index) {
            system.clearRun(index);
            PilotCamera.activeCameraIndex.delete(player.id)
        }
        player.setDynamicProperty(propertyId.cameraPathId, undefined);
        player.camera.clear();
    }
    private processCamera(){
        if (!this.entity || !this.player || !this.entity.isValid() || !this.player.isValid()) {
            system.clearRun(this.runCameraProcess);
            return;
        }
        const direction = this.entity.getProperty(propertyId.direction); // returns north, west, east, south
        const facingLocation: Vector3 = Vector3.normalize(this.entity.getViewDirection());
        const easeOptions: CameraEaseOptions = {
            easeTime: 0.1,
            easeType: EasingType.Linear
        }
        const offset: number = 2
        let rotation = 0;
        let locationX: number = this.entity.location.x;
        let locationZ: number = this.entity.location.z;
        if (direction === 'north') {
            rotation = 0;
            locationZ = locationZ - offset;
        }
        if (direction === 'south') {
            rotation = 180;
            locationZ = locationZ + offset;
        }
        if (direction === 'west') {
            rotation = 90;
            locationX = locationX + offset;
        }
        if (direction === 'east') {
            rotation = 270;
            locationX = locationX - offset;
        }
        const cameraRotOptions: CameraSetRotOptions = {
            easeOptions,
            rotation: new Vector2(25, rotation),
            location: new Vector3(
                locationX, 
                this.entity.location.y + 2, 
                locationZ
            )
        }
        this.player.camera.setCamera(MinecraftCameraPresetsTypes.Free, cameraRotOptions)
    }
}