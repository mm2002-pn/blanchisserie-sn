import { api } from './api';
import type { LinenCategoryCode } from './linenTypes.service';

export interface ApiLinenCategory {
    id: string;
    code: LinenCategoryCode;
    label: string;
    emoji: string | null;
    sortOrder: number;
    isActive: boolean;
}

export async function listLinenCategories(): Promise<ApiLinenCategory[]> {
    const { data } = await api.get<{ items: ApiLinenCategory[]; count: number }>(
        '/linen-categories',
        { params: { isActive: true } },
    );
    return data.items;
}
