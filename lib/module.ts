import { HomeControl } from './homeControl.js'

export interface ModuleInfo {
    name: string
    path: string
    spec: {[key: string]: any}
}

export class Module {
    name: string
    path: string
    spec: {[key: string]: any}
    core: HomeControl

    constructor(moduleInfo: ModuleInfo, core: HomeControl) {
        this.name = moduleInfo.name
        this.path = moduleInfo.path
        this.spec = moduleInfo.spec
        this.core = core
    }
}
