import { Order } from '@/types/order.types';

export const mockOrders: Order[] = [
    {
        id: '1',
        hotelId: '1',
        hotelName: 'Hôtel Teranga',
        orderNumber: 'CMD-2024-001',
        status: 'delivered',
        services: [
            {
                service: 'blanchisserie',
                items: [
                    { type: 'drap', quantity: 12 },
                    { type: 'taie', quantity: 24 },
                    { type: 'serviette', quantity: 30 },
                ],
            },
            {
                service: 'nettoyage',
                items: [{ type: 'rideau', quantity: 4 }],
            },
        ],
        actualWeight: 28,
        instructions: 'Linge délicat, traitement spécial requis',
        collectionDate: '2024-01-15T09:00:00Z',
        deliveryDate: '2024-01-17T14:00:00Z',
        createdAt: '2024-01-14T10:30:00Z',
        updatedAt: '2024-01-17T14:00:00Z',
    },
    {
        id: '2',
        hotelId: '1',
        hotelName: 'Hôtel Teranga',
        orderNumber: 'CMD-2024-002',
        status: 'in_progress',
        services: [
            {
                service: 'blanchisserie',
                items: [
                    { type: 'drap', quantity: 8 },
                    { type: 'serviette', quantity: 16 },
                ],
            },
        ],
        actualWeight: 16,
        collectionDate: '2024-01-20T10:00:00Z',
        createdAt: '2024-01-19T08:15:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
    },
    {
        id: '3',
        hotelId: '1',
        hotelName: 'Hôtel Teranga',
        orderNumber: 'CMD-2024-003',
        status: 'confirmed',
        services: [
            {
                service: 'nettoyage',
                items: [
                    { type: 'couverture', quantity: 6 },
                    { type: 'rideau', quantity: 2 },
                ],
            },
            {
                service: 'blanchisserie',
                items: [
                    { type: 'drap', quantity: 20 },
                    { type: 'nappe', quantity: 8 },
                    { type: 'serviette', quantity: 24 },
                ],
            },
        ],
        instructions: 'Collecte urgente',
        collectionDate: '2024-01-22T08:00:00Z',
        createdAt: '2024-01-21T14:20:00Z',
        updatedAt: '2024-01-21T14:20:00Z',
    },
    {
        id: '4',
        hotelId: '2',
        hotelName: 'Radisson Blu',
        orderNumber: 'CMD-2024-004',
        status: 'pending',
        services: [
            {
                service: 'blanchisserie',
                items: [
                    { type: 'drap', quantity: 10 },
                    { type: 'serviette', quantity: 20 },
                ],
            },
        ],
        instructions: 'Draps et serviettes uniquement',
        collectionDate: '2024-01-23T09:00:00Z',
        createdAt: '2024-01-22T11:00:00Z',
        updatedAt: '2024-01-22T11:00:00Z',
    },
    {
        id: '5',
        hotelId: '1',
        hotelName: 'Hôtel Teranga',
        orderNumber: 'CMD-2024-005',
        status: 'collected',
        services: [
            {
                service: 'aqua_clean',
                items: [
                    { type: 'tapis', quantity: 2 },
                    { type: 'housse', quantity: 4 },
                ],
            },
        ],
        actualWeight: 32,
        collectionDate: '2024-01-18T10:00:00Z',
        createdAt: '2024-01-17T16:45:00Z',
        updatedAt: '2024-01-18T10:30:00Z',
    },
    {
        id: '6',
        hotelId: '1',
        hotelName: 'Hôtel Teranga',
        orderNumber: 'CMD-2024-006',
        status: 'ready',
        services: [
            {
                service: 'nettoyage',
                items: [{ type: 'peignoir', quantity: 6 }],
            },
        ],
        actualWeight: 11,
        collectionDate: '2024-01-16T09:00:00Z',
        createdAt: '2024-01-15T13:20:00Z',
        updatedAt: '2024-01-18T16:00:00Z',
    },
];

export const getOrdersByStatus = (status: Order['status']) => {
    return mockOrders.filter(order => order.status === status);
};

export const getOrdersByHotel = (hotelId: string) => {
    return mockOrders.filter(order => order.hotelId === hotelId);
};

export const getOrderById = (id: string) => {
    return mockOrders.find(order => order.id === id);
};
