import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  authService.setRefreshCookie(res, result.refreshToken);
  return sendSuccess(res, {
    status: 201,
    message: 'Registered successfully',
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  authService.setRefreshCookie(res, result.refreshToken);
  return sendSuccess(res, {
    message: 'Logged in successfully',
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[authService.REFRESH_COOKIE];
  const result = await authService.refresh(token);
  authService.setRefreshCookie(res, result.refreshToken);
  return sendSuccess(res, {
    message: 'Token refreshed',
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[authService.REFRESH_COOKIE];
  await authService.logout(token);
  authService.clearRefreshCookie(res);
  return sendSuccess(res, { message: 'Logged out successfully' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body.email);
  return sendSuccess(res, { message: data.message, data });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  return sendSuccess(res, { message: data.message, data: null });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return sendSuccess(res, { data: user });
});
