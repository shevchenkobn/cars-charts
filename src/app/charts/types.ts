import { ReadonlySelectableDataSource } from '../data-source/data-source.class';
import { DataPoint, DeepReadonlyArray } from '../lib/types';

export interface CanvasChartData {
  readonly points: DeepReadonlyArray<DataPoint>;
  getLabel?(option: number): string;
}

export interface ChartsConfig {
  readonly container: Element;
  readonly dataSource: ReadonlySelectableDataSource;
  readonly xAxisType: ChartsXAxisType;
  readonly coloredProperty: ColorCodedProperty;
}

export enum ChartsXAxisType {
  Manufacturers = 'manufacturers',
  Prices = 'prices',
}

export type ColorCodedProperty = 'cylinderCount' | 'fuelType';
