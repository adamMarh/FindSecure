import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Shield,
  X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, isStaff, loading, rolesLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingRedirect = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    // Wait for both session and roles to finish loading before deciding to redirect
    if (!loading && !rolesLoading) {
      // If there's an in-progress pending redirect, cancel it when user comes back
      if (user) {
        pendingRedirect.current?.cancel();
        pendingRedirect.current = null;

        // If user is present but not staff, redirect immediately
        if (!isStaff) {
          navigate('/login');
        }

        return;
      }

      // If user is null, verify with the auth server before navigating.
      // This retries a few times to avoid false positives when switching windows.
      pendingRedirect.current?.cancel();
      let cancelled = false;
      pendingRedirect.current = { cancel: () => { cancelled = true; } };

      (async () => {
        const attempts = 6;
        const delayMs = 150;
        for (let i = 0; i < attempts; i++) {
          if (cancelled) return;
          try {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.user) {
              // session still exists — cancel redirect
              pendingRedirect.current = null;
              return;
            }
          } catch (e) {
            // ignore and retry
          }

          if (i < attempts - 1) {
            await new Promise((res) => setTimeout(res, delayMs));
          }
        }

        if (!cancelled) {
          pendingRedirect.current = null;
          navigate('/login');
        }
      })();
    }

    return () => {
      pendingRedirect.current?.cancel();
      pendingRedirect.current = null;
    };
  }, [user, isStaff, loading, rolesLoading, navigate]);

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        <span className="font-display font-bold text-sm pl-2">fetching user roles</span>
      </div>
    );
  }

  if (!user || !isStaff) {
    return null;
  }

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
    { path: '/admin/inquiries', icon: Search, label: 'Matches' },  // ← Changed label to 'Matches'
    { path: '/admin/inventory', icon: Package, label: 'Inventory' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-lg">FindSecure</span>
              <span className="font-display font-bold text-sm"> admin</span>
            </Link>
            <button 
              className="lg:hidden p-1.5 hover:bg-sidebar-accent rounded"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-sidebar-foreground/60">Assistant</p>
              </div>
            </div>
            <Button 
              variant="ghost"
              size="sm" 
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-full px-4">
            <button 
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}