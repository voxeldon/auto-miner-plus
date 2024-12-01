import { ScriptEventCommandMessageAfterEvent } from "@minecraft/server";

class ScriptEvent {
    public eventId: string;
    private callback: (event: ScriptEventCommandMessageAfterEvent) => void;

    constructor(eventId: string, callback: (event: ScriptEventCommandMessageAfterEvent) => void) {
        this.eventId = eventId;
        this.callback = callback;
    }

    public _handleEvent(event: ScriptEventCommandMessageAfterEvent): void {
        this.callback(event);
    }
}

class ScriptEventRegistry {
    private eventHandlers: Map<string, ScriptEvent>;

    constructor(scriptEvents: ScriptEvent[]) {
        this.eventHandlers = new Map(scriptEvents.map(se => [se.eventId, se]));
        this.scriptEventRegister = this.scriptEventRegister.bind(this);
    }

    public scriptEventRegister(event: ScriptEventCommandMessageAfterEvent): void {
        const eventId = event.id;
        const scriptEvent = this.eventHandlers.get(eventId);

        if (scriptEvent) {
            scriptEvent._handleEvent(event);
        }
    }
}

export { ScriptEventRegistry, ScriptEvent };