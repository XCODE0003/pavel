import {AuthKey} from "telegram/crypto/AuthKey.js";
import {MemorySession} from "telegram/sessions/index.js";

class Session extends MemorySession {
    constructor(dc, authKey) {
        super();
        this.dc = dc;
        this.authKey = authKey;
    }

    async load() {
        let authKey = this.authKey;
        if (authKey && typeof authKey === "object") {
            this._authKey = new AuthKey();
            if ("data" in authKey) {
                authKey = Buffer.from(authKey.data);
            }
            await this._authKey.setKey(authKey);
        }

        const dcId = this.dc;
        if (dcId) {
            this._dcId = dcId;
        }

        const port = 443;
        if (port) {
            this._port = port;
        }
        const serverAddress = ['149.154.175.55', '149.154.167.50',
            '149.154.175.100', '149.154.167.91',
            '91.108.56.170'][this.dc - 1];
        if (serverAddress) {
            this._serverAddress = serverAddress;
        }
    }
}

export default Session;