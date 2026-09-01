import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiFetch, getCsrfCookie } from "../api";

/*
|--------------------------------------------------------------------------
| Authentication Context
|--------------------------------------------------------------------------
|
| This is the central place for authentication state.
|
| IMPORTANT:
|
| We do NOT use localStorage.
|
| Laravel keeps the actual authentication session in an HTTP-only cookie.
|
| React only keeps the current user in memory.
|
*/

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  /*
  |--------------------------------------------------------------------------
  | Current User
  |--------------------------------------------------------------------------
  |
  | null = nobody is logged in
  | object = authenticated user
  |
  */

  const [user, setUser] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Initial Authentication Check
  |--------------------------------------------------------------------------
  |
  | While React is checking Laravel's session, loading = true.
  |
  */

  const [loading, setLoading] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Get Current User
  |--------------------------------------------------------------------------
  |
  | Laravel determines whether the current browser session is authenticated.
  |
  */

  const fetchUser = async () => {
    try {
      const response = await apiFetch("/api/user");

      /*
      |--------------------------------------------------------------------------
      | Not Authenticated
      |--------------------------------------------------------------------------
      */

      if (response.status === 401) {
        setUser(null);
        return null;
      }

      /*
      |--------------------------------------------------------------------------
      | Other Server Error
      |--------------------------------------------------------------------------
      */

      if (!response.ok) {
        throw new Error(
          `Failed to fetch authenticated user: ${response.status}`
        );
      }

      const data = await response.json();

      setUser(data);

      return data;
    } catch (error) {
      console.error(
        "Unable to fetch authenticated user:",
        error
      );

      setUser(null);

      return null;
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Register
  |--------------------------------------------------------------------------
  |
  | The backend automatically creates every normal registration as:
  |
  | role = renter
  |
  | We NEVER send a role from React.
  |
  */

  const register = async ({
    name,
    email,
    phone,
    address,
    password,
    password_confirmation,
  }) => {
    /*
    |--------------------------------------------------------------------------
    | Initialize CSRF Protection
    |--------------------------------------------------------------------------
    */

    await getCsrfCookie();

    /*
    |--------------------------------------------------------------------------
    | Send Registration Request
    |--------------------------------------------------------------------------
    */

    const response = await apiFetch("/api/register", {
      method: "POST",

      body: JSON.stringify({
        name,
        email,
        phone,
        address,
        password,
        password_confirmation,
      }),
    });

    const data = await response.json();

    /*
    |--------------------------------------------------------------------------
    | Registration Failed
    |--------------------------------------------------------------------------
    */

    if (!response.ok) {
      return {
        success: false,
        data,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Registration Successful
    |--------------------------------------------------------------------------
    |
    | Laravel automatically logs the user in.
    |
    | We now ask Laravel who the authenticated user is.
    |
    */

    await fetchUser();

    return {
      success: true,
      data,
    };
  };

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  const login = async (email, password) => {
    /*
    |--------------------------------------------------------------------------
    | Initialize CSRF Protection
    |--------------------------------------------------------------------------
    */

    await getCsrfCookie();

    /*
    |--------------------------------------------------------------------------
    | Login Request
    |--------------------------------------------------------------------------
    */

    const response = await apiFetch("/api/login", {
      method: "POST",

      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    /*
    |--------------------------------------------------------------------------
    | Login Failed
    |--------------------------------------------------------------------------
    */

    if (!response.ok) {
      return {
        success: false,
        data,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Login Successful
    |--------------------------------------------------------------------------
    |
    | Laravel has created the authenticated session.
    |
    | No token is stored anywhere in React.
    |
    */

    setUser(data.user);

    return {
      success: true,
      data,
    };
  };

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const logout = async () => {
    /*
    |--------------------------------------------------------------------------
    | Make Sure CSRF Cookie Exists
    |--------------------------------------------------------------------------
    */

    await getCsrfCookie();

    /*
    |--------------------------------------------------------------------------
    | Logout Request
    |--------------------------------------------------------------------------
    */

    const response = await apiFetch("/api/logout", {
      method: "POST",
    });

    /*
    |--------------------------------------------------------------------------
    | Remove User From React Memory
    |--------------------------------------------------------------------------
    */

    if (response.ok) {
      setUser(null);
    }

    return response;
  };

  /*
  |--------------------------------------------------------------------------
  | Check Existing Session When React Starts
  |--------------------------------------------------------------------------
  |
  | When the page is refreshed:
  |
  | React memory is cleared.
  |
  | Laravel's HTTP-only cookie remains.
  |
  | Therefore we ask Laravel:
  |
  | "Who is logged in?"
  |
  */

  useEffect(() => {
    fetchUser();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Context Provider
  |--------------------------------------------------------------------------
  */

  return (
    <AuthContext.Provider
      value={{
        user,

        loading,

        isAuthenticated: !!user,

        register,

        login,

        logout,

        fetchUser,

        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| useAuth Hook
|--------------------------------------------------------------------------
|
| Any component can use:
|
| const { user, login, logout } = useAuth();
|
*/

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
}