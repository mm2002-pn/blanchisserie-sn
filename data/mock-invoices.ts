import { Invoice } from '@/types/invoice.types';

export const mockInvoices: Invoice[] = [
    {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        hotelId: '1',
        hotelName: 'Hôtel Teranga',
        orderId: '1',
        orderNumber: 'CMD-2024-001',
        status: 'paid',
        items: [
            {
                description: 'Nettoyage à sec - 28 kg',
                quantity: 28,
                unitPrice: 1500,
                total: 42000,
            },
            {
                description: 'Repassage - 28 kg',
                quantity: 28,
                unitPrice: 800,
                total: 22400,
            },
        ],
        subtotal: 64400,
        tax: 11592,  // 18% TVA
        total: 75992,
        dueDate: '2024-01-31T23:59:59Z',
        paidDate: '2024-01-18T10:30:00Z',
        paymentMethod: 'transfer',
        createdAt: '2024-01-17T14:30:00Z',
    },
    {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        hotelId: '1',
        hotelName: 'Hôtel Teranga',
        orderId: '2',
        orderNumber: 'CMD-2024-002',
        status: 'pending',
        items: [
            {
                description: 'Lavage et pliage - 16 kg',
                quantity: 16,
                unitPrice: 1200,
                total: 19200,
            },
        ],
        subtotal: 19200,
        tax: 3456,  // 18% TVA
        total: 22656,
        dueDate: '2024-02-10T23:59:59Z',
        createdAt: '2024-01-20T11:00:00Z',
    },
    {
        id: '3',
        invoiceNumber: 'INV-2024-003',
        hotelId: '1',
        hotelName: 'Hôtel Teranga',
        orderId: '5',
        orderNumber: 'CMD-2024-005',
        status: 'pending',
        items: [
            {
                description: 'Repassage - 32 kg',
                quantity: 32,
                unitPrice: 800,
                total: 25600,
            },
            {
                description: 'Articles ménagers - 10 pièces',
                quantity: 10,
                unitPrice: 2000,
                total: 20000,
            },
        ],
        subtotal: 45600,
        tax: 8208,  // 18% TVA
        total: 53808,
        dueDate: '2024-02-15T23:59:59Z',
        createdAt: '2024-01-18T17:00:00Z',
    },
    {
        id: '4',
        invoiceNumber: 'INV-2024-004',
        hotelId: '2',
        hotelName: 'Radisson Blu',
        orderId: '4',
        orderNumber: 'CMD-2024-004',
        status: 'pending',
        items: [
            {
                description: 'Lavage et pliage - 20 kg (estimé)',
                quantity: 20,
                unitPrice: 1200,
                total: 24000,
            },
        ],
        subtotal: 24000,
        tax: 4320,  // 18% TVA
        total: 28320,
        dueDate: '2024-02-20T23:59:59Z',
        createdAt: '2024-01-22T12:00:00Z',
    },
    {
        id: '5',
        invoiceNumber: 'INV-2024-005',
        hotelId: '1',
        hotelName: 'Hôtel Teranga',
        orderId: '6',
        orderNumber: 'CMD-2024-006',
        status: 'paid',
        items: [
            {
                description: 'Nettoyage à sec - 11 kg',
                quantity: 11,
                unitPrice: 1500,
                total: 16500,
            },
        ],
        subtotal: 16500,
        tax: 2970,  // 18% TVA
        total: 19470,
        dueDate: '2024-02-05T23:59:59Z',
        paidDate: '2024-01-19T09:15:00Z',
        paymentMethod: 'card',
        createdAt: '2024-01-18T16:30:00Z',
    },
];

export const getInvoicesByHotel = (hotelId: string) => {
    return mockInvoices.filter(invoice => invoice.hotelId === hotelId);
};

export const getInvoicesByStatus = (status: Invoice['status']) => {
    return mockInvoices.filter(invoice => invoice.status === status);
};

export const getInvoiceById = (id: string) => {
    return mockInvoices.find(invoice => invoice.id === id);
};

export const getTotalPending = (hotelId: string) => {
    return mockInvoices
        .filter(invoice => invoice.hotelId === hotelId && invoice.status === 'pending')
        .reduce((sum, invoice) => sum + invoice.total, 0);
};
