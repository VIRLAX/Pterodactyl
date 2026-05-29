import { useState, useEffect, useCallback } from "react";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(localStorage.getItem("pterostore_token"));
  
  const { data: user, isLoading } = useGetCurrentUser({
    query: {
      enabled: !!token,
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    }
  });

  const login = useCallback((newToken: string, userData: any) => {
    localStorage.setItem("pterostore_token", newToken);
    localStorage.setItem("pterostore_user", JSON.stringify(userData));
    setToken(newToken);
    queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
  }, [queryClient]);

  const logout = useCallback(() => {
    localStorage.removeItem("pterostore_token");
    localStorage.removeItem("pterostore_user");
    setToken(null);
    queryClient.setQueryData(getGetCurrentUserQueryKey(), null);
  }, [queryClient]);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedToken = localStorage.getItem("pterostore_token");
      if (storedToken !== token) {
        setToken(storedToken);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [token]);

  return {
    user: user ?? null,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    token
  };
}