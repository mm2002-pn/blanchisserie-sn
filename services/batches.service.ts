import { api } from './api';

export interface ApiBatchContributor {
  id: string;
  orderId: string;
  pieces: number;
  weight: number;
  order?: { orderNumber: string; client?: { name: string } };
}

export interface ApiBatch {
  id: string;
  code: string;
  stage: 'lavage' | 'sechage' | 'calandrage' | 'repassage' | 'finition';
  status: 'suggested' | 'validated' | 'in_progress' | 'completed' | 'cancelled';
  priority: boolean;
  machineId: string;
  machine?: { reference: string; brand: string; model: string };
  programId: string | null;
  program?: { code: string; name: string };
  capacity: number;
  currentLoad: number; // grammes
  utilization: number;
  estimatedDurationMin: number;
  startedAt: string | null;
  estimatedEndAt: string | null;
  completedAt: string | null;
  suggestedByAi: boolean;
  aiRationale: string | null;
  createdAt: string;
  contributors: ApiBatchContributor[];
}

export type Stage = ApiBatch['stage'];

const STAGE_LABEL: Record<Stage, string> = {
  lavage: 'Lavage',
  sechage: 'Séchage',
  calandrage: 'Calandrage',
  repassage: 'Repassage',
  finition: 'Finition',
};

export interface UiBatch {
  id: string;
  code: string;
  stage: Stage;
  stageLabel: string;
  status: ApiBatch['status'];
  machine: string;
  program: string;
  capacityKg: number;
  loadKg: number;
  utilization: number;
  contributors: { client: string; kg: number; pieces: number; tagPrefix: string }[];
  startedAt: string | null;
  estimatedEndAt: string | null;
  durationMin: number;
  priority: boolean;
  suggested: boolean;
  aiRationale: string | null;
}

export function mapApiBatchToUi(b: ApiBatch): UiBatch {
  return {
    id: b.id,
    code: b.code,
    stage: b.stage,
    stageLabel: STAGE_LABEL[b.stage],
    status: b.status,
    machine: b.machine ? `${b.machine.brand} ${b.machine.model}` : '—',
    program: b.program ? `${b.program.code} · ${b.program.name}` : '—',
    capacityKg: b.capacity,
    loadKg: Math.round(b.currentLoad / 100) / 10,
    utilization: b.utilization,
    contributors: b.contributors.map((c) => ({
      client: c.order?.client?.name ?? '—',
      kg: Math.round(c.weight / 100) / 10,
      pieces: c.pieces,
      tagPrefix: c.order?.orderNumber ?? c.orderId.slice(0, 8),
    })),
    startedAt: b.startedAt,
    estimatedEndAt: b.estimatedEndAt,
    durationMin: b.estimatedDurationMin,
    priority: b.priority,
    suggested: b.status === 'suggested',
    aiRationale: b.aiRationale,
  };
}

export async function listBatches(stage?: Stage) {
  const { data } = await api.get<{ items: ApiBatch[] }>('/batches', {
    params: stage ? { stage } : {},
  });
  return data.items.map(mapApiBatchToUi);
}

export async function startBatch(id: string) {
  const { data } = await api.post<ApiBatch>(`/batches/${id}/start`);
  return mapApiBatchToUi(data);
}

export interface CompleteBatchInput {
  actualWaterL?: number;
  actualEnergyKwh?: number;
  notes?: string;
}

export async function completeBatch(id: string, dto: CompleteBatchInput = {}) {
  const { data } = await api.post<ApiBatch>(`/batches/${id}/complete`, dto);
  return mapApiBatchToUi(data);
}
