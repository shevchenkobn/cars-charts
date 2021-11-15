import * as d3 from 'd3';
import {
  CarManufacturer,
  carManufacturerMap,
  CarModel,
} from '../data-source/types';
import { GuardedMap, ReadonlyGuardedMap } from '../lib/map';
import {
  DeepReadonly,
  DeepReadonlyArray,
  DeepReadonlyGuardedMap,
} from '../lib/types';
import { ChartsConfig, ChartsXAxisType } from './types';
import css from '../index.module.scss';

const colors = {
  primary: String(css.primaryColor),
  secondary: String(css.secondaryColor),
};

const font = 'sans-serif';
const xIntervalPx = 20;
const yIntervalPx = 10;
const paddingPx = 20;
const axisWidthPx = 2;
const tickLengthPx = 4;
const pointSizePx = 6;
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
  private selected: GuardedMap<number, DeepReadonly<CarModel>> = new GuardedMap();

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

    const xKey = this.getXKeyTransformer();

    const xAxisHeight = this.getXAxisHeight();
    const yAxesWidth = this.getYAxesMaxWidth();
    const xAxis = this.getXAxis([
      paddingPx + yAxesWidth,
      this.size.x - paddingPx,
    ]);
    const xAxisRenderer = d3.axisBottom(xAxis);
    this.renderXAxis(xAxisRenderer, this.size.y - paddingPx - xAxisHeight);

    const yAxes: YAxes = {
      horsepower: this.getYAxis('horsepower', [
        this.size.y - paddingPx - xAxisHeight,
        paddingPx,
      ]),
      cityMpg: this.getYAxis('cityMpg', [
        this.size.y - paddingPx - xAxisHeight,
        paddingPx,
      ]),
      highwayMpg: this.getYAxis('highwayMpg', [
        this.size.y - paddingPx - xAxisHeight,
        paddingPx,
      ]),
    };
    const yAxisRender = d3.axisLeft(yAxes.horsepower);
    this.renderYAxis(yAxisRender, paddingPx + yAxesWidth);

    const self = this;

    this.svg
      .append('g')
      .selectAll()
      .data(this.data)
      .join('circle')
      .attr('cx', function (d) {
        return xAxis(xKey.toNumber(d[xKey.key]) || 0);
      })
      .attr('cy', function (d) {
        return yAxes.horsepower(d.horsepower || 0);
      })
      .attr('r', 3)
      .style('fill', '#69b3a2')
      .on('click', function (event, datum) {
        const circle = d3.select(this);
        if (self.selected.has(datum.id)) {
          self.selected.delete(datum.id);
          circle.attr('stroke', null).attr('stroke-width', null);
        } else {
          self.selected.set(datum.id, datum);
          circle.attr('stroke', '#000').attr('stroke-width', 2);
        }
      });
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
    const xTransformer = this.getXKeyTransformer();
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

  private getXAxisHeight(
    xAxis: d3.ScaleLinear<number, number> = this.getXAxis()
  ) {
    const xAxisRenderer = d3.axisBottom(xAxis);
    const xAxisBoundingClientRect = this.getBoundingClientRect(xAxisRenderer);
    return xAxisBoundingClientRect.height;
  }

  private getYAxesMaxWidth(
    yAxes: Record<
      YAxisVariable,
      d3.ScaleLinear<number, number>
    > = this.getDefaultYAxes()
  ) {
    let maxWidth = 0;
    for (const [variable, yAxis] of Object.entries(yAxes)) {
      const yAxisRenderer = d3.axisLeft(yAxis);
      const yAxisBoundingClientRect = this.getBoundingClientRect(yAxisRenderer);
      maxWidth = Math.max(maxWidth, yAxisBoundingClientRect.width);
    }
    return maxWidth;
  }

  private getXAxis(
    range: [number, number] = [paddingPx, this.size.x - paddingPx]
  ) {
    return d3
      .scaleLinear()
      .domain([this.limits.x.min, this.limits.x.max])
      .range(range);
  }

  private getYAxis(
    variable: YAxisVariable,
    range: [number, number] = [this.size.y - paddingPx, paddingPx]
  ) {
    return d3
      .scaleLinear()
      .domain([this.limits[variable].min, this.limits[variable].max])
      .range(range);
  }

  private getDefaultYAxes(): Record<
    YAxisVariable,
    d3.ScaleLinear<number, number>
  > {
    return {
      horsepower: this.getYAxis('horsepower'),
      cityMpg: this.getYAxis('cityMpg'),
      highwayMpg: this.getYAxis('highwayMpg'),
    };
  }

  private renderXAxis(xAxisRenderer: d3.Axis<d3.NumberValue>, y: number) {
    return this.svg
      .append('g')
      .attr('transform', 'translate(0,' + y + ')')
      .call(xAxisRenderer);
  }

  private renderYAxis(yAxisRenderer: d3.Axis<d3.NumberValue>, x: number) {
    return this.svg
      .append('g')
      .attr('transform', 'translate(' + x + ',0)')
      .call(yAxisRenderer);
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

  private getXKeyTransformer(): XKeyTransformer {
    return enumToKey.get(this.xAxisType);
  }
}

interface CarLimits {
  x: AxisLimits;
  horsepower: AxisLimits;
  cityMpg: AxisLimits;
  highwayMpg: AxisLimits;
}

type YAxisVariable = Exclude<keyof CarLimits, 'x'>;
type YAxes = Record<YAxisVariable, d3.ScaleLinear<number, number>>;

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
