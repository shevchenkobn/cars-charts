import { iterate } from 'iterare';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { GuardedMap } from '../lib/map';
import {
  DeepReadonlyArray,
  DeepReadonlyGuardedMap,
  DeepReadonlySet,
  t,
} from '../lib/types';
import { CarId, CarModel } from './types';

export interface CarIdChangedEvent<T extends ReadonlySelectableDataSource> {
  readonly carId: CarId;
  readonly selected: boolean;
  readonly target: T;
}

export interface ReadonlySelectableDataSource {
  array: DeepReadonlyArray<CarModel>;
  map: DeepReadonlyGuardedMap<CarId, CarModel>;
  selected: DeepReadonlySet<CarId>;
  readonly changed$: Observable<this>;
  readonly selected$: Observable<
    CarIdChangedEvent<ReadonlySelectableDataSource>
  >;

  toggle(carId: CarId): this;
  select(carId: CarId): this;
  unselect(carId: CarId): this;
}

export class DataSource implements ReadonlySelectableDataSource {
  private data: DeepReadonlyArray<CarModel> = [];
  private dataMap: DeepReadonlyGuardedMap<CarId, CarModel> = new Map();
  private selectedSet: Set<CarId> = new Set();
  private changedSubject = new BehaviorSubject<this>(this);
  readonly changed$ = this.changedSubject.asObservable();
  private selectedSubject: Subject<CarIdChangedEvent<DataSource>> = new Subject<
    CarIdChangedEvent<DataSource>
  >();
  readonly selected$ = this.selectedSubject.asObservable();

  get array(): DeepReadonlyArray<CarModel> {
    return this.data;
  }
  get map(): DeepReadonlyGuardedMap<CarId, CarModel> {
    return this.dataMap;
  }
  get selected(): DeepReadonlySet<CarId> {
    return this.selectedSet;
  }

  setData(data: DeepReadonlyArray<CarModel>): this {
    this.data = data;
    this.dataMap = new GuardedMap(iterate(this.data).map((d) => t(d.id, d)));
    this.changedSubject.next(this);
    return this;
  }

  toggle(carId: CarId): this {
    if (this.selectedSet.has(carId)) {
      return this.unselect(carId);
    } else {
      return this.select(carId);
    }
  }

  select(carId: CarId): this {
    this.selectedSet.add(carId);
    this.selectedSubject.next({
      carId,
      selected: true,
      target: this,
    });
    return this;
  }

  unselect(carId: CarId): this {
    this.selectedSet.delete(carId);
    this.selectedSubject.next({
      carId,
      selected: false,
      target: this,
    });
    return this;
  }
}
