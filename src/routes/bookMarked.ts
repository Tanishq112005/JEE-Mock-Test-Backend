import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { bookMarkedController } from "../controllers/bookMarkedController";


const router = Router() ; 

router.get('/get' , authMiddleware , bookMarkedController.get) ; 
router.post('/add' , authMiddleware , bookMarkedController.create) ; 
router.delete('/remove' , authMiddleware , bookMarkedController.remove) ;
router.post('/check' , authMiddleware , bookMarkedController.checking) ; 


export const bookMarkedRoutes = router ;