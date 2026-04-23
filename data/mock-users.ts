import { User } from '@/types/auth.types';
import { HotelProfile, DriverProfile, SupervisorProfile } from '@/types/user.types';

// Mock users pour login
export const mockUsers: (User & { password: string })[] = [
    {
        id: '1',
        email: 'hotel@test.com',
        password: 'password',
        role: 'hotel',
        name: 'Hôtel Teranga',
        phone: '+221 33 123 45 67',
    },
    {
        id: '2',
        email: 'driver@test.com',
        password: 'password',
        role: 'driver',
        name: 'Mamadou Diop',
        phone: '+221 77 234 56 78',
    },
    {
        id: '3',
        email: 'supervisor@test.com',
        password: 'password',
        role: 'supervisor',
        name: 'Fatou Sall',
        phone: '+221 70 345 67 89',
    },
];

// Mock hotel profiles
export const mockHotelProfiles: HotelProfile[] = [
    {
        id: '1',
        name: 'Hôtel Teranga',
        address: '23 Avenue Pompidou',
        city: 'Dakar',
        phone: '+221 33 123 45 67',
        email: 'hotel@test.com',
        contactPerson: 'Ibrahima Kane',
        contractType: 'monthly',
        collectionDays: ['monday', 'wednesday', 'friday'],
    },
    {
        id: '2',
        name: 'Radisson Blu',
        address: 'Route de la Corniche Ouest',
        city: 'Dakar',
        phone: '+221 33 234 56 78',
        email: 'radisson@test.com',
        contactPerson: 'Awa Diallo',
        contractType: 'per_order',
    },
];

// Mock driver profiles
export const mockDriverProfiles: DriverProfile[] = [
    {
        id: '2',
        name: 'Mamadou Diop',
        phone: '+221 77 234 56 78',
        email: 'driver@test.com',
        vehicleNumber: 'DK-5678-AB',
        vehicleCapacity: 500,
        licenseNumber: 'DRV-12345',
    },
];

// Mock supervisor profiles
export const mockSupervisorProfiles: SupervisorProfile[] = [
    {
        id: '3',
        name: 'Fatou Sall',
        phone: '+221 70 345 67 89',
        email: 'supervisor@test.com',
        department: 'Production',
        shift: 'morning',
    },
];
