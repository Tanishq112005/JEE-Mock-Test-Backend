"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailRoutes = void 0;
const express_1 = require("express");
const emailController_1 = require("../controllers/emailController");
const router = (0, express_1.Router)();
router.post("/add", emailController_1.emailController.addEmail);
exports.emailRoutes = router;
