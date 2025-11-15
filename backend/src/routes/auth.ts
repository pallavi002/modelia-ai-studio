import { Router } from "express";
import { signupController, loginController } from "../controllers/authController";

export const authRouter = Router();

authRouter.post("/signup", signupController);
authRouter.post("/login", loginController);
