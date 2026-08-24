import axios from "axios";

const API_URL =
  "https://invoice-backend-78hd.onrender.com";

const api = axios.create({
  baseURL: API_URL,
});

// ==========================================
// ATTACH JWT TOKEN TO EVERY REQUEST
// ==========================================

api.interceptors.request.use(
  (config) => {

    const token =
      sessionStorage.getItem("token");

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

    }

    return config;

  },
  (error) => {

    return Promise.reject(error);

  }
);

export default api;