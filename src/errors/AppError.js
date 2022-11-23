export default class AppError extends Error {
  statusCode;

  constructor(message, statusCode) {
    super();
    this.message = message;
    this.statusCode = statusCode;
  }
}

export const handleError = (error, res) => {
  const { message, statusCode } = error;

  return res.status(statusCode).json({
    status: "error",
    message,
    statusCode,
  });
};
