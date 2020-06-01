import { LoginStepError } from './errors'

export interface LoginFlowResponse {
    id: string
    step_id: string
    type: string
    data: any
    auth_code?: string
    error?: string
    form_type: string
}


export class FlowStep {
    data: object
    stepType: string
    stepId?: string
    authCode?: string

    constructor(data: object, stepType: string, stepId: string, authCode?: string) {
        this.data = data
        this.stepType = stepType
        this.stepId = stepId
        this.authCode = authCode
    }

    static fromResponse(response: LoginFlowResponse) {
        return new FlowStep(
            response.data,
            response.form_type,
            response.step_id,
            response.auth_code)
    }
}


export class LoginFlow {
    apiEndpoint: string
    currentStep: FlowStep
    flowId: string

    constructor(apiEndpoint: string, flowId: string, currentStep: FlowStep) {
        this.apiEndpoint = apiEndpoint
        this.currentStep = currentStep
        this.flowId = flowId
    }
    async submitData(data: object) {
        let response = await fetch(`${this.apiEndpoint}/auth/login_flow/${this.flowId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        })
        let responseData: LoginFlowResponse = await response.json()
        if (responseData.error) {
            throw new LoginStepError(responseData.error)
        }
        this.currentStep = FlowStep.fromResponse(responseData)
    }
    get stepId() {
        return this.currentStep?.stepId
    }
    get authCode() {
        return this.currentStep?.authCode
    }
    static fromResponse(apiEndpoint: string, response: LoginFlowResponse) {
        return new LoginFlow(apiEndpoint, response.id, FlowStep.fromResponse(response))
    }
}
