/**
 * Auth API – new backend (USER + ADMIN).
 * POST /api/v1/auth/user/request-otp
 * POST /api/v1/auth/user/verify-otp
 * POST /api/v1/auth/admin/login
 * POST /api/v1/auth/refresh-token
 * POST /api/v1/auth/logout
 * GET  /api/v1/auth/me
 */

import apiClient from "./axios.js";

const AUTH = {
  USER_REQUEST_OTP: "/auth/user/request-otp",
  USER_VERIFY_OTP: "/auth/user/verify-otp",
  ADMIN_LOGIN: "/auth/admin/login",
  REFRESH_TOKEN: "/auth/refresh-token",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",
};

/**
 * Normalize phone to digits only (8–15 chars for backend).
 * @param {string} phone - e.g. "+91 9876543210" or "9876543210"
 */
function normalizePhone(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  return digits.slice(-15);
}

/**
 * Request OTP for user login.
 * @param {string} phone - Phone (with or without country code)
 * @returns {Promise<{ data }>}
 */
export function requestUserOtp(phone) {
  const normalized = normalizePhone(phone);
  if (normalized.length < 8) {
    return Promise.reject(new Error("Phone must be at least 8 digits"));
  }
  return apiClient.post(AUTH.USER_REQUEST_OTP, { phone: normalized });
}

/**
 * Verify OTP and login (user).
 * Backend returns { accessToken, refreshToken, user }.
 * @param {string} phone - Same format as request
 * @param {string} otp - 4-digit OTP (backend default when USE_DEFAULT_OTP=true is 1234)
 */
export function verifyUserOtp(phone, otp) {
  const normalized = normalizePhone(phone);
  if (!normalized || !otp) {
    return Promise.reject(new Error("Phone and OTP are required"));
  }
  const otpStr = String(otp).replace(/\D/g, "").slice(0, 6);
  if (otpStr.length !== 4 && otpStr.length !== 6) {
    return Promise.reject(new Error("OTP must be 4 digits"));
  }
  return apiClient.post(AUTH.USER_VERIFY_OTP, { phone: normalized, otp: otpStr });
}

/**
 * Admin login (email + password).
 * Backend returns { accessToken, refreshToken, user } (key is "user" not "admin").
 */
export function adminLogin(email, password) {
  if (!email || !password) {
    return Promise.reject(new Error("Email and password are required"));
  }
  return apiClient.post(AUTH.ADMIN_LOGIN, { email: String(email).trim(), password: String(password) });
}

/**
 * Refresh access token.
 * @param {string} refreshToken
 * @returns {Promise<{ data }>} data.accessToken
 */
export function refreshToken(refreshToken) {
  if (!refreshToken) return Promise.reject(new Error("Refresh token is required"));
  return apiClient.post(AUTH.REFRESH_TOKEN, { refreshToken });
}

/**
 * Logout (invalidate refresh token).
 * @param {string} refreshToken
 */
export function logout(refreshToken) {
  if (!refreshToken) return Promise.resolve({ data: { success: true } });
  return apiClient.post(AUTH.LOGOUT, { refreshToken });
}

/**
 * Get current profile (requires Bearer).
 * @param {string} module - "user" | "admin" (determines which token is sent via interceptor from URL)
 */
export function getMe() {
  return apiClient.get(AUTH.ME);
}
