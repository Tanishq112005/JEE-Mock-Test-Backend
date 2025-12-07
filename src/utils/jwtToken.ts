import jwt from "jsonwebtoken"
import { jwtConfig } from "../config/jwt"
import { jwtPayload } from "../types/jwt.types";





// give the json web token 
function generateAccessToken(payload : jwtPayload){
    const options: jwt.SignOptions = {
        expiresIn: jwtConfig.expiry_time,
        algorithm: jwtConfig.algorithm
    };
    
    return jwt.sign(payload, jwtConfig.secret_key, options);
    
}


// verify json web token 
function verifyAccessToken(token: string) {
    try {
        const decoded = jwt.verify(token, jwtConfig.secret_key);
        return decoded;
    } catch (err: any) {
        return err.message;
    }
}



export {
    generateAccessToken , 
    verifyAccessToken
}
