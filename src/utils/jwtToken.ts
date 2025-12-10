import jwt from "jsonwebtoken"

import { jwtPayload } from "../types/jwt.types";
import { jwtConfigAccessToken, jwtConfigRefershToken } from "../config/jwt";





// give the json web token 
function generateAccessToken(payload : jwtPayload){
    const options: jwt.SignOptions = {
        expiresIn: jwtConfigAccessToken.expiry_time,
        algorithm: jwtConfigAccessToken.algorithm
    };
    
    return jwt.sign(payload, jwtConfigAccessToken.secret_key, options);
    
}


// verify json web token 
function verifyAccessToken(token: string)  {
    try {
        const decoded = jwt.verify(token, jwtConfigAccessToken.secret_key);
        return decoded;
    } catch (err: any) {
        return err.message;
    }
}
 


// generating the refersh token 
export function generateRefershToken(payload : jwtPayload , expireTime : any){
     const options: jwt.SignOptions = {
        expiresIn: expireTime , 
        algorithm: jwtConfigRefershToken.algorithm
    };
    
    return jwt.sign(payload, jwtConfigRefershToken.secret_key, options);
    
}


// verifying the refersh token 

export async function verifiyingRefeshToken(token : string){
    try {
        const decoded = jwt.verify(token, jwtConfigRefershToken.secret_key);
        return decoded;
    } catch (err: any) {
        return err.message;
    }
}


export {
    generateAccessToken , 
    verifyAccessToken
}
