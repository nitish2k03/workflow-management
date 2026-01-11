import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middleware/validation.middleware";
import { authenticate } from "../middleware/auth.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "@workflow/shared";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);

router.post("/login", validate(loginSchema), authController.login);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken
);

router.get("/me", authenticate, authController.getMe);

export default router;
