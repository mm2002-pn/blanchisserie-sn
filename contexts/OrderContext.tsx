import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, OrderFormData, OrderStatus } from '@/types/order.types';
import { mockOrders } from '@/data/mock-orders';

interface OrderContextType {
    orders: Order[];
    draftOrder: OrderFormData | null;
    isLoading: boolean;

    // CRUD Operations
    getOrders: () => Order[];
    getOrderById: (id: string) => Order | undefined;
    getOrdersByStatus: (status: OrderStatus) => Order[];
    createOrder: (orderData: OrderFormData) => Promise<Order>;
    updateOrder: (id: string, orderData: Partial<OrderFormData>) => Promise<Order>;
    cancelOrder: (id: string) => Promise<void>;

    // Draft management
    saveDraft: (draft: OrderFormData) => Promise<void>;
    clearDraft: () => Promise<void>;

    // Refresh data
    refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [draftOrder, setDraftOrder] = useState<OrderFormData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load orders and draft from storage on mount
    useEffect(() => {
        loadOrdersFromStorage();
    }, []);

    const loadOrdersFromStorage = async () => {
        try {
            const storedOrders = await AsyncStorage.getItem('orders');
            const storedDraft = await AsyncStorage.getItem('order_draft');

            if (storedOrders) {
                setOrders(JSON.parse(storedOrders));
            } else {
                // Initialize with mock data
                setOrders(mockOrders);
                await AsyncStorage.setItem('orders', JSON.stringify(mockOrders));
            }

            if (storedDraft) {
                setDraftOrder(JSON.parse(storedDraft));
            }
        } catch (error) {
            console.error('Error loading orders from storage:', error);
            // Fallback to mock data
            setOrders(mockOrders);
        } finally {
            setIsLoading(false);
        }
    };

    const saveOrdersToStorage = async (updatedOrders: Order[]) => {
        try {
            await AsyncStorage.setItem('orders', JSON.stringify(updatedOrders));
            setOrders(updatedOrders);
        } catch (error) {
            console.error('Error saving orders to storage:', error);
        }
    };

    const getOrders = () => {
        return orders;
    };

    const getOrderById = (id: string) => {
        return orders.find(order => order.id === id);
    };

    const getOrdersByStatus = (status: OrderStatus) => {
        return orders.filter(order => order.status === status);
    };

    const createOrder = async (orderData: OrderFormData): Promise<Order> => {
        setIsLoading(true);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get user from AsyncStorage
            const storedUser = await AsyncStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : null;

            if (!user) {
                throw new Error('Utilisateur non authentifié');
            }

            // Generate new order
            const newOrder: Order = {
                id: `${Date.now()}`,
                hotelId: user.hotelId || '1',
                hotelName: user.hotelName || 'Hôtel',
                orderNumber: `CMD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
                status: 'pending',
                services: orderData.services,
                instructions: orderData.instructions,
                photos: orderData.photos,
                collectionDate: orderData.collectionDate,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const updatedOrders = [newOrder, ...orders];
            await saveOrdersToStorage(updatedOrders);

            // Clear draft after successful creation
            await clearDraft();

            return newOrder;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateOrder = async (id: string, orderData: Partial<OrderFormData>): Promise<Order> => {
        setIsLoading(true);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const orderIndex = orders.findIndex(order => order.id === id);
            if (orderIndex === -1) {
                throw new Error('Commande non trouvée');
            }

            const existingOrder = orders[orderIndex];

            // Only allow updates for pending orders
            if (existingOrder.status !== 'pending') {
                throw new Error('Seules les commandes en attente peuvent être modifiées');
            }

            const updatedOrder: Order = {
                ...existingOrder,
                ...orderData,
                updatedAt: new Date().toISOString(),
            };

            const updatedOrders = [...orders];
            updatedOrders[orderIndex] = updatedOrder;
            await saveOrdersToStorage(updatedOrders);

            return updatedOrder;
        } catch (error) {
            console.error('Error updating order:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const cancelOrder = async (id: string): Promise<void> => {
        setIsLoading(true);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const orderIndex = orders.findIndex(order => order.id === id);
            if (orderIndex === -1) {
                throw new Error('Commande non trouvée');
            }

            const existingOrder = orders[orderIndex];

            // Only allow cancellation for pending or confirmed orders
            if (!['pending', 'confirmed'].includes(existingOrder.status)) {
                throw new Error('Cette commande ne peut plus être annulée');
            }

            const updatedOrder: Order = {
                ...existingOrder,
                status: 'cancelled',
                updatedAt: new Date().toISOString(),
            };

            const updatedOrders = [...orders];
            updatedOrders[orderIndex] = updatedOrder;
            await saveOrdersToStorage(updatedOrders);
        } catch (error) {
            console.error('Error cancelling order:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const saveDraft = async (draft: OrderFormData): Promise<void> => {
        try {
            await AsyncStorage.setItem('order_draft', JSON.stringify(draft));
            setDraftOrder(draft);
        } catch (error) {
            console.error('Error saving draft:', error);
            throw error;
        }
    };

    const clearDraft = async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem('order_draft');
            setDraftOrder(null);
        } catch (error) {
            console.error('Error clearing draft:', error);
            throw error;
        }
    };

    const refreshOrders = async (): Promise<void> => {
        setIsLoading(true);
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // In a real app, this would fetch from the API
            await loadOrdersFromStorage();
        } catch (error) {
            console.error('Error refreshing orders:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const value: OrderContextType = {
        orders,
        draftOrder,
        isLoading,
        getOrders,
        getOrderById,
        getOrdersByStatus,
        createOrder,
        updateOrder,
        cancelOrder,
        saveDraft,
        clearDraft,
        refreshOrders,
    };

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
}

export function useOrder() {
    const context = useContext(OrderContext);
    if (context === undefined) {
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
}
