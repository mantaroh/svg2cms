import open, { openApp, apps} from "open";
import { URLS } from "../utils/urls.js";
import { flattenDiagnosticMessageText } from "typescript";

export type ContentFieldDefinition = {
    fieldName: string,
    fieldType: string,
};

export type ContentTypeDefinition = {
    fields: ContentFieldDefinition[],
};

type TeamDetailResponse = {
    id: string;
    type: string;
    attributes: any;
}

type TeamResponse = {
    data: TeamDetailResponse[];
}

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
        const result = await new Promise((resolve) => {
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

        if (!result) {
            console.error("Failed to login");
            return;
        }
        console.log(`Login success. Token: ${this.token}`);
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

    async getTeams() {
        if (!this.token) {
            throw new Error("Not logged in");
        }
        try { 
            const teamsUrl = URLS.getALlTeams();
            const response = await fetch(teamsUrl, {
                headers: {
                    "Content-Type": "application/vnd.spearly.v2+json",
                    "Authorization": `Bearer ${this.token}`
                }
            });
            if (response.status !== 200) {
                // TODO: 固定実装
                return [{
                    id: "01FPVMMT46NED9BHXKR4C8D40J",
                    type: "team",
                    attributes: {
                        name: "test"
                    }
                }];
            }

            const responseJson = await response.json();
            return responseJson.data as TeamResponse["data"];

        } catch(e) {
            console.error(`Failed to get teams: ${e}`);
            return null;
        }
    }

    async createContentType(identifier: string, teamId: string): Promise<boolean> {
        if (!this.token) {
            throw new Error("Not logged in");
        }

        try {
            const conreateContentTypeUrl = URLS.createContentType();
            const response = await fetch(conreateContentTypeUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/vnd.spearly.v2+json",
                    "Authorization": `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    "content_type": {
                      "name": identifier,
                      "identifier": identifier,
                      "team_id": teamId
                    }
                })
            });
            console.log(response);

            return response.status === 201;
        } catch(e) {
            console.error(`Failed to create content type: ${e}`);
            return false;
        }
    }
}
