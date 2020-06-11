export interface PanelInfo {
    name: string
    route: string
    iframe: string
    icon?: string
}


export default class Panel {
    name: string
    route: string
    iframe: string
    icon?: string

    constructor(panelInfo: PanelInfo) {
        this.name = panelInfo.name
        this.route = panelInfo.route
        this.iframe = panelInfo.iframe
        this.icon = panelInfo.icon
    }
}