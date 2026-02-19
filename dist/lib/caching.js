"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reddisConfigForCaching = void 0;
const redis_1 = require("@upstash/redis");
class ReddisConfigForCaching {
    reddis;
    constructor() {
        this.reddis = redis_1.Redis.fromEnv();
    }
    async settingData(key, data) {
        try {
            await this.reddis.set(key, data);
        }
        catch (err) {
            throw err;
        }
    }
    async gettingData(key) {
        try {
            const data = await this.reddis.get(key);
            return data;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.reddisConfigForCaching = new ReddisConfigForCaching();
