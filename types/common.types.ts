export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface SelectOption {
    label: string;
    value: string;
    icon?: string;
}

export interface Stats {
    label: string;
    value: string | number;
    icon?: string;
    color?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}
