
const createAccountAPIUrl = (path: string) => {
    return `${process.env.SPEARLY_ACCOUNT_SERVER}/${path}`;
}

const createAuthAPIUrl = (path: string) => {
    return `${process.env.SPEARLY_AUTH_API_SERVER}/${path}`;
}

const createCMSAPIUrl = (path: string) => {
    return `${process.env.SPEARLY_CMS_API_SERVER}/${path}`;
}

export const URLS = {
    login: (nonce: string) => {
        return createAccountAPIUrl("login") + `?nonce=${nonce}`;
    },
    getToken: (nonce: string) => {
        return createAuthAPIUrl("oauth/token") + `?nonce=${nonce}`;
    }
}