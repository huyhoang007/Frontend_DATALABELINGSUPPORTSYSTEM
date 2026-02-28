// TODO_BACKEND: Remove this file when all APIs are available

export function getMockData<T>(key: string, seedFn: () => T[]): T[] {
    const raw = localStorage.getItem(key);
    if (raw) {
        try { return JSON.parse(raw); } catch { /* fallthrough */ }
    }
    const seed = seedFn();
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
}

export function setMockData<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
}

export function addMockItem<T extends { id: string }>(key: string, item: Omit<T, "id">): T {
    const data = getMockData<T>(key, () => []);
    const newItem = { ...item, id: crypto.randomUUID() } as T;
    data.push(newItem);
    setMockData(key, data);
    return newItem;
}

export function deleteMockItem(key: string, id: string): void {
    const data = getMockData<any>(key, () => []);
    setMockData(key, data.filter((item: any) => item.id !== id));
}
