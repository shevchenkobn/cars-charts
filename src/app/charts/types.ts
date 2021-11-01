import { DataPoint, DeepReadonlyArray } from '../lib/types';

export interface CanvasChartData {
  readonly points: DeepReadonlyArray<DataPoint>;
  getLabel?(option: number): string;
}

export interface ChartsConfig {
  readonly container: Element;
  readonly xAxisType: ChartsXAxisType;
}

export enum ChartsXAxisType {
  Manufacturers = 'manufacturers',
  Prices = 'prices',
}
