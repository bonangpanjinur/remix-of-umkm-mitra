// Auth and Role types

export type AppRole = 'admin' | 'buyer' | 'verifikator' | 'merchant' | 'courier' | 'admin_desa';

export interface UserWithRoles {
  id: string;
  email: string;
  roles: AppRole[];
}

export interface RoleConfig {
  role: AppRole;
  label: string;
  redirectPath: string;
  allowedPaths: string[];
}

// Role configurations with redirect paths and allowed routes
export const ROLE_CONFIGS: Record<AppRole, RoleConfig> = {
  admin: {
    role: 'admin',
    label: 'Admin Pusat',
    redirectPath: '/admin',
    allowedPaths: ['/admin', '/admin/*'],
  },
  admin_desa: {
    role: 'admin_desa',
    label: 'Admin Desa',
    redirectPath: '/desa',
    allowedPaths: ['/desa', '/desa/*'],
  },
  verifikator: {
    role: 'verifikator',
    label: 'Verifikator',
    redirectPath: '/verifikator',
    allowedPaths: ['/verifikator', '/verifikator/*'],
  },
  merchant: {
    role: 'merchant',
    label: 'Pedagang',
    redirectPath: '/merchant',
    allowedPaths: ['/merchant', '/merchant/*'],
  },
  courier: {
    role: 'courier',
    label: 'Kurir',
    redirectPath: '/courier',
    allowedPaths: ['/courier', '/courier/*'],
  },
  buyer: {
    role: 'buyer',
    label: 'Pembeli',
    redirectPath: '/',
    allowedPaths: ['/', '/products', '/product/*', '/tourism', '/tourism/*', '/cart', '/checkout', '/orders', '/orders/*', '/account', '/explore', '/search'],
  },
};

// Priority order for role-based redirect (higher priority roles redirect first)
export const ROLE_PRIORITY: AppRole[] = ['admin', 'admin_desa', 'verifikator', 'merchant', 'courier', 'buyer'];

export function getRedirectPathForRoles(roles: AppRole[]): string {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) {
      return ROLE_CONFIGS[role].redirectPath;
    }
  }
  return '/';
}

export function canAccessPath(roles: AppRole[], path: string): boolean {
  // Buyer routes are always accessible to authenticated users
  const buyerPaths = ROLE_CONFIGS.buyer.allowedPaths;
  
  for (const allowedPath of buyerPaths) {
    if (matchPath(path, allowedPath)) return true;
  }
  
  // Check role-specific paths
  for (const role of roles) {
    const config = ROLE_CONFIGS[role];
    for (const allowedPath of config.allowedPaths) {
      if (matchPath(path, allowedPath)) return true;
    }
  }
  
  return false;
}

function matchPath(path: string, pattern: string): boolean {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2);
    return path === base || path.startsWith(base + '/');
  }
  return path === pattern;
}
