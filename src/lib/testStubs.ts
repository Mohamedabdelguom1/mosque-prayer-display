/** بدائل مبسّطة لواجهات المتصفح كي تعمل الاختبارات في بيئة Node */

export class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }
  key(i: number): string | null {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string): string | null {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.map.set(k, String(v));
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
  clear(): void {
    this.map.clear();
  }
}

/** تخزين يرفض الكتابة، لمحاكاة امتلاء الحصة */
export class FullStorage extends MemoryStorage {
  override setItem(): void {
    throw new DOMException('QuotaExceededError');
  }
}

export function installStorage(storage: Storage): void {
  (globalThis as { localStorage: Storage }).localStorage = storage;
}
