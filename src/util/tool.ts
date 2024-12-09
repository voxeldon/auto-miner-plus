import { Entity, ItemUseAfterEvent, Player, world } from "@minecraft/server";
import { interfaceLang, lang, propertyId, texturePath, toolTypeId } from "../global";
import { ActionForm, ActionFormReturnData, MessageForm } from "../_import/spec/_module/util/form";
import { AutoMinerUtil } from "../entity/auto_miner/util";
import { CommonOperations } from "./common_operations";
import { PilotCamera } from "./camera";
import { AutoMinerInteracts } from "../entity/auto_miner/interaction";
import { AutoMiner } from "../entity/auto_miner/main";
import { Vector3 } from "../_import/spec/_module/util/vector";
import { MessageFormResponse } from "@minecraft/server-ui";

export class Tool {
    private static initialized: boolean = false;
    public static initialize(): void {
        if (!Tool.initialized) {
            world.afterEvents.itemUse.subscribe((event: ItemUseAfterEvent)=>{
                if (event.itemStack.typeId === toolTypeId) {
                    Tool.onItemUsed(event.source);
                };
            });
            Tool.initialized = true;
        } else {
            console.warn('ERROR: Instance of Tool already in use.')
        }
    }

    private static onItemUsed(player:Player){
        let cameraPathId = player.getDynamicProperty(propertyId.cameraPathId) as string | undefined;
        let lastKnownlocation = player.getDynamicProperty(propertyId.lastKnownlocation) as Vector3 | undefined;
        if (cameraPathId) {
            const entity: Entity | undefined = world.getEntity(cameraPathId as string);
            if (entity) {
                ToolInterface.pageActiveAutoMiner(player, entity);
                return;
            }
        } else if (lastKnownlocation){
            ToolInterface.returnToLastLocationPage(player, lastKnownlocation);
            return;
        }
        ToolInterface.pageHome(player);
        
    }
}

class ToolInterface {
    public static pageHome(player: Player){
        const autoMiners: Entity[] = CommonOperations.getOwnedEntities(player.id, 'auto_miner');
        const form: ActionForm = new ActionForm();
        form.setTitle(interfaceLang.homeTitle);
        const hasButtons: boolean = InterfaceOperations.makeButtonForEachAutoMiner(player, autoMiners, form);
        if (!hasButtons) {
            form.addButton('back', interfaceLang.buttonBack);
            form.setBody(interfaceLang.homeBodyNoEntry);
            player.playSound('vxl_auto.error');
        } else form.setBody(interfaceLang.homeBody);

        form.showForm(player).then((data: ActionFormReturnData) => {
            if (data?.indexId === 'back') return;
            for (const entity of autoMiners) {
                if (data?.indexId === entity.id) {
                    ToolInterface.pageSelectedAutoMiner(player, entity);
                    break;
                }
            }
        }).catch((error: any) => {console.error(error);});
    }
    public static pageSelectedAutoMiner(player: Player, autoMiner: Entity){
        const form: ActionForm = new ActionForm();
        form.setTitle(autoMiner.nameTag);
        if (player.dimension.id === autoMiner.dimension.id) {
            ToolInterface.selectedValid(form, player, autoMiner);
        } else ToolInterface.selectedInvalid(form, player, autoMiner);
        
    }

    private static selectedValid(form: ActionForm, player: Player, autoMiner: Entity) {
        player.playSound('vxl_auto.interact');
        form.setBody(interfaceLang.selectedAutoMinerBody);
        form.addButton('pilot', interfaceLang.pilot);
        //form.addButton('modes', interfaceLang.modes);
        form.addButton('recall', interfaceLang.recall);
        if (world.getDynamicProperty('vxl_auto:allow_teleport') === true) {
            form.addButton('teleport', interfaceLang.teleport);
        }
        form.addButton('back', interfaceLang.buttonBack);
        form.showForm(player).then((data: ActionFormReturnData) => {
            if (data?.indexId === 'pilot') new PilotCamera(player, autoMiner);
            if (data?.indexId === 'modes') ToolInterface.pageModes(player, autoMiner);
            if (data?.indexId === 'back') ToolInterface.pageHome(player);
            if (data?.indexId === 'recall') AutoMiner.recallEntity(autoMiner, player);
            if (data?.indexId === 'teleport') InterfaceOperations.teleportToAutoMiner(autoMiner, player);
        }).catch((error: any) => {console.error(error);});
    }

    private static selectedInvalid(form: ActionForm, player: Player, autoMiner: Entity) {
        player.playSound('vxl_auto.error');
        form.setBody(`${interfaceLang.selectedAutoMinerDimensionError}\n\nDimension: ${autoMiner.dimension.id.replace('minecraft:','').charAt(0).toUpperCase() + autoMiner.dimension.id.replace('minecraft:','').slice(1)}`);
        form.addButton('back', interfaceLang.buttonBack);
        form.showForm(player).then((data: ActionFormReturnData) => {
            if (data?.indexId === 'back') ToolInterface.pageHome(player);
        }).catch((error: any) => {console.error(error);});
    }

    public static pageModes(player: Player, autoMiner: Entity){
        const canBuildBridge = autoMiner.getDynamicProperty(propertyId.canBuildBridge) as boolean;
        const form: ActionForm = new ActionForm();
        form.setTitle(interfaceLang.modes);
        form.setBody(interfaceLang.modesBody)
        if (!canBuildBridge) form.addButton('start_bridge', interfaceLang.startBuildBridge);
        else form.addButton('stop_bridge', interfaceLang.stopBuildBridge);
        form.showForm(player).then((data: ActionFormReturnData) => {
            if (data?.indexId === 'back') {
                ToolInterface.pageSelectedAutoMiner(player, autoMiner); 
            }
            else if (data?.indexId === 'start_bridge' || data?.indexId === 'stop_bridge') {
                autoMiner.setDynamicProperty(propertyId.canBuildBridge, !canBuildBridge)
            }
            
        }).catch((error: any) => {console.error(error);});
    }

    public static blockSelector(player: Player, autoMiner: Entity){
        const canBuildBridge = autoMiner.getDynamicProperty(propertyId.canBuildBridge) as boolean;
        const form: ActionForm = new ActionForm();
        form.setTitle(interfaceLang.modes);
        form.setBody(interfaceLang.modesBody)
        
        form.showForm(player).then((data: ActionFormReturnData) => {
            if (data?.indexId === 'back') {
                ToolInterface.pageSelectedAutoMiner(player, autoMiner); 
            }
            else if (data?.indexId === 'start_bridge' || data?.indexId === 'stop_bridge') {
                autoMiner.setDynamicProperty(propertyId.canBuildBridge, !canBuildBridge)
            }
            
        }).catch((error: any) => {console.error(error);});
    }

    public static pageActiveAutoMiner(player: Player, autoMiner: Entity){
        const isPowered = autoMiner.getProperty(propertyId.powered) as boolean;
        const form: ActionForm = new ActionForm();
        form.setTitle(autoMiner.nameTag);
        form.setBody(interfaceLang.selectedAutoMinerBody);
        form.addButton('right', interfaceLang.turnRight, `${texturePath}/icons/right`);
        form.addButton('left', interfaceLang.turnLeft, `${texturePath}/icons/left`);
        if (isPowered) {
            form.addButton('toggle_power', interfaceLang.stop, `${texturePath}/icons/on`);
        } else {
            form.addButton('toggle_power', interfaceLang.start, `${texturePath}/icons/off`);
        }
        form.addButton('exit_camera', interfaceLang.exitCamera);
        form.showForm(player).then((data: ActionFormReturnData) => {
            if (data?.indexId === 'right') {
                AutoMinerInteracts.changeDirectionCounterClockwise(autoMiner);
            }
            if (data?.indexId === 'left') {
                AutoMinerInteracts.changeDirection(autoMiner);
            }
            if (data?.indexId === 'toggle_power') {
                AutoMinerInteracts.togglePower(autoMiner);
            }
            if (data?.indexId === 'exit_camera') {
                PilotCamera.onCameraExit(player);
            }
            
        }).catch((error: any) => {console.error(error);});
    }

    public static returnToLastLocationPage(player: Player, lastKnownlocation: Vector3){
        const form: MessageForm = new MessageForm();
        form.setBody('Would you like to return to your last known location before teleporting?')
        form.setTitle('Teleporter')
        form.setButtonOne('no')
        form.setButtonTwo('yes')
        form.show(player).then((data: MessageFormResponse) => {
            if (data.selection === 0) {
                player.setDynamicProperty(propertyId.lastKnownlocation, undefined);
            }
            if (data.selection === 1) {
                player.teleport(lastKnownlocation);
                player.setDynamicProperty(propertyId.lastKnownlocation, undefined);
            }
            
        }).catch((error: any) => {console.error(error);});
    }
}

class InterfaceOperations {
    public static makeButtonForEachAutoMiner(player: Player, autoMiners: Entity[], form: ActionForm): boolean {
        let buttonsMade: boolean = false;
        for (const autoMiner of autoMiners) {
            let colorPrefix: string = '§2'
            const colorId = AutoMinerUtil.getColorFromIndex(autoMiner);
            const cleanedName: string = autoMiner.nameTag.replace(`${player.nameTag}${lang.plural}`, '');
            const finalName: string = `${colorPrefix}${cleanedName}`;
            form.addButton(autoMiner.id, finalName, `${texturePath}/items/auto_miner_spawn_egg/${colorId}`);
            buttonsMade = true;  
        }
        return buttonsMade;
    }
    public static teleportToAutoMiner(autoMiner: Entity, player: Player) {
        const startLocation = player.location;
        player.setDynamicProperty(propertyId.lastKnownlocation, startLocation);
        player.teleport(autoMiner.location, {checkForBlocks: true})
        if (JSON.stringify(player.location) === JSON.stringify(startLocation)) {
            player.onScreenDisplay.setActionBar(lang.cantTeleportWarning)
            player.setDynamicProperty(propertyId.lastKnownlocation, undefined);
        }
    }
}