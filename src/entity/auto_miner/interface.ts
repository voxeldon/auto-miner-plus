import { Entity, Player } from "@minecraft/server";
import { ActionForm, ActionFormReturnData, FormValue, ModelForm, ModelFormFormReturnData } from "../../_import/spec/_module/util/form";

const interfaceLang = {
    homeTitle: "Auto-Miner Interface",
    homeBody: "Configuration Options",
    buttonBack: "back"
}

export class AutoMinerInterface {
    public static pageHome(player: Player){
        const form: ActionForm = new ActionForm();
        form.setTitle(interfaceLang.homeTitle);
        form.setBody(interfaceLang.homeBody);
        form.addButton('back', interfaceLang.buttonBack);
        form.showForm(player).then((data: ActionFormReturnData) => {
            if (data?.indexId === 'back') return;
        }).catch((error: any) => {console.error(error);});
    }

    public static reName(entity: Entity, player: Player) {
        const form: ModelForm = new ModelForm();
        form.addTextField('name', 'Set Code name.', entity.nameTag, entity.nameTag);
        form.showForm(player).then((data: ModelFormFormReturnData) => {
            const newName: FormValue | undefined = data.indexMap?.get('name');
            entity.nameTag = newName as string;
        }).catch((error: any) => {console.error(error);});
    }
}