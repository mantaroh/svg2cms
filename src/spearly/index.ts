import open, { openApp, apps} from "open";
import { URLS } from "../utils/urls.js";

export class SpearlyAPIClient {
    private nonce = "";
    private token = "";
    private expire = "";

    constructor() {
        this.nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async login() {
        const loginUrl = URLS.login(this.nonce);
        try {
            await open(loginUrl, {wait: true});
            console.log(`Opening ${loginUrl}`);
        } catch (e) {
            console.error(`Failed to open browser: ${e}`);
            console.log(`Please open ${loginUrl} in your browser`);
        }

        console.log("Waiting for login...");

        let retry = 0;
        await new Promise((resolve) => {
            const retryFunc = async () => {
                if (++retry >= 30) {
                    console.error("Failed to login");
                    resolve(false);
                    return;
                }
                const token = await this.getToken();
                if (token) {
                    this.token = token.token;
                    this.expire = token.expire;
                    resolve(true);
                } else {
                    setTimeout(retryFunc, 1000);
                }
            }
            retryFunc();
        });
    }

    private async getToken(): Promise<{ token: string, expire: string} | null> {
        try {
            const tokenUrl = URLS.getToken(this.nonce);
            const response = await fetch(tokenUrl);
            if (response.status !== 200) {
                return null;
            }
            const responseJson = await response.json();
            return {
                token: responseJson.access_token,
                expire: responseJson.expires_in
            };
        } catch (e) {
            return null;
        }
    }
}
