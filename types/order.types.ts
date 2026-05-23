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

// Article de linge avec quantité.
// Le type est volontairement large (string) car le catalogue est désormais
// alimenté dynamiquement depuis l'API `/linen-types` (codes type "LP-001").
// Les anciens libellés (drap/taie/...) restent valides en tant que strings.
export interface LinenItem {
    type: LinenType | string;
    quantity: number;
    /** Catégorie de linge pour routage backend ; absent = fallback LP côté service. */
    category?: 'LP' | 'LF' | 'NAE';
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
    hotelAddress?: string;
    hotelPhone?: string;
    orderNumber: string;
    status: OrderStatus;
    /** Statut brut côté API (granulaire : collected, received, triaged, in_production, ready, ...).
     *  Utile pour les écrans atelier/supervisor qui ont besoin de distinguer ces sous-états. */
    apiStatus?: string;
    services: OrderService[];  // Services avec items
    /** Poids estimé par le backend depuis les items (kg). Disponible dès la création. */
    estimatedWeight?: number;
    actualWeight?: number;     // kg (après collecte/pesée)
    instructions?: string;
    photos?: string[];
    collectionDate: string;    // ISO date
    deliveryDate?: string;     // ISO date (effectivement livrée)
    /** Date de livraison planifiée (status=delivery_planned). */
    deliveryPlannedAt?: string;
    /** Date de collecte planifiée (status=collection_planned). */
    collectionPlannedAt?: string;
    /** Localisation cible de collecte (renseignée par le client). */
    pickupGeoLat?: number;
    pickupGeoLng?: number;
    createdAt: string;         // ISO date
    updatedAt: string;         // ISO date
}

export interface OrderFormData {
    services: OrderService[];
    collectionDate: string;
    instructions?: string;
    photos?: string[];
    /** Localisation cible où le chauffeur viendra collecter. */
    pickupGeoLat?: number;
    pickupGeoLng?: number;
}
