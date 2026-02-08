import { Router } from "express";
import { emailController } from "../controllers/emailController";

const router = Router();

router.post("/add" , emailController.addEmail) ; 


export const emailRoutes = router ; 