const API_BASE_URL = "http://localhost:8000";

export async function getCsrfCookie() {
  const response = await fetch(
    `${API_BASE_URL}/sanctum/csrf-cookie`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to initialize CSRF protection.");
  }
}

function getXsrfToken() {
  const cookies = document.cookie.split("; ");

  const xsrfCookie = cookies.find((cookie) =>
    cookie.startsWith("XSRF-TOKEN=")
  );

  if (!xsrfCookie) {
    return null;
  }

  return decodeURIComponent(xsrfCookie.split("=")[1]);
}

export async function apiFetch(endpoint, options = {}) {
  const xsrfToken = getXsrfToken();

  const isFormData = options.body instanceof FormData;

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,

    credentials: "include",

    headers: {
      Accept: "application/json",

      // Only use JSON Content-Type when NOT sending FormData
      ...(isFormData
        ? {}
        : {
            "Content-Type": "application/json",
          }),

      ...(xsrfToken && {
        "X-XSRF-TOKEN": xsrfToken,
      }),

      ...(options.headers || {}),
    },
  });
}