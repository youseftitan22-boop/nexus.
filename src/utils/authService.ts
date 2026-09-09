/**
 * Role-Based Access Control (RBAC) & Local Session Service
 * Provides client-side role switching for Member, Physician, Trainer, and Specialist views.
 */

export type UserRole = 'MEMBER' | 'PHYSICIAN' | 'TRAINER' | 'CLINIC_SPECIALIST';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  authMethod: 'demo' | 'local';
  avatar?: string;
}

export interface RolePermissions {
  canViewTelemetry: boolean;
  canEditPlaybooks: boolean;
  canPrescribeInterventions: boolean;
  canInspectKinematics: boolean;
  canExportEHR: boolean;
  canViewDiagnosticFlags: boolean;
  title: string;
  badgeColor: string;
  badgeBg: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  MEMBER: {
    canViewTelemetry: true,
    canEditPlaybooks: true,
    canPrescribeInterventions: false,
    canInspectKinematics: false,
    canExportEHR: true,
    canViewDiagnosticFlags: false,
    title: 'Longevity Member',
    badgeColor: 'text-[#7FA894]',
    badgeBg: 'bg-[#7FA894]/20 border-[#7FA894]/30',
  },
  PHYSICIAN: {
    canViewTelemetry: true,
    canEditPlaybooks: true,
    canPrescribeInterventions: true,
    canInspectKinematics: true,
    canExportEHR: true,
    canViewDiagnosticFlags: true,
    title: 'Attending Longevity Physician',
    badgeColor: 'text-[#5B9BD5]',
    badgeBg: 'bg-[#5B9BD5]/20 border-[#5B9BD5]/30',
  },
  TRAINER: {
    canViewTelemetry: true,
    canEditPlaybooks: false,
    canPrescribeInterventions: false,
    canInspectKinematics: true,
    canExportEHR: false,
    canViewDiagnosticFlags: false,
    title: 'Kinematics & Performance Coach',
    badgeColor: 'text-[#E8B04B]',
    badgeBg: 'bg-[#E8B04B]/20 border-[#E8B04B]/30',
  },
  CLINIC_SPECIALIST: {
    canViewTelemetry: true,
    canEditPlaybooks: true,
    canPrescribeInterventions: true,
    canInspectKinematics: true,
    canExportEHR: true,
    canViewDiagnosticFlags: true,
    title: 'Biomarker Specialist',
    badgeColor: 'text-[#A084DC]',
    badgeBg: 'bg-[#A084DC]/20 border-[#A084DC]/30',
  },
};

const AUTH_USER_KEY = 'nexus_auth_user_v1';

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    this.loadPersistedSession();
  }

  private loadPersistedSession() {
    if (typeof window === 'undefined') return;
    try {
      const userStr = localStorage.getItem(AUTH_USER_KEY);
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
      } else {
        this.currentUser = {
          id: 'usr_member_01',
          email: 'youseftitan22@gmail.com',
          name: 'Yousef Titan',
          role: 'MEMBER',
          authMethod: 'local',
        };
      }
    } catch {
      this.currentUser = {
        id: 'usr_member_01',
        email: 'youseftitan22@gmail.com',
        name: 'Yousef Titan',
        role: 'MEMBER',
        authMethod: 'local',
      };
    }
  }

  public getCurrentUser(): AuthUser {
    return (
      this.currentUser || {
        id: 'usr_guest',
        email: 'guest@nexus.longevity',
        name: 'Guest Member',
        role: 'MEMBER',
        authMethod: 'demo',
      }
    );
  }

  public getPermissions(): RolePermissions {
    const role = this.getCurrentUser().role;
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.MEMBER;
  }

  public subscribe(cb: (user: AuthUser | null) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.currentUser));
  }

  public switchRole(newRole: UserRole): void {
    if (!this.currentUser) return;
    this.currentUser = {
      ...this.currentUser,
      role: newRole,
    };
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.currentUser));
    } catch {
      // safe fallback
    }
    this.notify();
  }

  public logout(): void {
    this.currentUser = {
      id: 'usr_guest',
      email: 'guest@nexus.longevity',
      name: 'Guest Member',
      role: 'MEMBER',
      authMethod: 'demo',
    };
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {
      // safe fallback
    }
    this.notify();
  }
}

export const authService = new AuthService();
