"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiResponse {
    // defing the type of the input 
    message;
    data;
    success;
    constructor(message = "Success Fully Get The Output", data = {}) {
        this.success = true;
        this.message = message;
        this.data = data;
    }
}
exports.default = ApiResponse;
