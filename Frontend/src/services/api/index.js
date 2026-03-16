/**
 * API layer – auth connected to new backend; rest stubbed for UI compatibility.
 */

import apiClient from "./axios.js";
import { API_ENDPOINTS } from "./config.js";
import * as authService from "./auth.js";

const stub = () =>
  Promise.resolve({
    data: { success: false, message: "Backend not connected", data: null },
    status: 200,
    statusText: "OK",
    headers: {},
    config: {},
  });

const createStubAPI = () =>
  new Proxy(
    {},
    {
      get(_, prop) {
        return () => stub();
      },
    },
  );

export default apiClient;
export { API_ENDPOINTS };

// Stub for non-auth endpoints so we don't hit backend for unimplemented routes (avoids 404s and extra calls).
// Auth is done via authAPI/authService which use apiClient directly.
const emptyDataStub = () =>
  Promise.resolve({
    data: { success: false, data: null },
    status: 200,
    statusText: "OK",
    headers: {},
    config: {},
  });

export const api = {
  get: (_url, _config) => emptyDataStub(),
  post: (_url, _data, _config) => emptyDataStub(),
  put: (_url, _data, _config) => emptyDataStub(),
  patch: (_url, _data, _config) => emptyDataStub(),
  delete: (_url, _config) => emptyDataStub(),
};

/** Auth API – user OTP + admin login via new backend */
export const authAPI = {
  sendOTP: (phone, _purpose = "login", _email = null) => {
    if (!phone) return Promise.reject(new Error("Phone is required"));
    return authService.requestUserOtp(phone);
  },
  verifyOTP: (phone, otp, _purpose, _name, _email, _role, _password, _referralCode) => {
    if (!phone || !otp) return Promise.reject(new Error("Phone and OTP are required"));
    return authService.verifyUserOtp(phone, otp);
  },
  getCurrentUser: () => authService.getMe(),
  refreshToken: (token) => authService.refreshToken(token),
  logout: (refreshToken) => {
    // If caller didn't pass refreshToken, use stored user refresh token.
    const token =
      refreshToken ||
      (typeof localStorage !== "undefined" ? localStorage.getItem("user_refreshToken") : null);
    return authService.logout(token);
  },
};

/** Admin API – login via new backend */
export const adminAPI = {
  login: (email, password) => authService.adminLogin(email, password),
  getCurrentAdmin: () => authService.getMe(),
  logout: (refreshToken) => {
    const token =
      refreshToken ||
      (typeof localStorage !== "undefined" ? localStorage.getItem("admin_refreshToken") : null);
    return authService.logout(token);
  },
};

export const userAPI = createStubAPI();
export const locationAPI = createStubAPI();
export const zoneAPI = createStubAPI();
export const restaurantAPI = createStubAPI();
export const deliveryAPI = createStubAPI();
export const uploadAPI = createStubAPI();
export const orderAPI = createStubAPI();
export const diningAPI = createStubAPI();
export const heroBannerAPI = createStubAPI();
export const publicAPI = createStubAPI();
