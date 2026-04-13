"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRedisRoutes = void 0;
const express_1 = require("express");
const redisController_1 = require("../controllers/redisController");
// Import your admin middleware! Bahut zaruri hai!
// import { adminMiddleware } from "../middlewares/admin"; 
const router = (0, express_1.Router)();
// ==========================================
// ADMIN CONTROL PLANE ROUTES (Strictly Protected)
// ==========================================
// Route to scale Auth Ring
router.post("/cluster/auth/add", 
// adminMiddleware,  <-- Isey zaroor enable karna production mein
redisController_1.redisController.addAuthNodes);
// Route to scale Dashboard Ring
router.post("/cluster/dashboard/add", 
// adminMiddleware, 
redisController_1.redisController.addDashboardNodes);
// Route to gracefully shutdown all Redis connections
router.post("/cluster/shutdown", 
// adminMiddleware,
redisController_1.redisController.shutdownClusters);
// adminRedisRoutes file mein neeche yeh routes add karo:
// Route to GET all active nodes
router.get("/cluster/nodes", 
// adminMiddleware,
redisController_1.redisController.getActiveNodes);
// Route to REMOVE node from Auth Ring
router.delete("/cluster/auth/remove", 
// adminMiddleware,
redisController_1.redisController.removeAuthNode);
// Route to REMOVE node from Dashboard Ring
router.delete("/cluster/dashboard/remove", 
// adminMiddleware,
redisController_1.redisController.removeDashboardNode);
exports.adminRedisRoutes = router;
