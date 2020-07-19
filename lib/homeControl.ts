import { AccessToken } from './auth/index.js'
import { User, UserInfo } from './auth/user.js'
import { Item } from './item.js'
import { Module } from './module.js'
import { EventBus } from './event.js'
import { uuidv4 } from './util.js'
import Panel from './panel.js'
import { Dashboard, DashboardInfo } from './dashboard.js'

export interface WSCommand {
    type: string
    id?: string
    [key: string]: any
}

export class HomeControl extends EventBus {
    connection!: WebSocket
    accessToken!: AccessToken
    apiUrl: string
    user!: User
    socket!: WebSocket
    items: Map<string, Item>
    modules: Map<string, Module>
    panels: Array<Panel>
    dashboards: Map<string, Dashboard>
    ready: boolean = false

    constructor(apiUrl: string) {
        super()
        this.apiUrl = apiUrl
        this.items = new Map
        this.modules = new Map
        this.panels = new Array
        this.dashboards = new Map
    }

    get wsUrl(): string {
        return `${this.apiUrl.replace(/^http/, 'ws')}/websocket`
    }

    async connect(accessToken: AccessToken) {
        this.accessToken = accessToken
        let readyPromise = this.waitForEvent('ready')
        this.socket = new WebSocket(this.wsUrl)
        this.socket.addEventListener('open', this.onWSOpen.bind(this))
        this.socket.addEventListener('message', this.onWSMessage.bind(this))
        this.socket.addEventListener('close', this.onWSClose.bind(this))
        await readyPromise
    }
    async onWSOpen() {
        console.log(`WebSocket connection opened`)
        await this.authenticate()

        await Promise.all([
            this.fetchItems(),
            this.fetchModules(),
            this.fetchPanels(),
            this.fetchDashboards()
        ])

        this.sendMessage({ type: 'watch_states' })
        this.addEventListener('event', async (event: any) => {
            if (event.event != 'state_change') return
            let item = this.items.get(event.item)
            if (!item) return
            await item.updateStates(event.changes)
        })
        this.sendMessage({ type: 'watch_status' })
        this.addEventListener('event', async (event: any) => {
            if (event.event != 'status_change') return
            let item = this.items.get(event.item)
            if (!item) return
            await item.updateStatus(event.status)
        })

        this.ready = true
        this.fireEvent('ready')
    }
    async onWSMessage(event: MessageEvent) {
        let data = JSON.parse(event.data)
        console.log("MESSAGE", data)
        if (data.type == 'reply') {
            this.fireEvent('reply', data)
        }
        if (data.event) {
            this.fireEvent('event', data)
        }
        this.fireEvent('message', data)
    }
    async onWSClose() {
        console.log('WebSocket closed')
        this.ready = false
        this.fireEvent('disconnect')
    }
    async authenticate() {
        let authResponse = await this.sendMessage({
            type: 'auth',
            token: this.accessToken.token
        })
        if (authResponse.data != 'authenticated') {
            console.log('Authentication failed')
            return
        }
        let userResponse = await this.sendMessage({
            type: 'current_user'
        })
        this.user = new User({
            identifier: userResponse.data.id,
            name: userResponse.data.name,
            owner: userResponse.data.owner,
            system_generated: userResponse.data.system_generated
        })
        console.log(`Authenticated as ${this.user.name}`)
    }
    sendMessage(data: WSCommand): Promise<any> {
        let id = data.id = data.id || uuidv4()

        let response = new Promise<any>((resolve: any) => {
            let callback = async (data: any) => {
                if (data.type == 'reply' && data.id == id) {
                    resolve(data)
                    this.removeEventListener('reply', callback)
                }
            }
            this.addEventListener('reply', callback)
        })
        this.socket.send(JSON.stringify(data))
        return response
    }
    async fetchItems() {
        let response = await this.sendMessage({ type: 'get_items' })
        for (let itemInfo of response.data) {
            let item = new Item(itemInfo, this)
            this.items.set(item.uniqueIdentifier, item)
        }
    }
    async fetchModules() {
        let response = await this.sendMessage({ type: 'get_modules' })
        for (let moduleInfo of response.data) {
            let mod = new Module(moduleInfo, this)
            this.modules.set(mod.name, mod)
        }
    }
    async fetchPanels() {
        let response = await this.sendMessage({ type: 'get_panels' })
        for (let panelInfo of response.data) {
            this.panels.push(new Panel(panelInfo))
        }
    }
    async fetchDashboards() {
        let response = await this.sendMessage({ type: 'dashboard:get_dashboards' })
        for (let dashboardInfo of Object.values(response.data.dashboards)) {
            let dashboard = new Dashboard(dashboardInfo as DashboardInfo)
            this.dashboards.set(dashboard.identifier, dashboard)
        }
    }
    async getUsers() {
        let response = await this.sendMessage({ type: 'get_users' })
        return (response.data as Array<UserInfo>).map(userInfo => new User(userInfo))
    }
    async restartCore() {
        await this.sendMessage({ type: 'core_restart' })
    }
    async shutdownCore() {
        await this.sendMessage({ type: 'core_shutdown' })
    }
}
