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
    ],
    guideKeys: [
        "guide.title",
        "guide.warn_header",
        "guide.warn_body",
        "guide.a_miner_header",
        "guide.a_miner_description",
        "guide.toggle_engines",
        "guide.toggle_rotation",
        "guide.change_color",
        "guide.item_collection",
        "guide.increase_speed",
        "guide.tiers",
        "guide.pump_header",
        "guide.pump_description",
        "guide.connection_options",
        "guide.connection_menu",
        "guide.inventory_drain",
        "guide.tool_header",
        "guide.tool_description",
        "guide.pilot_header",
        "guide.pilot_controls",
        "guide.pilot_controls_details",
        "guide.pilot_mode",
        "guide.recall_header",
        "guide.recall",
        "guide.teleport_to_header",
        "guide.teleport_to",
        "guide.return_prompt"
    ]
}
AcmApi.generateAddonProfile(spawnManager);
AcmApi.subscribe((event: AcmEventData)=>{
    if (event.type === AcmEventType.DataChanged) {
        world.setDynamicProperty('vxl_auto:allow_teleport', event.data?.get('allow_teleport'));
    }
})