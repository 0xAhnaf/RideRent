import { apiFetch, getCsrfCookie } from "../../../api";

export const AMBULANCE_API = "/api/admin/ambulance";

export async function ambulanceRequest(path, options = {}) {
  if (options.method && options.method !== "GET") {
    await getCsrfCookie();
  }

  const response = await apiFetch(`${AMBULANCE_API}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    const validationMessage = data.errors ? Object.values(data.errors).flat()[0] : null;
    throw new Error(validationMessage || data.message || "Unable to load ambulance records.");
  }

  return data;
}
