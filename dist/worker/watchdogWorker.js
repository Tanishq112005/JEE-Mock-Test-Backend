"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const testStatus_db_1 = require("../repositories/testStatus.db");
const env_1 = require("../config/env");
const CHECK_INTERVAL_MS = parseInt(env_1.WATCHDOG_INTERVAL || '60000');
const INACTIVITY_THRESHOLD_SEC = parseInt(env_1.WATCHDOG_INACTIVITY_THRESHOLD_SEC || '90');
const startWatchdogWorker = async () => {
    try {
        console.log("🐕 Starting Watchdog Worker Service...");
        const intervalId = setInterval(async () => {
            try {
                await testStatus_db_1.testStatus.autoPauseInactiveTests(INACTIVITY_THRESHOLD_SEC);
            }
            catch (err) {
                console.error("⚠️ Watchdog failed this cycle:", err);
            }
        }, CHECK_INTERVAL_MS);
        console.log(`✅ Watchdog active. Checking every ${CHECK_INTERVAL_MS / 1000}s for inactivity > ${INACTIVITY_THRESHOLD_SEC}s`);
        const app = (0, express_1.default)();
        const port = env_1.WATCHDOG_PORT || 3003;
        app.get("/health", (req, res) => {
            res.send("Watchdog is guarding 🐕");
        });
        app.listen(port, () => {
            console.log(`❤️ Watchdog Health check listening on port ${port}`);
        });
        process.on("SIGTERM", () => {
            console.log("🛑 SIGTERM received. Stopping Watchdog...");
            clearInterval(intervalId);
            process.exit(0);
        });
    }
    catch (error) {
        console.error("❌ Watchdog failed to start:", error);
        process.exit(1);
    }
};
startWatchdogWorker();
