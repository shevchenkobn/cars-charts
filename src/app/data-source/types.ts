export interface DataLoader<T> {
  load(): Promise<T[]>;
  refresh(): Promise<T[]>;
}

export enum CarFuelType {
  Diesel = 'diesel',
  Gas = 'gas',
}

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

export enum CarCylinderCount {
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Eight = 8,
  Twelve = 12,
}

export interface CarModel {
  price: number;
  make: CarManufacturer;
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
