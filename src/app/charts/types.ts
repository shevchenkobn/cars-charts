import { ReadonlyInteractiveDataSource } from '../data-source/data-source.class';

export interface ChartsConfig {
  readonly container: Element;
  readonly colorCodedLegendContainer?: Element;
  readonly dataSource: ReadonlyInteractiveDataSource;
  readonly xAxisType: ChartsXAxisType;
  readonly colorCodedProperty: ColorCodedProperty;
}

export interface ChartsRenderConfig {
  readonly xAxisType?: ChartsXAxisType;
  readonly colorCodedProperty?: ColorCodedProperty;
}

export enum ChartsXAxisType {
  Manufacturers = 'manufacturers',
  Prices = 'prices',
}

export type ColorCodedProperty = 'cylinderCount' | 'fuelType';
