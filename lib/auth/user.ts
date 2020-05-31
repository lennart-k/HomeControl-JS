export interface UserInfo {
    identifier: string
    name: string
    owner: boolean
    system_generated: boolean
}

export class User {
    identifier: string
    name: string
    owner: boolean
    systemGenerated: boolean

    constructor(userInfo: UserInfo) {
        this.identifier = userInfo.identifier
        this.name = userInfo.name
        this.owner = userInfo.owner
        this.systemGenerated = userInfo.system_generated
    }
}
