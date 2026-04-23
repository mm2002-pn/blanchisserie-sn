import { Order } from '@/types/order.types';

export const mockOrders: Order[] = [
    {
        id: '1',
        hotelId: '1',
        hotelName: 'Hôtel Teranga',
        orderNumber: 'CMD-2024-001',
        status: 'delivered',
        services: ['dry_wash', 'ironing'],
        volume: 'L',
        estimatedWeight: 25,
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
        services: ['washing_folding'],
        volume: 'M',
        estimatedWeight: 15,
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
        services: ['dry_wash', 'washing_folding', 'ironing'],
        volume: 'XL',
        estimatedWeight: 45,
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
        services: ['washing_folding'],
        volume: 'M',
        estimatedWeight: 20,
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
        services: ['ironing', 'household_items'],
        volume: 'L',
        estimatedWeight: 30,
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
        services: ['dry_wash'],
        volume: 'S',
        estimatedWeight: 10,
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
