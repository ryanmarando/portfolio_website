import express from "express";
import * as modelTrenderController from "../controllers/modelTrender.js";

const router = express.Router();

router.get("/", modelTrenderController.getModelData);
router.get("/getAll", modelTrenderController.getSavedModelData);
router.delete("/", modelTrenderController.deleteAllModelData);

export default router;
