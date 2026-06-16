import { api } from './api';
import type { Invoice, InvoiceStatus, PaymentMethod } from '@/types/invoice.types';

interface ApiInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: { id: string; name: string };
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  invoiceDate: string;
  dueDate: string;
  paidDate: string | null;
  subtotalFcfa: string;
  taxAmountFcfa: string;
  totalFcfa: string;
  paymentMethod: string | null;
  pdfUrl: string | null;
  lines?: { description: string; quantity: number; unitPriceFcfa: string; totalFcfa: string }[];
  createdAt: string;
}

const STATUS_MAP: Record<ApiInvoice['status'], InvoiceStatus> = {
  draft: 'pending',
  pending: 'pending',
  paid: 'paid',
  overdue: 'overdue',
  cancelled: 'cancelled',
};

const METHOD_MAP: Record<string, PaymentMethod | undefined> = {
  cash: 'cash',
  orange_money: 'transfer',
  wave: 'transfer',
  virement: 'transfer',
  cheque: 'cheque',
};

export function mapApiInvoice(i: ApiInvoice): Invoice {
  return {
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    hotelId: i.clientId,
    hotelName: i.client?.name ?? '',
    orderId: '',
    orderNumber: '',
    status: STATUS_MAP[i.status],
    items: (i.lines ?? []).map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: Number(l.unitPriceFcfa),
      total: Number(l.totalFcfa),
    })),
    subtotal: Number(i.subtotalFcfa),
    tax: Number(i.taxAmountFcfa),
    total: Number(i.totalFcfa),
    dueDate: i.dueDate,
    paidDate: i.paidDate ?? undefined,
    paymentMethod: i.paymentMethod ? METHOD_MAP[i.paymentMethod] : undefined,
    createdAt: i.createdAt,
  };
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export async function listInvoices(params: { clientId?: string; status?: string } = {}) {
  const { data } = await api.get<PageResult<ApiInvoice>>('/invoices', {
    params: { pageSize: 100, ...params },
  });
  return data.items.map(mapApiInvoice);
}
