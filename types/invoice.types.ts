export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'cheque';

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    hotelId: string;
    hotelName: string;
    orderId: string;
    orderNumber: string;
    status: InvoiceStatus;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    dueDate: string;        // ISO date
    paidDate?: string;      // ISO date
    paymentMethod?: PaymentMethod;
    createdAt: string;      // ISO date
}

export interface PaymentInfo {
    method: PaymentMethod;
    reference?: string;
    notes?: string;
}
