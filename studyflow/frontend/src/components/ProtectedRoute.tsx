import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/client";

export default function ProtectedRoute() {
  const { user, setUser } = useAuthStore();

  // Verify session is still valid on mount
  const { isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const data = await authApi.me();
      setUser(data);
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
