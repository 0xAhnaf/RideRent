/*
|--------------------------------------------------------------------------
| API Configuration
|--------------------------------------------------------------------------
|
| All requests from React to Laravel go through this file.
|
| Authentication is handled using Laravel Sanctum's HTTP-only session
| cookie. We DO NOT store authentication tokens or user data in
| localStorage/sessionStorage.
|
*/

const API_BASE_URL = "http://localhost:8000";

/*
|--------------------------------------------------------------------------
| Initialize CSRF Protection
|--------------------------------------------------------------------------
|
| Must be called before POST, PUT, PATCH, or DELETE requests that are
| protected by Laravel's CSRF middleware.
|
*/

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

/*
|--------------------------------------------------------------------------
| Read XSRF-TOKEN Cookie
|--------------------------------------------------------------------------
|
| Laravel sends an XSRF-TOKEN cookie.
|
| This cookie is NOT our authentication token.
| It is only used to protect requests against CSRF attacks.
|
*/

function getXsrfToken() {
  const cookies = document.cookie.split("; ");

  const xsrfCookie = cookies.find((cookie) =>
    cookie.startsWith("XSRF-TOKEN=")
  );

  if (!xsrfCookie) {
    return null;
  }

  return decodeURIComponent(
    xsrfCookie.substring("XSRF-TOKEN=".length)
  );
}

/*
|--------------------------------------------------------------------------
| Common API Request Function
|--------------------------------------------------------------------------
|
| Use apiFetch() instead of writing fetch() directly for API requests.
|
| Example:
|
| const response = await apiFetch("/api/user");
|
| Authentication cookies are automatically included.
|
*/

export async function apiFetch(endpoint, options = {}) {
  const xsrfToken = getXsrfToken();

  const isFormData = options.body instanceof FormData;

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,

    /*
    |--------------------------------------------------------------------------
    | Send Laravel Authentication Cookie
    |--------------------------------------------------------------------------
    */

    credentials: "include",

    headers: {
      Accept: "application/json",

      /*
      |--------------------------------------------------------------------------
      | Content-Type
      |--------------------------------------------------------------------------
      |
      | Don't manually set Content-Type for FormData.
      | The browser will set the correct multipart boundary.
      |
      */

      ...(isFormData
        ? {}
        : {
            "Content-Type": "application/json",
          }),

      /*
      |--------------------------------------------------------------------------
      | CSRF Header
      |--------------------------------------------------------------------------
      */

      ...(xsrfToken
        ? {
            "X-XSRF-TOKEN": xsrfToken,
          }
        : {}),

      /*
      |--------------------------------------------------------------------------
      | Allow Individual Requests To Add Headers
      |--------------------------------------------------------------------------
      */

      ...(options.headers || {}),
    },
  });
}