import { Router } from "express";

import GradebookController from "../controllers/gradebook.controller.js";

const gradebookController = new GradebookController();

const gradebookRoutes = Router();

gradebookRoutes.get("/csv/:course_id", gradebookController.listCSV);
gradebookRoutes.get("/json/:course_id", gradebookController.listJSON);

export default gradebookRoutes;
