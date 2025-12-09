import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api/auth",
});

export const registerUser = (data) => API.post("/register", data);
export const verifyOtp = (data) => API.post("/verify-otp", data);
export const loginUser = (data) => API.post("/login", data);
export const getProfile = (token) =>
  API.get("/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
