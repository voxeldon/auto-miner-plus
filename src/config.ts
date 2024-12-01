export interface ConfigData {
    toolMenuOptions: {
        canTeleportTo: boolean
    }
}

export class Config {
    public static data = {
        toolMenuOptions: {
            canTeleportTo: true
        }
    }
    public static updateConfig(configData: ConfigData){
        Config.data = configData;
    }
}