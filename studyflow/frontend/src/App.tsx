import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CalendarioPage from "./pages/Schedule";
import SessaoPage from "./pages/Sessions";
import MaterialsPage from "./pages/Materials";
import SearchPage from "./pages/Search";
import ProfilePage from "./pages/Profile";
import TCCPage from "./pages/TCC";
import PaymentsPage from "./pages/Payments";

function GuestOrLoggedIn({ children }: { children: React.ReactNode }) {
  const { user, guestMode } = useAuthStore();
  if (!user && !guestMode) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages – redirect if already logged in */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" replace /> : <Register />}
        />

        {/* Main app – accessible to logged-in users AND guests */}
        <Route
          element={
            <GuestOrLoggedIn>
              <Layout />
            </GuestOrLoggedIn>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendario" element={<CalendarioPage />} />
          <Route path="/sessao" element={<SessaoPage />} />
          <Route path="/materiais" element={<MaterialsPage />} />
          <Route path="/pesquisar" element={<SearchPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/tcc" element={<TCCPage />} />
          <Route path="/pagamentos" element={<PaymentsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
