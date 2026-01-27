import ApiError from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwtToken";

export const authMiddleware = (req: any, res: any, next: any) => {
  const accessToken: string = req.headers["authorization"]?.split(" ")[1];

  if (!accessToken) {
    return res.status(401).json(new ApiError("Access token is required", ["Unauthorized"]));
  }

  try {
    const decoded = verifyAccessToken(accessToken);

    console.log("DEBUG [Middleware] Decoded Token:", decoded);

    // --- FIX START ---
    // If verifyAccessToken returns a string (like "jwt expired") or null, reject it.
    if (!decoded || typeof decoded === "string" || !decoded.id) {
       throw new Error("Invalid Token Content");
    }
    // --- FIX END ---

    // Now we know decoded is a valid object
    req.user = decoded.id; 
    req.type = decoded.type;

    console.log("DEBUG [Middleware] Set req.user to:", req.user);
    return next();

  } catch (err) {
    // This catch block will now handle "jwt expired" and "Invalid Token Content"
    console.log("DEBUG [Middleware] Token Validation Failed");
    return res.status(401).json(
      new ApiError("Invalid or expired access token", ["Forbidden"])
    );
  }
};