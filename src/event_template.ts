export type Event = {};
export type EventSignal = (event: Event) => void;

export class EventTemplate {
    public static EventSignal: EventSignal[] = [];

    public static subscribe(callback: EventSignal): EventSignal {
        EventTemplate.EventSignal.push(callback);
        return callback
    }

    public static unsubscribe(callback: EventSignal): void {
        const index = EventTemplate.EventSignal.indexOf(callback);
        if (index !== -1) {
            EventTemplate.EventSignal.splice(index, 1);
        }
    }

    public static emitEvent(): void {
        const event: Event = {  };
        for (const handler of EventTemplate.EventSignal) {
            handler(event);
        }
    }
}