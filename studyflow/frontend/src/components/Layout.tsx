import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/client";
import { useState } from "react";
import LoginModal from "./LoginModal";

const NAV_SECTIONS = [
  {
    label: "PRINCIPAL",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
      { to: "/calendario", label: "Calendário", icon: CalendarIcon },
      { to: "/sessao", label: "Sessão de Estudo", icon: SessionIcon },
    ],
  },
  {
    label: "CONTEÚDO",
    items: [
      { to: "/materiais", label: "Materiais", icon: MaterialsIcon },
      { to: "/tcc", label: "TCC", icon: TCCIcon },
      { to: "/pesquisar", label: "Pesquisar", icon: SearchIcon },
    ],
  },
  {
    label: "CONTA",
    items: [
      { to: "/perfil", label: "Meu Perfil", icon: ProfileIcon },
      { to: "/pagamentos", label: "Assinatura", icon: SubscriptionIcon },
    ],
  },
];

function DashboardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function SessionIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function MaterialsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function TCCIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}
function SubscriptionIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export default function Layout() {
  const { user, setUser, guestMode, setGuestMode } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      navigate("/login");
    },
  });

  const handleStartSession = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      navigate("/sessao");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className="w-52 flex flex-col flex-shrink-0"
        style={{ background: "linear-gradient(180deg, #0d1b35 0%, #0a1628 100%)" }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <h1 className="text-xl font-extrabold">
            <span className="text-white">Study</span>
            <span className="text-blue-400">Flow</span>
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-2 mb-2">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary-600 text-white shadow-lg"
                          : "text-white/60 hover:text-white hover:bg-white/8"
                      }`
                    }
                  >
                    <item.icon />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom user info */}
        <div className="px-3 py-4 border-t border-white/5">
          {user ? (
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                {localStorage.getItem(`studyflow_avatar_${user.id}`) ? (
                  <img
                    src={localStorage.getItem(`studyflow_avatar_${user.id}`)!}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.fullName?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.fullName}</p>
                <p className="text-white/40 text-[10px] truncate">{user.email}</p>
              </div>
              <button
                onClick={() => logoutMutation.mutate()}
                className="text-white/30 hover:text-white/70 transition-colors"
                title="Sair"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full text-center text-xs text-white/40 hover:text-white/70 px-2 py-1 transition-colors"
            >
              Fazer login
            </button>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div />
          <button
            onClick={handleStartSession}
            className="btn-primary flex items-center gap-2 py-2 text-sm rounded-lg"
          >
            <span>▷</span> Iniciar sessão
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setGuestMode(false);
            setShowLoginModal(false);
          }}
        />
      )}
    </div>
  );
}
