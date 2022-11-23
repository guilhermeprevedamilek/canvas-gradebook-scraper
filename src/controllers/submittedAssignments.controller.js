import AppError, { handleError } from "../errors/AppError.js";

import { AbortController } from "node-abort-controller";

import listCSVSubmittedAssignmentsService from "../services/submittedAssignments/listCSVSubmittedAssignments.service.js";
import listJSONSubmittedAssignmentsService from "../services/submittedAssignments/listJSONSubmittedAssignments.service.js";

export default class SubmittedAssignmentsController {
  async listCSV(req, res) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), 60000);

    try {
      const { course_id } = req.params;

      const submittedAssignments = await listCSVSubmittedAssignmentsService(
        course_id,
        signal
      );

      return res.status(200).send(submittedAssignments);
    } catch (error) {
      if (error instanceof AppError) {
        handleError(error, res);
      } else {
        console.error(error);
      }
    }
  }

  async listJSON(req, res) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), 30000);

    try {
      const { course_id } = req.params;

      const submittedAssignments = await listJSONSubmittedAssignmentsService(
        course_id,
        signal
      );

      return res.status(200).send(submittedAssignments);
    } catch (error) {
      if (error instanceof AppError) {
        handleError(error, res);
      } else {
        console.error(error);
      }
    }
  }
}
