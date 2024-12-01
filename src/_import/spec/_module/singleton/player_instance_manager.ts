import { Player, PlayerJoinAfterEvent, PlayerLeaveBeforeEvent, system, world } from "@minecraft/server";

export type ForEachPlayerEventSignal = (player: Player) => void;

export class ForEachPlayer {
    public static eventSignal: ForEachPlayerEventSignal[] = [];

    public static subscribe(callback: ForEachPlayerEventSignal): ForEachPlayerEventSignal {
        ForEachPlayer.eventSignal.push(callback);
        return callback;
    }

    public static unsubscribe(callback: ForEachPlayerEventSignal): void {
        const index = ForEachPlayer.eventSignal.indexOf(callback);
        if (index !== -1) {
            ForEachPlayer.eventSignal.splice(index, 1);
        }
    }

    public static emitEvent(player: Player): void {
        for (const handler of ForEachPlayer.eventSignal) {
            handler(player);
        }
    }
}

export class PlayerInstanceManager {
    private static initialized: boolean = false;
    private static readonly playerCache: Set<Player> = new Set<Player>();

    //Methods
    public static initialize(): void {
        if (!PlayerInstanceManager.initialized) {
            world.afterEvents.playerJoin.subscribe((event: PlayerJoinAfterEvent)=>{
                const playerId: string = event.playerId;
                const player: Player = world.getEntity(playerId) as Player;
                this.onPlayerJoin(player);
            });
            world.beforeEvents.playerLeave.subscribe((event: PlayerLeaveBeforeEvent)=>{
                const runEvent: number = system.run(()=>{
                    PlayerInstanceManager.onPlayerLeave(event.player);
                    system.clearRun(runEvent);
                });
            });
            system.runInterval(()=>PlayerInstanceManager.iteratePlayers());
            PlayerInstanceManager.initialized = true;
        } else {
            console.warn('ERROR: instance of PlayerInstanceManager already active.');
        }
    }

    public static getPlayerCache(): Set<Player> {
        return PlayerInstanceManager.playerCache;
    }

    public static forPlayersofIndex(callback: (player: Player) => void) {
        PlayerInstanceManager.playerCache.forEach((player: Player) => {
            callback(player); // pass player to callback
        });
    }

    public static size(): number {
        return PlayerInstanceManager.playerCache.size;
    }

    private static onPlayerJoin(player: Player): void {
        PlayerInstanceManager.playerCache.add(player);
    }
    private static onPlayerLeave(player: Player): void {
        PlayerInstanceManager.playerCache.delete(player);
    }

    private static iteratePlayers(): void {
        if (PlayerInstanceManager.playerCache.size === 0) {
            PlayerInstanceManager.repopulatePlayerCache();
        }
        else {
            PlayerInstanceManager.playerCache.forEach((player: Player)=>{
                if (player.isValid()) ForEachPlayer.emitEvent(player);
            });
        }
    }

    private static repopulatePlayerCache(): void {
        const allFoundPlayers = world.getAllPlayers();
        if (allFoundPlayers.length === 0) return;
        allFoundPlayers.forEach(player => {
            PlayerInstanceManager.playerCache.add(player);
        });
    }
}

PlayerInstanceManager.initialize();