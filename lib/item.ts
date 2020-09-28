import { EventBus } from './event.js'
import { HomeControl } from './homeControl.js'

enum ItemStatus {
    Online = "online",
    Offline = "offline",
    Stopped = "stopped",
    WaitingForDependency = "waiting-for-dependency"
}

export interface ItemInfo {
    actions: Array<string>
    identifier: string
    module: string
    name: string
    unique_identifier: string
    type: string
    implements: Array<string>
    metadata: { [key: string]: any }
    status: ItemStatus
    states: { [key: string]: any }
}

export class Item extends EventBus {
    identifier: string
    uniqueIdentifier: string
    name?: string
    module: string
    type: string
    implements: Array<string>
    metadata: { [key: string]: any }
    states: Map<string, any>
    status: ItemStatus
    actions: Array<string>
    core: HomeControl

    constructor(itemInfo: ItemInfo, core: HomeControl) {
        super()
        this.identifier = itemInfo.identifier
        this.uniqueIdentifier = itemInfo.unique_identifier
        this.name = itemInfo.name
        this.status = itemInfo.status
        this.module = itemInfo.module
        this.type = itemInfo.type
        this.implements = itemInfo.implements
        this.metadata = itemInfo.metadata
        this.actions = itemInfo.actions
        this.states = new Map
        this.core = core
        for (let [state, value] of Object.entries(itemInfo.states)) {
            this.states.set(state, value)
        }
    }
    async executeAction(action: string, data?: { [key: string]: any }) {
        let result = await this.core.sendMessage({
            type: 'action',
            action: action,
            item: this.uniqueIdentifier,
            kwargs: data || {}
        })
        return result
    }
    async setState(state: string, value: any) {
        return await this.setStates({ [state]: value })
    }
    async setStates(changes: { [key: string]: any }) {
        let result = await this.core.sendMessage({
            type: 'set_states',
            item: this.uniqueIdentifier,
            changes
        })
        return result
    }
    updateStates(changes: { [key: string]: any }) {
        for (let [state, value] of Object.entries(changes)) {
            this.states.set(state, value)
        }
        this.fireEvent('state_change', changes)
    }
    updateStatus(status: ItemStatus) {
        this.status = status
        this.fireEvent('status_change', status)
    }
}
