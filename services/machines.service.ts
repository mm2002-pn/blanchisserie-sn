import { api } from './api';

interface ApiMachine {
  id: string;
  reference: string;
  brand: string;
  model: string;
  kind: 'laveuse' | 'secheuse' | 'calandre' | 'presse' | 'secheuse_repasseuse';
  capacityKg: number;
  location: string | null;
  status: 'active' | 'maintenance' | 'out_of_service';
  lastMaintenanceAt: string | null;
}

const KIND_LABEL: Record<ApiMachine['kind'], 'Laveuse' | 'Sécheuse' | 'Calandre' | 'Presse'> = {
  laveuse: 'Laveuse',
  secheuse: 'Sécheuse',
  secheuse_repasseuse: 'Sécheuse',
  calandre: 'Calandre',
  presse: 'Presse',
};

const STATUS_LABEL: Record<ApiMachine['status'], 'Active' | 'Maintenance' | 'HS'> = {
  active: 'Active',
  maintenance: 'Maintenance',
  out_of_service: 'HS',
};

export interface UiMachine {
  id: string;
  ref: string;
  model: string;
  category: 'Laveuse' | 'Sécheuse' | 'Calandre' | 'Presse';
  status: 'Active' | 'Maintenance' | 'HS';
  loadKg: number; // calculé depuis batches en cours
  capacityKg: number;
  nextMaintenance: string;
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listMachinesUi(): Promise<UiMachine[]> {
  // Récupère machines + batches in_progress en parallèle pour calculer la charge actuelle
  const [{ data: m }, { data: b }] = await Promise.all([
    api.get<PageResult<ApiMachine>>('/machines', { params: { pageSize: 100 } }),
    api.get<{
      items: { machineId: string; currentLoad: number; status: string }[];
    }>('/batches'),
  ]);

  const loadByMachine = new Map<string, number>();
  for (const batch of b.items) {
    if (batch.status !== 'in_progress') continue;
    loadByMachine.set(
      batch.machineId,
      (loadByMachine.get(batch.machineId) ?? 0) + batch.currentLoad,
    );
  }

  return m.items.map((mc) => ({
    id: mc.id,
    ref: mc.reference,
    model: `${mc.brand} ${mc.model}`,
    category: KIND_LABEL[mc.kind],
    status: STATUS_LABEL[mc.status],
    loadKg: Math.round((loadByMachine.get(mc.id) ?? 0) / 1000),
    capacityKg: mc.capacityKg,
    nextMaintenance: mc.lastMaintenanceAt
      ? new Date(mc.lastMaintenanceAt).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
        })
      : 'à planifier',
  }));
}
