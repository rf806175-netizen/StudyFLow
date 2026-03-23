import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/client";
import { useAuthStore } from "../store/auth";
import { useNavigate } from "react-router-dom";

export function useAuth() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const data = await authApi.me();
      setUser(data);
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user, // só roda se o usuário já estiver logado
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(["auth", "me"], data);
      navigate("/dashboard");
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setUser(data);
      queryClient.setQueryData(["auth", "me"], data);
      navigate("/dashboard");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      navigate("/login");
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
  };
}
