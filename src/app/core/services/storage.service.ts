import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  get<T>(key: string, storage: Storage = localStorage): T | null {
    const rawValue = storage.getItem(key);

    if (rawValue === null) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      storage.removeItem(key);
      return null;
    }
  }

  set<T>(key: string, value: T, storage: Storage = localStorage): void {
    storage.setItem(key, JSON.stringify(value));
  }

  remove(key: string, storage: Storage = localStorage): void {
    storage.removeItem(key);
  }
}
