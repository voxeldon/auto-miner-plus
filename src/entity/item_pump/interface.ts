import { Entity, Player, RawMessage } from "@minecraft/server";
import { ActionForm, ActionFormReturnData } from "../../_import/spec/_module/util/form";
import { CommonOperations } from "../../util/common_operations";
import { interfaceLang, lang, propertyId, texturePath } from "../../global";
import { AutoMinerUtil } from "../auto_miner/util";
import { RawText } from "../../_import/spec/_module/util/raw_text";


export class ItemPumpInterface {
    public static pageHome(player: Player, parent: Entity){
        const autoMiners: Entity[] = CommonOperations.getOwnedEntities(player.id, 'auto_miner');
        const form: ActionForm = new ActionForm();
        form.setTitle(interfaceLang.homeTitlePump);
        const hasButtons: boolean = InterfaceOperations.makeButtonForEachAutoMiner(player,parent, autoMiners, form);
        if (!hasButtons) {
            form.addButton('back', interfaceLang.buttonBackPump);
            form.setBody(interfaceLang.homeBodyNoEntryPump);
            player.playSound('vxl_auto.error');
        } else {
            player.playSound('vxl_auto.interact');
            form.setBody(interfaceLang.homeBodyPump);
        }
        form.showForm(player).then((data: ActionFormReturnData) => {
            player.playSound('vxl_auto.interact');
            if (data?.indexId === 'back') return;
            else {
                for (const entity of autoMiners) {
                    if (data?.indexId === entity.id) {
                        ItemPumpInterface.pageSelectedAutoMiner(player, entity, parent);
                        break;
                    }
                }
            }
        }).catch((error: any) => {console.error(error);});
    }

    public static pageSelectedAutoMiner(player: Player, autoMiner: Entity, parent: Entity){
        const routePathId = autoMiner.getDynamicProperty(propertyId.routePathId) as string | undefined;
        const form: ActionForm = new ActionForm();
        form.setTitle(interfaceLang.homeTitlePump);
        form.setBody(InterfaceOperations.generateSelectedAutoMinerBodyText(routePathId));

        if (routePathId) form.addButton('route', interfaceLang.buttonUnroute);
        else form.addButton('route', interfaceLang.buttonRoute);
        form.addButton('back', interfaceLang.buttonBackPump);

        form.showForm(player).then((data: ActionFormReturnData) => {
            player.playSound('vxl_auto.interact');
            if (data?.indexId === 'back') ItemPumpInterface.pageHome(player, parent);
            else if (data?.indexId === 'route') {
                if (routePathId) autoMiner.setDynamicProperty(propertyId.routePathId, undefined);
                else {
                    autoMiner.setDynamicProperty(propertyId.routePathId, parent.id);
                    parent.setProperty(propertyId.powered, true);
                }
                ItemPumpInterface.pageSelectedAutoMiner(player, autoMiner, parent);
            }
        }).catch((error: any) => {console.error(error);});
    }
}

class InterfaceOperations{
    public static makeButtonForEachAutoMiner(player: Player, parent: Entity, autoMiners: Entity[], form: ActionForm): boolean {
        let buttonsMade: boolean = false;
        for (const autoMiner of autoMiners) {
            if (autoMiner.dimension.id !== player.dimension.id) continue;
            const routePathId = autoMiner.getDynamicProperty(propertyId.routePathId) as string | undefined;
            const canPickUpItems = autoMiner.getProperty(propertyId.pickupItems) as boolean | undefined;
            if ((routePathId === undefined || routePathId === parent.id) && canPickUpItems === true) {
                let colorPrefix: string = '§2'
                if (routePathId === undefined) colorPrefix = '§4'
                const colorId = AutoMinerUtil.getColorFromIndex(autoMiner);
                form.addButton(autoMiner.id, colorPrefix + autoMiner.nameTag, `${texturePath}/items/auto_miner_spawn_egg/${colorId}`);
                buttonsMade = true;
            }   
        }
        return buttonsMade;
    }

    public static generateSelectedAutoMinerBodyText(routePathId: string | undefined): RawMessage {
        const route: string = interfaceLang.selectedAutoBodyRoute;
        const connected: string = interfaceLang.selectedAutoBodyConnected;
        let isRouted: boolean = false;
        if (routePathId !== undefined){
            isRouted = true;
            return RawText.MESSAGE(
                RawText.TEXT('§2'), RawText.TRANSLATE(connected),
                RawText.TEXT(`: ${isRouted}\n`),
                RawText.TRANSLATE(route), RawText.TEXT(`: ${routePathId}`)
            )
        }
        return RawText.MESSAGE(RawText.TEXT('§4'), RawText.TRANSLATE(connected), RawText.TEXT(`: ${isRouted}`),)
    }
}