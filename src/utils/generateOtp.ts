import { randomInt } from "crypto";

export function random6digitnumber()  {
     const otp = randomInt(100000, 999999).toString();
     return otp ; 
}