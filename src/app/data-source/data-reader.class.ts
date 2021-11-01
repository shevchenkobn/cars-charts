import { ReadonlyGuardedMap } from '../lib/map';
import { DataLoader } from './types';

export type DataSources<K, T> = ReadonlyGuardedMap<K, DataLoader<T>>;
export interface DataSourceReaderConfig<K, T> {
  readonly dataLoaders: DataSources<K, T>;
  readonly currentKey: K;
  readonly isRefreshEnabled: boolean;
}

export class DataReader<K, T> {
  private currentKey: K;
  private readonly dataLoaders: DataSources<K, T>;
  private refreshEnabled: boolean;

  get currentDataSourceKey() {
    return this.currentKey;
  }
  get isRefreshEnabled() {
    return this.refreshEnabled;
  }

  constructor(config: DataSourceReaderConfig<K, T>) {
    this.currentKey = config.currentKey;
    this.refreshEnabled = config.isRefreshEnabled;
    this.dataLoaders = config.dataLoaders;
  }

  read() {
    const source = this.dataLoaders.get(this.currentKey);
    return this.isRefreshEnabled ? source.refresh() : source.load();
  }

  getKeys() {
    return this.dataLoaders.keys();
  }

  setKey(key: K) {
    this.currentKey = key;
    return this;
  }

  setRefreshEnabled(refreshEnabled: boolean) {
    this.refreshEnabled = refreshEnabled;
    return this;
  }
}
