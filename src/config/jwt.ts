import {  JWT_ALGORITHM_ACCESS_TOKEN, JWT_ALGORITHM_REFERSH_TOKEN, JWT_SECRET_ACCESS_TOKEN, JWT_SECRET_REFERSH_TOKEN, JWT_TEMP_EXPIRES_IN_ACCESS_TOKEN, JWT_TEMP_EXPIRES_IN_REFERSH_TOKEN } from "./env";
import { Algorithm, Secret } from "jsonwebtoken";

// types for the expiry time 
type Unit =
| "Years"
| "Year"
| "Yrs"
| "Yr"
| "Y"
| "Weeks"
| "Week"
| "W"
| "Days"
| "Day"
| "D"
| "Hours"
| "Hour"
| "Hrs"
| "Hr"
| "H"
| "Minutes"
| "Minute"
| "Mins"
| "Min"
| "M"
| "Seconds"
| "Second"
| "Secs"
| "Sec"
| "s"
| "Milliseconds"
| "Millisecond"
| "Msecs"
| "Msec"
| "Ms";

type UnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;

type StringValue =
| `${number}`
| `${number}${UnitAnyCase}`
| `${number} ${UnitAnyCase}`;


// interface of the jwtconfig 
interface JwtConfigAcces {
    secret_key: Secret;      
    expiry_time: number  | StringValue ,       
    algorithm: Algorithm;
}

interface JwtConfigRefersh { 
    
    secret_key: Secret;          
    algorithm: Algorithm;
}


export const jwtConfigAccessToken: JwtConfigAcces = {
    secret_key: JWT_SECRET_ACCESS_TOKEN as Secret,            
    expiry_time: JWT_TEMP_EXPIRES_IN_ACCESS_TOKEN as number |  StringValue , 
    algorithm: JWT_ALGORITHM_ACCESS_TOKEN as Algorithm    
};

export const jwtConfigRefershToken : JwtConfigRefersh = {
    
    secret_key: JWT_SECRET_REFERSH_TOKEN as Secret,     
    algorithm: JWT_ALGORITHM_REFERSH_TOKEN as Algorithm    
}

