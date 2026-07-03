import axios from "axios";

export const httpClient = axios.create({
  baseURL: "https://example.com/api",
  timeout: 10_000,
});
