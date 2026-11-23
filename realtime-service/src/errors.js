const NAMES = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  500: "INTERNAL_SERVER_ERROR",
};

export function sendError(req, res, status, message) {
  res.status(status).json({
    timestamp: new Date().toISOString(),
    status,
    error: NAMES[status] ?? "ERROR",
    message,
    path: req.originalUrl.split("?")[0],
  });
}
