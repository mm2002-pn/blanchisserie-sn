import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useCancelOrder,
  useCreateOrder,
  useOrders,
  useUpdateOrder,
} from '@/hooks/useOrders';
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';
import type { Order, OrderFormData, OrderStatus } from '@/types/order.types';

/**
 * OrderContext = thin proxy au-dessus de react-query.
 *
 * Garde la même interface que l'ancien contexte (utilisée par tous les écrans
 * hôtel) pour ne rien casser. La logique de fetch/mutation/cache vit dans
 * `hooks/useOrders.ts`. Les drafts restent en AsyncStorage (local-only).
 */

interface OrderContextType {
    orders: Order[];
    draftOrder: OrderFormData | null;
    isLoading: boolean;

    getOrders: () => Order[];
    getOrderById: (id: string) => Order | undefined;
    getOrdersByStatus: (status: OrderStatus) => Order[];
    createOrder: (orderData: OrderFormData) => Promise<Order>;
    updateOrder: (id: string, orderData: OrderFormData) => Promise<Order>;
    cancelOrder: (id: string) => Promise<void>;

    saveDraft: (draft: OrderFormData) => Promise<void>;
    clearDraft: () => Promise<void>;

    refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const DRAFT_STORAGE_KEY = 'order_draft';

export function OrderProvider({ children }: { children: React.ReactNode }) {
    const ordersQuery = useOrders();
    const createMutation = useCreateOrder();
    const updateMutation = useUpdateOrder();
    const cancelMutation = useCancelOrder();
    useOrdersRealtime(); // invalide auto le cache sur les events order:*

    const [draftOrder, setDraftOrder] = useState<OrderFormData | null>(null);

    useEffect(() => {
        AsyncStorage.getItem(DRAFT_STORAGE_KEY)
            .then((raw) => {
                if (raw) setDraftOrder(JSON.parse(raw) as OrderFormData);
            })
            .catch(() => {});
    }, []);

    const orders = ordersQuery.data ?? [];
    const isLoading = ordersQuery.isLoading || createMutation.isPending || cancelMutation.isPending;

    const getOrders = () => orders;
    const getOrderById = (id: string) => orders.find((o) => o.id === id);
    const getOrdersByStatus = (status: OrderStatus) => orders.filter((o) => o.status === status);

    const createOrder = async (orderData: OrderFormData) => {
        const order = await createMutation.mutateAsync(orderData);
        await clearDraft();
        return order;
    };

    const updateOrder = async (id: string, orderData: OrderFormData) => {
        const order = await updateMutation.mutateAsync({ id, form: orderData });
        await clearDraft();
        return order;
    };

    const cancelOrder = async (id: string) => {
        await cancelMutation.mutateAsync({ id });
    };

    const saveDraft = async (draft: OrderFormData) => {
        await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        setDraftOrder(draft);
    };

    const clearDraft = async () => {
        await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraftOrder(null);
    };

    const refreshOrders = async () => {
        await ordersQuery.refetch();
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

    return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
    const context = useContext(OrderContext);
    if (context === undefined) {
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
}
