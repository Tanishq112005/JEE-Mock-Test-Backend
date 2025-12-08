// middleware for checking access token 

import ApiError from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwtToken";

export const authMiddleware = (req : any, res : any, next : any) => {
  const accessToken : string = req.headers["authorization"]?.split(" ")[1];

  if (!accessToken) {
    return res.status(401).json(
      new ApiError("Access token is required",  ["Unauthorized"])
    );
  }

  try {
    const decoded = verifyAccessToken(accessToken);

    req.user = decoded.id;
 

    return next();
  } catch (err) {
    return res.status(403).json(
      new ApiError("Invalid or expired access token", ["Forbidden"])
    );
  }
};