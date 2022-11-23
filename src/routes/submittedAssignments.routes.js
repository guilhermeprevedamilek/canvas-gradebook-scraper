import { Router } from "express";

import SubmittedAssignmentsController from "../controllers/submittedAssignments.controller.js";

const submittedAssignmentsController = new SubmittedAssignmentsController();

const submittedAssignmentsRoutes = Router();

submittedAssignmentsRoutes.get(
  "/csv/:course_id",
  submittedAssignmentsController.listCSV
);
submittedAssignmentsRoutes.get(
  "/json/:course_id",
  submittedAssignmentsController.listJSON
);

export default submittedAssignmentsRoutes;
