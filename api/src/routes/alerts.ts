import express from "express";
import * as alertsController from "../controllers/alerts.js";

const router = express.Router();

router.post("/", alertsController.getAlerts);
router.get("/", alertsController.getCountiesByState);

export default router;
