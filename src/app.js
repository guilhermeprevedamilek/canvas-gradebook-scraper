import timeout from "connect-timeout";
import express, { json } from "express";

import gradebookRoutes from "./routes/gradebook.routes.js";
import submittedAssignmentsRoutes from "./routes/submittedAssignments.routes.js";

const app = express();

app.use(timeout("60s"));
app.use(json());

app.use((error, _, res, __) => {
  if (error instanceof Error) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

app.use("/gradebook", gradebookRoutes);
app.use("/submitted_assignments", submittedAssignmentsRoutes);

export default app;
