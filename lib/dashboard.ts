export interface DashboardInfo {
    icon?: string
    identifier: string
    name: string
    provider: string
    sections: Array<DashboardSectionInfo>
}

export class Dashboard {
    icon?: string
    identifier: string
    name: string
    provider: string
    sections: Array<DashboardSection>

    constructor(dashboardInfo: DashboardInfo) {
        this.icon = dashboardInfo.icon
        this.identifier = dashboardInfo.identifier
        this.name = dashboardInfo.name
        this.provider = dashboardInfo.provider
        this.sections = dashboardInfo.sections.map(
            sectionInfo => new DashboardSection(sectionInfo))
    }
}

export interface DashboardSectionInfo {
    type: string
    configuration: any
}

export class DashboardSection {
    type: string
    configuration: any

    constructor(sectionInfo: DashboardSectionInfo) {
        this.type = sectionInfo.type
        this.configuration = sectionInfo.configuration
    }
}