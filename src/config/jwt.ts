import { JWT_ALGORITHM, JWT_SECRET, JWT_TEMP_EXPIRES_IN } from "./env";
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
interface JwtConfig {
    secret_key: Secret;      
    expiry_time: number  | StringValue ,       
    algorithm: Algorithm;
}



export const jwtConfig: JwtConfig = {
    secret_key: JWT_SECRET as Secret,            
    expiry_time: JWT_TEMP_EXPIRES_IN as number |  StringValue , 
    algorithm: JWT_ALGORITHM as Algorithm       
};

