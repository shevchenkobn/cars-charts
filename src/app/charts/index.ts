import * as d3 from 'd3';
import {
  CarManufacturer,
  carManufacturerMap,
  CarModel,
} from '../data-source/types';
import { GuardedMap, ReadonlyGuardedMap } from '../lib/map';
import { DeepReadonly, DeepReadonlyArray } from '../lib/types';
import { ChartsConfig, ChartsXAxisType } from './types';

const font = 'sans-serif';
const xIntervalPx = 20;
const yIntervalPx = 10;
const paddingPx = 20;
const axisWidthPx = 2;
const tickLengthPx = 4;
const pointSizePx = 6;
const colors: ReadonlyGuardedMap<number, string> = new GuardedMap([
  [0, 'red'],
  [1, 'blue'],
  [2, 'green'],
]);
const legendHeightPx = 30;
const enumToKey: ReadonlyGuardedMap<ChartsXAxisType, XKeyTransformer> =
  new GuardedMap([
    [
      ChartsXAxisType.Prices,
      { key: 'price', toNumber: (value) => value } as XKeyTransformer<'price'>,
    ],
    [
      ChartsXAxisType.Manufacturers,
      {
        key: 'manufacturer',
        toNumber: (value: CarManufacturer) =>
          carManufacturerMap.getIndex(value),
      },
    ],
  ] as [ChartsXAxisType, XKeyTransformer][]);

interface XKeyTransformer<K extends keyof CarModel = keyof CarModel> {
  key: K;
  toNumber(value: CarModel[K]): number;
}

export class CarsSvgCharts {
  private readonly svg: d3.Selection<
    SVGSVGElement,
    DeepReadonly<CarModel>,
    any,
    null
  >;
  private readonly xAxisType: ChartsXAxisType;
  private size: Coordinates = { x: 0, y: 0 };
  private limits: CarLimits = getCarLimits();
  private data: DeepReadonlyArray<CarModel> = [];

  constructor(config: ChartsConfig) {
    const container = d3.select(config.container) as d3.Selection<
      any,
      null,
      any,
      any
    >;
    this.svg = container.select('svg') as d3.Selection<
      SVGSVGElement,
      any,
      any,
      any
    >;
    if (!this.svg.node()) {
      this.svg = container.append('svg') as d3.Selection<
        SVGSVGElement,
        any,
        any,
        any
      >;
    }
    this.xAxisType = config.xAxisType;
  }

  render(data?: DeepReadonlyArray<CarModel>) {
    if (data) {
      this.data = data;
    }
    this.clear();

    this.updateChartsSize();
    this.updateLimits();

    const xAxis = d3
      .scaleLinear()
      .domain([this.limits.x.min, this.limits.x.max])
      .range([paddingPx, this.size.x - paddingPx]);
    const xAxisRender = d3.axisBottom(xAxis);
    const xAxisBoundingClientRect = this.getBoundingClientRect(xAxisRender);
    this.svg
      .append('g')
      .attr(
        'transform',
        'translate(0,' +
          (this.size.y - paddingPx - xAxisBoundingClientRect.height) +
          ')'
      )
      .call(xAxisRender);

    const yHorsepowerXAxis = d3
      .scaleLinear()
      .domain([this.limits.horsepower.min, this.limits.horsepower.max])
      .range([
        this.size.y - paddingPx - xAxisBoundingClientRect.height,
        paddingPx,
      ]);
    const yAxisRender = d3.axisLeft(yHorsepowerXAxis);
    const yAxisBoundingClientRect = this.getBoundingClientRect(yAxisRender);
    this.svg
      .append('g')
      .attr(
        'transform',
        'translate(' + (paddingPx + yAxisBoundingClientRect.width) + ',0)'
      )
      .call(yAxisRender);
  }

  clear() {
    this.svg.selectAll('*').remove();
  }

  private updateChartsSize() {
    const container = this.svg.node()?.parentElement;
    if (!container) {
      throw new Error('Either there is no element or the element is detached!');
    }
    const { width, height } = container.getBoundingClientRect();
    this.size = { x: width, y: height };

    this.svg.attr('width', this.size.x).attr('height', this.size.y);
    return this.size;
  }

  private updateLimits(): CarLimits {
    this.limits = getCarLimits();
    const xTransformer = enumToKey.get(this.xAxisType);
    for (const datum of this.data) {
      const x = xTransformer.toNumber(datum[xTransformer.key]);
      if (x < this.limits.x.min) {
        this.limits.x.min = x;
      }
      if (x > this.limits.x.max) {
        this.limits.x.max = x;
      }
      if (datum.horsepower < this.limits.horsepower.min) {
        this.limits.horsepower.min = datum.horsepower;
      }
      if (datum.horsepower > this.limits.horsepower.max) {
        this.limits.horsepower.max = datum.horsepower;
      }
      if (datum.cityMpg < this.limits.cityMpg.min) {
        this.limits.cityMpg.min = datum.cityMpg;
      }
      if (datum.cityMpg > this.limits.cityMpg.max) {
        this.limits.cityMpg.max = datum.cityMpg;
      }
      if (datum.highwayMpg < this.limits.highwayMpg.min) {
        this.limits.highwayMpg.min = datum.highwayMpg;
      }
      if (datum.highwayMpg > this.limits.highwayMpg.max) {
        this.limits.highwayMpg.max = datum.highwayMpg;
      }
    }
    return this.limits;
  }

  private getBoundingClientRect(
    func: Parameters<
      d3.Selection<SVGGElement, DeepReadonly<CarModel>, any, null>['call']
    >[0]
  ) {
    const g = this.svg.append('g').call(func);
    const boundingRect = g.node()?.getBoundingClientRect();
    if (!boundingRect) {
      throw new Error(
        'Unknown error while getting size, maybe rendering failed'
      );
    }
    g.remove();
    return boundingRect;
  }
}

interface CarLimits {
  x: AxisLimits;
  horsepower: AxisLimits;
  cityMpg: AxisLimits;
  highwayMpg: AxisLimits;
}

function getCarLimits() {
  return {
    x: getAxisLimits(),
    horsepower: getAxisLimits(),
    cityMpg: getAxisLimits(),
    highwayMpg: getAxisLimits(),
  };
}

// interface Limits {
//   x: AxisLimits;
//   y: AxisLimits;
// }
//
// function getLimits() {
//   return {
//     x: {
//       min: 0,
//       max: 0,
//     },
//     y: {
//       min: 0,
//       max: 0,
//     },
//   };
// }

interface AxisLimits {
  min: number;
  max: number;
}

function getAxisLimits() {
  return { min: 0, max: 0 };
}

interface Coordinates {
  x: number;
  y: number;
}
