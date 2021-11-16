import * as d3 from 'd3';
import { Subject, takeUntil } from 'rxjs';
import { ReadonlyInteractiveDataSource } from '../data-source/data-source.class';
import {
  CarManufacturer,
  carManufacturerMap,
  CarModel,
  sortedCarCylinderCounts,
} from '../data-source/types';
import css from '../index.module.scss';
import { GuardedMap, ReadonlyGuardedMap } from '../lib/map';
import { DeepReadonly, Maybe, Nullable } from '../lib/types';
import {
  ChartsConfig,
  ChartsRenderConfig,
  ChartsXAxisType,
  ColorCodedProperty,
} from './types';

const colors = {
  primary: String(css.primaryColor),
  secondary: String(css.secondaryColor),
};

const idAttributeName = 'data-id';
const valueAttributeName = 'data-value';
const paddingPx = 15;
const pointRadiusPx = 4;
const selectedStrokeWidthPx = 2;
const colorLegendStrokePx = selectedStrokeWidthPx / 2;
const pointShadowRadiusPx = 6;
const labelSizePx = 12;
const labelMarginPx = 5;
const font = labelSizePx + 'px sans-serif';

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
  private readonly colorCodedLegendSvg: Nullable<
    d3.Selection<SVGSVGElement, number | string, any, null | undefined>
  >;
  private xAxisType: ChartsXAxisType;
  private coloredProperty: ColorCodedProperty = 'cylinderCount';
  private size: Coordinates = { x: 0, y: 0 };
  private limits: CarLimits = getCarLimits();
  private data: ReadonlyInteractiveDataSource;
  private readonly destroy$ = new Subject<boolean>();

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
    if (config.colorCodedLegendContainer) {
      const container = d3.select(
        config.colorCodedLegendContainer
      ) as d3.Selection<any, string | number, any, any>;
      this.colorCodedLegendSvg = container.select('svg');
      if (!this.colorCodedLegendSvg.node()) {
        this.colorCodedLegendSvg = container.append('svg');
      }
    } else {
      this.colorCodedLegendSvg = null;
    }
    this.xAxisType = config.xAxisType;
    this.data = config.dataSource;
    this.data.changed$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.render();
    });
    this.data.selected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ carId, selected }) => {
        this.markSelectedPoints(carId, selected);
      });
    this.data.current$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ oldCarId, newCarId }) => {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        if (typeof oldCarId === 'number') {
          const points = this.svg
            .selectAll(`[${idAttributeName}="${oldCarId}"]`)
            .each(function () {
              d3.select(this).style('filter', null);
            });
          if (this.colorCodedLegendSvg) {
            this.colorCodedLegendSvg
              .select(
                `[${valueAttributeName}="${
                  self.data.map.get(oldCarId).cylinderCount
                }"]`
              )
              .attr('stroke-width', colorLegendStrokePx);
          }
        }
        if (typeof newCarId === 'number') {
          const points = this.svg
            .selectAll(`[${idAttributeName}="${newCarId}"]`)
            .each(function () {
              d3.select(this)
                .style(
                  'filter',
                  `drop-shadow(0 0 ${
                    self.data.selected.has(newCarId)
                      ? pointShadowRadiusPx + selectedStrokeWidthPx
                      : pointShadowRadiusPx
                  }px #000000)`
                )
                .raise();
            });
          if (this.colorCodedLegendSvg) {
            this.colorCodedLegendSvg
              .select(
                `[${valueAttributeName}="${
                  self.data.map.get(newCarId).cylinderCount
                }"]`
              )
              .attr('stroke-width', selectedStrokeWidthPx * 2);
          }
        }
      });

    this.addDefs();
  }

  render(config?: ChartsRenderConfig) {
    this.xAxisType = config?.xAxisType ?? this.xAxisType;
    this.coloredProperty = config?.colorCodedProperty ?? this.coloredProperty;

    this.clear();

    this.updateChartsSize();
    this.updateLimits();

    const xAxisHeight = this.getXAxisHeight();
    const yAxesWidth = this.getYAxesMaxWidth();
    const xAxis = this.getXAxis([
      paddingPx + yAxesWidth + labelMarginPx + labelSizePx,
      this.size.x - paddingPx,
    ]);
    const xAxisRenderer = d3.axisBottom(xAxis);
    if (this.xAxisType === ChartsXAxisType.Manufacturers) {
      xAxisRenderer
        .tickFormat((d) => carManufacturerMap.value[d.valueOf()])
        .ticks(carManufacturerMap.value.length);
    }

    const colorAxis = d3
      .scaleLinear<string, string>()
      .domain([1, sortedCarCylinderCounts.length])
      .range([colors.secondary, colors.primary]);
    this.renderColorCodedLegend(colorAxis, (v) =>
      sortedCarCylinderCounts[v].toString()
    );

    const yProps = ['horsepower', 'cityMpg', 'highwayMpg'] as YAxisVariable[];
    const yChartSize =
      (this.size.y - paddingPx) / yProps.length - paddingPx - xAxisHeight;
    for (let i = 0; i < yProps.length; i += 1) {
      const yKey = yProps[i];
      const yTop = paddingPx + (yChartSize + xAxisHeight + paddingPx) * i;

      const yAxis = this.getYAxis(yKey, [yTop + yChartSize, yTop]);
      const yAxisRender = d3.axisLeft(yAxis);

      this.renderXAxis(xAxisRenderer, yTop + yChartSize);
      this.renderYAxis(
        yAxisRender,
        paddingPx + yAxesWidth + labelMarginPx + labelSizePx
      );

      this.renderYText(yKey, paddingPx, yTop + yChartSize / 2);

      this.renderScatterPlot<'cylinderCount'>(yKey, xAxis, yAxis, function (v) {
        return colorAxis(sortedCarCylinderCounts.indexOf(v));
      });
    }

    for (const carId of this.data.selected) {
      this.markSelectedPoints(carId, true);
    }
  }

  clear() {
    this.svg.selectAll('*:not(defs)').remove();
    if (this.colorCodedLegendSvg) {
      this.colorCodedLegendSvg.selectAll('*').remove();
    }
  }

  disconnect() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private renderColorCodedLegend(
    axis: d3.ScaleLinear<string, string>,
    getValue: (value: number) => string
  ) {
    const svg = this.colorCodedLegendSvg;
    if (!svg) {
      return;
    }
    const domain = axis.domain();
    const values = [
      ...(domain[0] < domain[1]
        ? function* () {
            for (let i = domain[0]; i < domain[1]; i += 1) {
              yield i;
            }
          }
        : function* () {
            for (let i = domain[0]; i > domain[1]; i -= 1) {
              yield i;
            }
          })(),
    ];

    const container = svg.node()?.parentElement;
    if (!container) {
      throw new Error('Either there is no element or the element is detached!');
    }
    const size = container.getBoundingClientRect();
    const rectSize = {
      width: size.width / values.length,
      height: size.height / 2,
    };
    svg
      .attr('width', size.width)
      .attr('height', size.height)
      .selectAll()
      .data(values)
      .join('g')
      .each(function (v, i) {
        const g = d3.select(this);
        const x = rectSize.width * i;
        const value = getValue(v);

        g.append('rect')
          .attr('x', x)
          .attr('y', 0)
          .attr('width', rectSize.width)
          .attr('height', rectSize.height)
          .style('fill', axis(v))
          .attr('stroke', '#000')
          .attr('stroke-width', colorLegendStrokePx)
          .attr('data-value', value);

        g.append('text')
          .attr('x', x)
          .attr('y', rectSize.height + labelMarginPx + labelSizePx)
          .style('font', font)
          .text(value);
      });
  }

  private renderScatterPlot<K extends ColorCodedProperty>(
    yKey: YAxisVariable,
    xAxis: (x: number) => number,
    yAxis: (y: number) => number,
    colorAxis: (z: CarModel[K]) => string
  ) {
    const xKey = this.getXKeyTransformer();

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    return this.svg
      .append('g')
      .selectAll()
      .data(this.data.array)
      .join('circle')
      .style('cursor', 'pointer')
      .attr('cx', function (d) {
        return xAxis(xKey.toNumber(d[xKey.key]) || 0);
      })
      .attr('cy', function (d) {
        return yAxis(d[yKey] || 0);
      })
      .attr('r', pointRadiusPx)
      .style('fill', function (d) {
        return colorAxis(d[self.coloredProperty] as any);
      })
      .each(function (datum) {
        this?.setAttribute(idAttributeName, datum.carId.toString());
      })
      .on('mouseenter', function (event, datum) {
        self.data.setCurrent(datum.carId);
      })
      .on('mouseleave', function (event, datum) {
        self.data.setCurrent(null);
      })
      .on('click', function (event, datum) {
        self.data.toggle(datum.carId);
        console.log(self.data.selected.has(datum.carId), datum);
      });
  }

  private addDefs() {
    const defs = this.svg.append('defs');
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
    for (const datum of this.data.array) {
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
    const xAxisBoundingClientRect =
      this.getAxisBoundingClientRect(xAxisRenderer);
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
      const yAxisBoundingClientRect =
        this.getAxisBoundingClientRect(yAxisRenderer);
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

  private renderYText(text: string, x: number, y: number) {
    return this.svg
      .append('text')
      .style('font', font)
      .attr('text-anchor', 'middle')
      .attr('x', x)
      .attr('y', y)
      .attr('dx', 0)
      .attr('dy', labelSizePx)
      .attr('transform', `rotate(-90 ${x} ${y})`)
      .text(text);
  }

  private getAxisBoundingClientRect(
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

  private getTextBoundingClientRect(text: string) {
    const t = this.svg.append('text').style('font', font).text(text);
    const boundingRect = t.node()?.getBoundingClientRect();
    if (!boundingRect) {
      throw new Error(
        'Unknown error while getting size, maybe rendering failed'
      );
    }
    t.remove();
    return boundingRect;
  }

  private getXKeyTransformer(): XKeyTransformer {
    return enumToKey.get(this.xAxisType);
  }

  private markSelectedPoints(carId: number, selected: boolean) {
    const points = this.svg.selectAll(`[${idAttributeName}="${carId}"]`);
    if (selected) {
      points.each(function () {
        d3.select(this)
          .attr('stroke', '#000')
          .attr('stroke-width', selectedStrokeWidthPx)
          .raise();
      });
    } else {
      points.each(function () {
        d3.select(this).attr('stroke', null).attr('stroke-width', null);
      });
    }
  }
}

function getCarId(point: Maybe<SVGCircleElement>) {
  const attribute = point?.getAttribute(idAttributeName);
  return Number.parseInt(attribute ?? '');
}

interface CarLimits {
  x: AxisLimits;
  horsepower: AxisLimits;
  cityMpg: AxisLimits;
  highwayMpg: AxisLimits;
}

type YAxisVariable = Exclude<keyof CarLimits, 'x'>;

function getCarLimits() {
  return {
    x: getAxisLimits(),
    horsepower: getAxisLimits(),
    cityMpg: getAxisLimits(),
    highwayMpg: getAxisLimits(),
  };
}

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
