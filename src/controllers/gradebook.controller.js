import AppError, { handleError } from "../errors/AppError.js";

import { AbortController } from "node-abort-controller";

import listJSONGradebookService from "../services/gradebook/listJSONGradebook.service.js";
import listCSVGradebookService from "../services/gradebook/listCSVGradebook.service.js";

export default class GradebookController {
  async listCSV(req, res) {
    const controller = new AbortController();
    const signal = controller.signal;

    setTimeout(() => controller.abort(), 30000);

    try {
      const { course_id } = req.params;

      const gradebook = await listCSVGradebookService(course_id, signal);

      return res.status(200).send(gradebook);
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
      if (req.timedout) return;

      const { course_id } = req.params;

      const gradebook = await listJSONGradebookService(course_id, signal);

      return res.status(200).send(gradebook);
    } catch (error) {
      if (error instanceof AppError) {
        handleError(error, res);
      }
    }
  }
}
