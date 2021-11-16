import { GuardedMap, ReadonlyGuardedMap } from '../lib/map';
import { DeepReadonlyArray, t } from '../lib/types';

export interface DataLoader<T> {
  load(): Promise<T[]>;
  refresh(): Promise<T[]>;
}

export enum CarFuelType {
  Diesel = 'diesel',
  Gas = 'gas',
}

export const carFuelTypes: DeepReadonlyArray<CarFuelType> =
  Object.values(CarFuelType);

export enum CarManufacturer {
  AlfaRomero = 'alfa-romero',
  Audi = 'audi',
  Bmw = 'bmw',
  Chevrolet = 'chevrolet',
  Dodge = 'dodge',
  Honda = 'honda',
  Isuzu = 'isuzu',
  Jaguar = 'jaguar',
  Mazda = 'mazda',
  MercedesBenz = 'mercedes-benz',
  Mercury = 'mercury',
  Mitsubishi = 'mitsubishi',
  Nissan = 'nissan',
  Peugot = 'peugot',
  Plymouth = 'plymouth',
  Porsche = 'porsche',
  Renault = 'renault',
  Saab = 'saab',
  Subaru = 'subaru',
  Toyota = 'toyota',
  Volkswagen = 'volkswagen',
  Volvo = 'volvo',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace carManufacturerMap {
  export const value: ReadonlyArray<CarManufacturer> =
    Object.values(CarManufacturer);
  export const index: ReadonlyGuardedMap<CarManufacturer, number> =
    new GuardedMap(value.map((v, i) => t(v, i)));
  export function getIndex(value: CarManufacturer) {
    return index.get(value);
  }
}

export enum CarCylinderCount {
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Eight = 8,
  Twelve = 12,
  NA = Number.NaN,
}

export function parseCarCylinderCount(value: unknown): CarCylinderCount {
  const name = String(value);
  const prop = name[0].toUpperCase() + name.slice(1);
  return typeof CarCylinderCount[prop as any] === 'number'
    ? (CarCylinderCount[prop as any] as any)
    : CarCylinderCount.NA;
}

export const sortedCarCylinderCounts = Object.values(CarCylinderCount)
  .filter((a): a is number => typeof a === 'number')
  .sort((a, b) => {
    const aNaN = Number.isNaN(a);
    const bNaN = Number.isNaN(b);
    if (aNaN && !bNaN) {
      return -1;
    }
    if (!aNaN && bNaN) {
      return 1;
    }
    if (aNaN && bNaN) {
      return 0;
    }
    return a - b;
  });

export type CarId = number;

export interface CarModel {
  carId: CarId;
  price: number;
  manufacturer: CarManufacturer;
  fuelType: CarFuelType;
  cylinderCount: CarCylinderCount;
  horsepower: number;
  /**
   * Miles per gallon in city.
   */
  cityMpg: number;
  /**
   * Miles per gallon on highway.
   */
  highwayMpg: number;
}
