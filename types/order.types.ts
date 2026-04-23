export type OrderStatus =
    | 'pending'           // En attente
    | 'confirmed'         // Confirmée
    | 'collected'         // Collectée
    | 'in_progress'       // En traitement
    | 'ready'             // Prête
    | 'delivered'         // Livrée
    | 'cancelled';        // Annulée

// Types de services disponibles
export type ServiceType =
    | 'nettoyage'         // Nettoyage
    | 'blanchisserie'     // Blanchisserie
    | 'aqua_clean';       // Aqua Clean

// Types de linge
export type LinenType =
    | 'drap'              // Drap
    | 'taie'              // Taie d'oreiller
    | 'serviette'         // Serviette
    | 'nappe'             // Nappe
    | 'torchon'           // Torchon
    | 'rideau'            // Rideau
    | 'couverture'        // Couverture
    | 'housse'            // Housse de couette
    | 'peignoir'          // Peignoir
    | 'tapis';            // Tapis

// Article de linge avec quantité
export interface LinenItem {
    type: LinenType;
    quantity: number;
}

// Service avec ses articles
export interface OrderService {
    service: ServiceType;
    items: LinenItem[];
}

export interface Order {
    id: string;
    hotelId: string;
    hotelName: string;
    orderNumber: string;
    status: OrderStatus;
    services: OrderService[];  // Services avec items
    actualWeight?: number;     // kg (après collecte/pesée)
    instructions?: string;
    photos?: string[];
    collectionDate: string;    // ISO date
    deliveryDate?: string;     // ISO date
    createdAt: string;         // ISO date
    updatedAt: string;         // ISO date
}

export interface OrderFormData {
    services: OrderService[];
    collectionDate: string;
    instructions?: string;
    photos?: string[];
}
