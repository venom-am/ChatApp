import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://chatapp-3-l8w6.onrender.com/api"
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("supabase_access_token");

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});
