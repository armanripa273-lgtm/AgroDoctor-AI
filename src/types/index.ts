export type Plant = { id: string; name: string; species: string; imageUri?: string; createdAt: string; location?: string };
export type Observation = { id: string; plantId: string; date: string; note: string; imageUri?: string; location?: string; condition: 'Наблюдение' | 'Стабильно' | 'Требует внимания' };
export type Disease = { id: string; name: string; category: string; symptoms: string; advice: string; color: string; icon: string };
export type Service = { id: string; title: string; description: string; icon: string; color: string; route?: 'Details' };
export type RootStackParamList = { Login: undefined; Main: undefined; Details: { title: string; body: string; icon: string }; Diagnosis: undefined; AddPlant: { plantId?: string; initialImageUri?: string; initialNote?: string } | undefined };
export type TabParamList = { Главная: undefined; Сервисы: undefined; Растения: undefined; Каталог: undefined; Профиль: undefined };
