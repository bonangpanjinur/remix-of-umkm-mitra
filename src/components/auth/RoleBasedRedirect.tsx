import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { getRedirectPathForRoles } from '@/types/auth';
import { Loader2 } from 'lucide-react';

interface RoleBasedRedirectProps {
  children: React.ReactNode;
}

/**
 * Component that redirects authenticated users to their role-specific dashboard
 * Used on pages like /auth where logged-in users shouldn't stay
 */
export function RoleBasedRedirect({ children }: RoleBasedRedirectProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();

  useEffect(() => {
    if (authLoading || rolesLoading) return;

    if (user && roles.length > 0) {
      // Get the intended destination or redirect based on role
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      const redirectPath = from || getRedirectPathForRoles(roles);
      navigate(redirectPath, { replace: true });
    }
  }, [user, roles, authLoading, rolesLoading, navigate, location]);

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is not logged in
  if (user) {
    return null;
  }

  return <>{children}</>;
}
