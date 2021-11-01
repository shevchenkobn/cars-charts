export interface DataLoader<T> {
  load(): Promise<T[]>;
  refresh(): Promise<T[]>;
}
