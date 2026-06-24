import { Router } from "express";
import { redisController } from "../controllers/redisController";
import { developerRoleMiddleware } from "../middlewares/developerRole";
import { authMiddleware } from "../middlewares/auth";
// Import your admin middleware! Bahut zaruri hai!
// import { adminMiddleware } from "../middlewares/admin";

const router = Router();

// ==========================================
// ADMIN CONTROL PLANE ROUTES (Strictly Protected)
// ==========================================

// Route to scale Auth Ring
router.post(
  "/cluster/auth/add",
  authMiddleware,
  developerRoleMiddleware,
  redisController.addAuthNodes,
);

// Route to scale Dashboard Ring
router.post(
  "/cluster/dashboard/add",
  authMiddleware,
  developerRoleMiddleware,
  redisController.addDashboardNodes,
);

// Route to gracefully shutdown all Redis connections
router.post(
  "/cluster/shutdown",
  authMiddleware,
  developerRoleMiddleware,
  redisController.shutdownClusters,
);

// adminRedisRoutes file mein neeche yeh routes add karo:

// Route to GET all active nodes
router.get(
  "/cluster/nodes",
  authMiddleware,
  developerRoleMiddleware,
  redisController.getActiveNodes,
);

// Route to REMOVE node from Auth Ring
router.delete(
  "/cluster/auth/remove",
  authMiddleware,
  developerRoleMiddleware,
  redisController.removeAuthNode,
);

// Route to REMOVE node from Dashboard Ring
router.delete(
  "/cluster/dashboard/remove",
  authMiddleware,
  developerRoleMiddleware,
  redisController.removeDashboardNode,
);

// Route to flush specific key or all data from static Redis
router.post(
  "/cluster/flush",
  authMiddleware,
  developerRoleMiddleware,
  redisController.flushData,
);

export const adminRedisRoutes = router;
