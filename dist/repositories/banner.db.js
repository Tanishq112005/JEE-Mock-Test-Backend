"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bannerDB = void 0;
const database_1 = require("../lib/database");
class Banner {
    db;
    constructor(database) {
        this.db = database;
    }
    async currentBannerStatus() {
        try {
            const checkingBannerCondition = await this.db.banner.findFirst({
                where: {
                    id: 1
                }
            });
            return checkingBannerCondition;
        }
        catch (err) {
            throw err;
        }
    }
    // once the data entry is created then it remains same for every time 
    async creatingAndUpdatingBanner(inputData) {
        try {
            const existingBanner = await this.db.banner.findFirst({
                where: { id: 1 }
            });
            if (!existingBanner) {
                await this.db.banner.create({
                    data: {
                        isbanner: inputData.isBanner,
                        startTime: inputData.startTime ?? new Date(),
                        endTime: inputData.endTime ?? new Date(),
                        reason: inputData.reason,
                        type: inputData.type
                    }
                });
            }
            else {
                await this.db.banner.update({
                    where: {
                        id: 1
                    },
                    data: {
                        isbanner: inputData.isBanner,
                        startTime: inputData.startTime,
                        endTime: inputData.endTime,
                        reason: inputData.reason,
                        type: inputData.type
                    }
                });
            }
        }
        catch (err) {
            console.error("Failed to create banner:", err);
            throw err;
        }
    }
}
;
exports.bannerDB = new Banner(database_1.database);
