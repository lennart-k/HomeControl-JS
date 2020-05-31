export class EventBus {
    eventListeners: Map<string, Set<CallableFunction>>

    constructor() {
        this.eventListeners = new Map
    }

    addEventListener(type: string, listener: CallableFunction) {
        if (!this.eventListeners.has(type)) {
            this.eventListeners.set(type, new Set)
        }
        this.eventListeners.get(type)!.add(listener)
    }
    removeEventListener(type: string, listener: CallableFunction) {
        if (!(type in this.eventListeners.keys())) {
            return
        }
        this.eventListeners.get(type)!.delete(listener)
    }
    fireEvent(type: string, data?: any) {
        let listeners = this.eventListeners.get(type)
        if (!listeners) return
        for (let listener of this.eventListeners.get(type)!) {
            listener(data)
        }
    }
    async waitForEvent(type: string) {
        return new Promise<any>(async (resolve) => {
            let callback = (event: any) => {
                resolve(event)
                this.removeEventListener(type, callback)
            }
            this.addEventListener(type, callback)
        })
    }
}
