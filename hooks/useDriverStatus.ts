import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getDriverStatus,
    setDriverStatus,
    type DriverAvailability,
} from '@/services/users.service';

const driverStatusKey = (userId: string) => ['driver-status', userId] as const;

/** Disponibilité actuelle du chauffeur connecté (available/on_route/off_duty/unavailable). */
export function useDriverStatus(userId: string | undefined) {
    return useQuery({
        queryKey: driverStatusKey(userId ?? ''),
        queryFn: () => getDriverStatus(userId as string),
        enabled: Boolean(userId),
    });
}

export function useSetDriverStatus(userId: string | undefined) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (status: DriverAvailability) =>
            setDriverStatus(userId as string, status),
        onSuccess: (_data, status) => {
            if (userId) qc.setQueryData(driverStatusKey(userId), status);
        },
    });
}
