import { UserType } from "@prisma/client";
import ApiError from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwtToken";
import { middleware } from "../repositories/middleware.db";

export const authMiddleware = async (req: any, res: any, next: any) => {
  const accessToken: string = req.headers["authorization"]?.split(" ")[1];

  if (!accessToken) {
    return res.status(401).json(new ApiError("Access token is required", ["Unauthorized"]));
  }

  try {
    const decoded = verifyAccessToken(accessToken);

    console.log("DEBUG [Middleware] Decoded Token:", decoded);

    
    if (!decoded || typeof decoded === "string" || !decoded.id) {
       throw new Error("Invalid Token Content");
    }
    
    req.user = decoded.id; 
    req.type  = decoded.type;
    
    if(decoded.type == UserType.Student){
      req.user = await middleware.gettingStudentId(req.user) ; 
    }
    console.log("DEBUG [Middleware] Set req.user to:", req.user);
    return next();

  } catch (err) {
 
    console.log("DEBUG [Middleware] Token Validation Failed");
    return res.status(401).json(
      new ApiError("Invalid or expired access token", ["Forbidden"])
    );
  }
};