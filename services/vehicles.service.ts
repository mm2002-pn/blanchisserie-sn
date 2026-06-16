import { api } from './api';

export interface ApiVehicle {
  id: string;
  matricule: string;
  brand: string;
  model: string;
  capacityKg: number;
  fuelLevel: number;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  lastMaintenanceAt: string | null;
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listVehicles(): Promise<ApiVehicle[]> {
  const { data } = await api.get<PageResult<ApiVehicle>>('/vehicles', {
    params: { pageSize: 100 },
  });
  return data.items;
}
