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
            const checkingBannerCondition = await this.db.banner.findMany();
            return checkingBannerCondition;
        }
        catch (err) {
            throw err;
        }
    }
    // once the data entry is created then it remains same for every time 
    async creatingAndUpdatingBanner(inputData) {
        try {
            const bannerList = await this.db.banner.findMany();
            let existingBanner;
            for (let i = 0; i < bannerList.length; i++) {
                if (bannerList[i].id == inputData.id) {
                    existingBanner = bannerList[i];
                    break;
                }
            }
            if (!existingBanner && bannerList.length != 0) {
                throw "There was another banner in the list , please delete that first";
            }
            else if (!existingBanner && bannerList.length === 0) {
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
                        id: inputData.id
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
    async gettingAllBannerInDb() {
        try {
            const allBannerData = await this.db.banner.findMany();
            return allBannerData;
        }
        catch (err) {
            throw err;
        }
    }
    async deletingBanner(id) {
        try {
            await this.db.banner.delete({
                where: {
                    id: id
                }
            });
        }
        catch (err) {
            throw err;
        }
    }
}
;
exports.bannerDB = new Banner(database_1.database);
