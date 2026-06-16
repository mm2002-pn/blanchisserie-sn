import { api } from './api';

interface ApiUser {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'supervisor' | 'operator' | 'driver' | 'hotel';
  isActive: boolean;
  lastLoginAt: string | null;
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

const ROLE_TO_TEAM: Record<
  ApiUser['role'],
  'Lavage' | 'Séchage' | 'Calandre' | 'Logistique' | 'Qualité'
> = {
  admin: 'Qualité',
  manager: 'Qualité',
  supervisor: 'Qualité',
  operator: 'Lavage',
  driver: 'Logistique',
  hotel: 'Logistique',
};

const ROLE_LABEL: Record<ApiUser['role'], string> = {
  admin: 'Administrateur',
  manager: 'Responsable',
  supervisor: 'Superviseur',
  operator: 'Opérateur',
  driver: 'Chauffeur',
  hotel: 'Hôtel',
};

export interface UiTeamMember {
  id: string;
  name: string;
  role: string;
  team: 'Lavage' | 'Séchage' | 'Calandre' | 'Logistique' | 'Qualité';
  status: 'En poste' | 'Pause' | 'Absent' | 'Congé';
  shift: string;
  productivityPct: number;
}

/** Liste les utilisateurs staff (exclut les comptes hôtel). */
export async function listTeamMembers(): Promise<UiTeamMember[]> {
  const { data } = await api.get<PageResult<ApiUser>>('/users', {
    params: { pageSize: 200 },
  });
  return data.items
    .filter((u) => u.role !== 'hotel' && u.isActive)
    .map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      role: ROLE_LABEL[u.role],
      team: ROLE_TO_TEAM[u.role],
      status: u.lastLoginAt ? 'En poste' : 'Absent',
      shift: '07:00 – 15:00',
      productivityPct: 90, // pas exposé par API
    }));
}
