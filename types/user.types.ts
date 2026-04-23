import { UserRole } from './auth.types';

export interface HotelProfile {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    contactPerson: string;
    contractType: 'monthly' | 'per_order';
    collectionDays?: string[];  // ['monday', 'wednesday', 'friday']
}

export interface DriverProfile {
    id: string;
    name: string;
    phone: string;
    email: string;
    vehicleNumber: string;
    vehicleCapacity: number;  // kg
    licenseNumber: string;
}

export interface SupervisorProfile {
    id: string;
    name: string;
    phone: string;
    email: string;
    department: string;
    shift: 'morning' | 'afternoon' | 'night';
}

export interface UserProfile {
    user: {
        id: string;
        email: string;
        role: UserRole;
        name: string;
        avatar?: string;
    };
    profile: HotelProfile | DriverProfile | SupervisorProfile;
}
