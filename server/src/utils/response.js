export const sendSuccess = (res, { data = null, message = 'OK', status = 200, meta } = {}) => {
  const body = { success: true, data, message };
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
};

export const sendError = (res, { message = 'Error', status = 500, error = null, code } = {}) => {
  return res.status(status).json({
    success: false,
    data: null,
    message,
    error: error ?? message,
    ...(code ? { code } : {}),
  });
};
