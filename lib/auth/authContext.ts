
import { LoginFlow, LoginFlowResponse } from './loginFlow.js'

export interface AccessTokenStorage {
    saveToken(token: AccessToken): Promise<void>
    loadToken(): Promise<AccessToken | null>
}

export class AccessTokenLocalStorage implements AccessTokenLocalStorage {
    key: string
    constructor(key: string = 'homecontrolAuth') {
        this.key = key
    }
    async saveToken(accessToken: AccessToken): Promise<void> {
        localStorage.setItem(this.key, JSON.stringify(accessToken))
    }
    async loadToken(): Promise<AccessToken | null> {
        let entry = localStorage.getItem(this.key)
        if (!entry) return null
        let data = JSON.parse(entry)
        return new AccessToken(
            data.token, new Date(data.expiration), data.refreshToken, data.user)
    }
}

export class AccessToken {
    token: string
    refreshToken: string
    expiration: Date
    user: string

    constructor(accessToken: string, expiration: Date, refreshToken: string, user: string) {
        this.token = accessToken
        this.expiration = expiration
        this.refreshToken = refreshToken
        this.user = user
    }
    static fromResponse({ access_token, expires_in, refresh_token, user }
        : { access_token: string, expires_in: string, refresh_token: string, user: string }): AccessToken {
        return new AccessToken(access_token, new Date(expires_in), refresh_token, user)
    }
}

export class AuthContext {
    apiEndpoint: string
    clientId: string
    tokenStorage: AccessTokenStorage

    constructor(
        apiEndpoint: string,
        clientId: string = document.location.origin,
        tokenStorage?: AccessTokenStorage) {
        this.apiEndpoint = apiEndpoint
        this.clientId = clientId
        this.tokenStorage = tokenStorage || new AccessTokenLocalStorage()
    }

    async listFlowTypes(): Promise<Array<string>> {
        let response = await fetch(
            `${this.apiEndpoint}/auth/login_flow_providers`)
        return await response.json()
    }

    async createLoginFlow(provider: string) {
        let response = await fetch(`${this.apiEndpoint}/auth/login_flow`, {
            method: 'POST',
            body: JSON.stringify({
                provider,
                client_id: this.clientId
            })
        })
        let data: LoginFlowResponse = await response.json()
        return LoginFlow.fromResponse(this.apiEndpoint, data)
    }
    async tokenFromCode(authCode: string) {
        let response = await fetch(`${this.apiEndpoint}/auth/token`, {
            method: 'POST',
            body: new URLSearchParams({
                grant_type: 'code',
                client_id: this.clientId,
                code: authCode
            }).toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        let data = await response.json()
        console.log(data)
        // TODO HANDLE EXCEPTIONS
        let token = AccessToken.fromResponse(data)
        await this.tokenStorage.saveToken(token)
        return token
    }
    async refreshAccessToken(accessToken: AccessToken) {
        let response = await fetch(`${this.apiEndpoint}/auth/token`, {
            method: 'POST',
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: this.clientId,
                refresh_token: accessToken.refreshToken
            }).toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        let data = await response.json()
        console.log(data)
        // TODO HANDLE EXCEPTIONS
        let token = AccessToken.fromResponse(data)
        await this.tokenStorage.saveToken(token)
        return token
    }
    async getAccessToken(): Promise<AccessToken | null> {
        let existingToken = await this.tokenStorage.loadToken()
        if (!existingToken) return null
        if (existingToken.expiration < new Date) return null
        if (!await this.validateAccessToken(existingToken)) return null
        return existingToken
    }
    async validateAccessToken(accessToken: AccessToken): Promise<boolean> {
        let response = await fetch(`${this.apiEndpoint}/auth/user_info`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`
            }
        })
        return response.status == 200
    }
}
