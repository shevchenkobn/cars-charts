import { iterate } from 'iterare';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { GuardedMap } from '../lib/map';
import {
  DeepReadonlyArray,
  DeepReadonlyGuardedMap,
  DeepReadonlySet,
  Nullable,
  t,
} from '../lib/types';
import { CarId, CarModel } from './types';

export interface CarIdSelectEvent<T extends ReadonlyInteractiveDataSource> {
  readonly carId: CarId;
  readonly selected: boolean;
  readonly target: T;
}

export interface CurrentCarIdChangedEvent {
  readonly newCarId: Nullable<CarId>;
  readonly oldCarId: Nullable<CarId>;
}

export interface ReadonlyInteractiveDataSource {
  array: DeepReadonlyArray<CarModel>;
  map: DeepReadonlyGuardedMap<CarId, CarModel>;
  selected: DeepReadonlySet<CarId>;
  readonly changed$: Observable<this>;
  readonly selected$: Observable<
    CarIdSelectEvent<ReadonlyInteractiveDataSource>
  >;
  readonly current$: Observable<CurrentCarIdChangedEvent>;
  readonly currentCarId: Nullable<CarId>;

  setCurrent(carId: Nullable<CarId>): this;
  toggle(carId: CarId): this;
  select(carId: CarId): this;
  unselect(carId: CarId): this;
}

export class DataSource implements ReadonlyInteractiveDataSource {
  private data: DeepReadonlyArray<CarModel> = [];
  private dataMap: DeepReadonlyGuardedMap<CarId, CarModel> = new Map();
  private selectedSet: Set<CarId> = new Set();
  private changedSubject = new Subject<this>();
  readonly changed$ = this.changedSubject.asObservable();
  private selectedSubject: Subject<CarIdSelectEvent<DataSource>> = new Subject<
    CarIdSelectEvent<DataSource>
  >();
  readonly selected$ = this.selectedSubject.asObservable();
  private currentSubject = new BehaviorSubject<CurrentCarIdChangedEvent>({
    oldCarId: null,
    newCarId: null,
  });
  readonly current$ = this.currentSubject.asObservable();

  get array(): DeepReadonlyArray<CarModel> {
    return this.data;
  }
  get map(): DeepReadonlyGuardedMap<CarId, CarModel> {
    return this.dataMap;
  }
  get selected(): DeepReadonlySet<CarId> {
    return this.selectedSet;
  }
  get currentCarId(): Nullable<CarId> {
    return this.currentSubject.value.newCarId;
  }

  setData(data: DeepReadonlyArray<CarModel>): this {
    this.data = data;
    this.dataMap = new GuardedMap(iterate(this.data).map((d) => t(d.carId, d)));
    this.changedSubject.next(this);
    return this;
  }

  setCurrent(carId: Nullable<CarId>): this {
    this.currentSubject.next({
      oldCarId: this.currentSubject.value.newCarId,
      newCarId: carId,
    });
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
