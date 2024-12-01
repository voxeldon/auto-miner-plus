import { Player, TicksPerSecond, world } from "@minecraft/server";
import { EntityManager } from "./_import/spec/_module/singleton/entity_manager";
import { autoMinerTypeId, entitySpawnerTypeId, itemPumpTypeId, propertyId } from "./global";
import { AutoMinerManager } from "./util/auto_miner_manager";
import { ItemPumpManager } from "./util/item_pump";
import { SpawnManager } from "./util/spawn_manager";
import { Tool } from "./util/tool";
import { PlayerInstanceManager } from "./_import/spec/_module/singleton/player_instance_manager";
import { PilotCamera } from "./util/camera";
import { AcmApi, AcmEventData, AcmEventType, AddonConfiguration } from "./_import/acm_api";
EntityManager.initialize('vxl_auto', [{typeId: autoMinerTypeId, requireSimulationRange: false}, {typeId: itemPumpTypeId, delayInterval: TicksPerSecond}]);
SpawnManager.initialize(entitySpawnerTypeId);
AutoMinerManager.initialize();
ItemPumpManager.initialize();
Tool.initialize();

world.afterEvents.worldInitialize.subscribe(()=>{
    PlayerInstanceManager.forPlayersofIndex((player:Player)=>{
        if (player.getDynamicProperty(propertyId.cameraPathId) !== undefined) {
            PilotCamera.onCameraExit(player);
        }
    })
})

const spawnManager: AddonConfiguration = {
    authorId: 'vxl',
    packId: 'auto',
    iconPath: 'voxel/vxl_auto/pack_icon',
    addonSettings: [
        {
            label: 'allow_teleport',
            defaultValue: true
        }
    ]
}
AcmApi.generateAddonProfile(spawnManager);
AcmApi.subscribe((event: AcmEventData)=>{
    if (event.type === AcmEventType.DataChanged) {
        world.setDynamicProperty('vxl_auto:allow_teleport', event.data?.get('allow_teleport'));
    }
})