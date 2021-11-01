import { DataPoint, DeepReadonlyArray } from '../lib/types';

export interface CanvasChartData {
  readonly points: DeepReadonlyArray<DataPoint>;
  getLabel?(option: number): string;
}
