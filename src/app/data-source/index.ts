import { CarModel } from './types';
import * as Papa from 'papaparse';

export async function loadCarsData(): Promise<CarModel[]> {
  const dataCsv = (await import('../../../data/cars.csv')).default;
  const parsed = Papa.parse(dataCsv, {
    header: true,
  });
  return parsed.data.map((r: any, i) => ({
    id: i,
    price: Number.parseInt(r.price),
    manufacturer: r.make,
    fuelType: r['fuel-type'],
    cylinderCount: r['num-of-cylinders'],
    horsepower: Number.parseInt(r.horsepower),
    cityMpg: Number.parseInt(r['city-mpg']),
    highwayMpg: Number.parseInt(r['highway-mpg']),
  }));
}
