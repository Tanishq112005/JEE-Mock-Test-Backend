import redisManager from "../lib/redisManager"; // Path verify kar lena
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { RedisInstanceConfig } from "../types/redis.types";

export class RedisController {
  // 1. Auth/OTP Ring mein naye Redis Instances add karna
  public addAuthNodes = async (req: any, res: any) => {
    try {
      const { configs } = req.body;

      if (!configs || !Array.isArray(configs) || configs.length === 0) {
        return res
          .status(400)
          .json(
            new ApiError(
              "Please provide a valid array of Redis configurations.",
              400,
            ),
          );
      }

      console.log(
        `[Admin Control] Adding ${configs.length} new node(s) to Auth Ring...`,
      );
      await redisManager.addAuthInstances(configs);

      return res
        .status(200)
        .json(
          new ApiResponse(
            "Successfully added new Redis instances to the Auth Ring.",
          ),
        );
    } catch (err: any) {
      console.error("Error adding Auth Redis node:", err);
      return res
        .status(500)
        .json(new ApiError("Failed to add Auth Redis instances.", err));
    }
  };

  // 2. Dashboard/Test Data Ring mein naye Redis Instances add karna
  public addDashboardNodes = async (req: any, res: any) => {
    try {
      const { configs } = req.body;

      if (!configs || !Array.isArray(configs) || configs.length === 0) {
        return res
          .status(400)
          .json(
            new ApiError(
              "Please provide a valid array of Redis configurations.",
              400,
            ),
          );
      }

      console.log(
        `[Admin Control] Adding ${configs.length} new node(s) to Dashboard Ring...`,
      );
      await redisManager.addDashboardInstances(configs);

      return res
        .status(200)
        .json(
          new ApiResponse(
            "Successfully added new Redis instances to the Dashboard Ring.",
          ),
        );
    } catch (err: any) {
      console.error("Error adding Dashboard Redis node:", err);
      return res
        .status(500)
        .json(new ApiError("Failed to add Dashboard Redis instances.", err));
    }
  };

  // 3. System Shutdown (Emergency switch) - Optional but good to have
  public shutdownClusters = async (req: any, res: any) => {
    try {
      console.log(
        "[Admin Control] Emergency Shutdown initiated for all Redis Clusters.",
      );
      await redisManager.disconnectAll();

      return res
        .status(200)
        .json(
          new ApiResponse(
            "All Redis connections have been safely disconnected.",
          ),
        );
    } catch (err: any) {
      return res
        .status(500)
        .json(new ApiError("Failed to disconnect clusters.", err));
    }
  };

  // RedisController mein yeh 3 naye methods add karo:

  // 4. Get all Active Redis Nodes
  public getActiveNodes = async (req: any, res: any) => {
    try {
      const nodes = redisManager.getActiveClusters();
      return res
        .status(200)
        .json(
          new ApiResponse("Successfully fetched active Redis clusters.", nodes),
        );
    } catch (err: any) {
      console.error("Error fetching Redis nodes:", err);
      return res
        .status(500)
        .json(new ApiError("Failed to fetch active nodes.", err));
    }
  };

  // 5. Remove Node from Auth Ring
  public removeAuthNode = async (req: any, res: any) => {
    try {
      const { host, port } = req.body;
      if (!host || !port) {
        return res
          .status(400)
          .json(new ApiError("Host and port are required.", 400));
      }

      const isRemoved = await redisManager.removeAuthInstance(
        host,
        Number(port),
      );

      if (isRemoved) {
        return res
          .status(200)
          .json(
            new ApiResponse(
              `Successfully removed ${host}:${port} from Auth Ring.`,
            ),
          );
      } else {
        return res
          .status(404)
          .json(new ApiError("Node not found in Auth Ring.", 404));
      }
    } catch (err: any) {
      console.error("Error removing Auth Redis node:", err);
      return res
        .status(500)
        .json(new ApiError("Failed to remove Auth node.", err));
    }
  };

  // 6. Remove Node from Dashboard Ring
  public removeDashboardNode = async (req: any, res: any) => {
    try {
      const { host, port } = req.body;
      if (!host || !port) {
        return res
          .status(400)
          .json(new ApiError("Host and port are required.", 400));
      }

      const isRemoved = await redisManager.removeDashboardInstance(
        host,
        Number(port),
      );

      if (isRemoved) {
        return res
          .status(200)
          .json(
            new ApiResponse(
              `Successfully removed ${host}:${port} from Dashboard Ring.`,
            ),
          );
      } else {
        return res
          .status(404)
          .json(new ApiError("Node not found in Dashboard Ring.", 404));
      }
    } catch (err: any) {
      console.error("Error removing Dashboard Redis node:", err);
      return res
        .status(500)
        .json(new ApiError("Failed to remove Dashboard node.", err));
    }
  };
}

export const redisController = new RedisController();
