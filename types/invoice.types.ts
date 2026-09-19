export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'cheque';

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    /** Commande d'origine de cette ligne (une facture peut couvrir plusieurs commandes). */
    orderId?: string;
    orderNumber?: string;
    /** Poids réel pesé en usine pour cette ligne (grammes). */
    weightGrams?: number;
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
    /** URL relative du PDF déjà généré côté back-office (null si pas encore généré). */
    pdfUrl?: string | null;
}

export interface PaymentInfo {
    method: PaymentMethod;
    reference?: string;
    notes?: string;
}
