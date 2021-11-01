import { GuardedMap, ReadonlyGuardedMap } from '../lib/map';
import { DataPoint, DeepReadonlyArray } from '../lib/types';
import { CanvasChartData } from './types';

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

export class CanvasChart {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private points: DeepReadonlyArray<DataPoint> = [];
  private getOptionLabel = defaultOptionLabelGetter;

  private size: Coordinates = { x: 0, y: 0 };
  private limits: Limits = getLimits();
  private axisLabelSize: Coordinates = { x: 0, y: 0 };
  private axisStep: Coordinates = { x: 0, y: 0 };
  private factors: Coordinates = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new TypeError('Failed to get 2D context!');
    }
    this.context = context;
  }

  async render(data?: CanvasChartData) {
    if (data) {
      this.points = data.points;
      this.getOptionLabel = data.getLabel ?? defaultOptionLabelGetter;
    }

    this.updateCanvasSize();

    this.updateLimits();
    this.updateAxisLabelSize();
    this.calculateAxisSteps();
    this.normalizeLimits();
    this.calculateFactors();

    this.context.clearRect(0, 0, this.size.x, this.size.y);
    this.drawAxes();
    this.drawLegend();
    this.drawPoints();
  }

  private drawLegend() {
    const set = new Set<number>();
    const y = legendHeightPx / 2;
    let x = legendHeightPx / 2;
    for (const { option } of this.points) {
      if (set.has(option)) {
        continue;
      }
      const label = this.getOptionLabel(option);
      const color = colors.get(option);

      this.drawPoint({ x: x - pointSizePx / 2, y: y - pointSizePx / 2 }, color);
      x += pointSizePx;
      this.writeText({ x, y }, label);
      x += this.getTextWidth(label) + paddingPx;
      set.add(option);
    }
  }

  private drawPoints() {
    for (const point of this.points) {
      this.drawPoint(
        { x: this.getCanvasX(point.x), y: this.getCanvasY(point.y) },
        colors.get(point.option)
      );
    }
  }

  private drawAxes() {
    // X Axis
    const xAxisY = this.getCanvasY(0);
    this.drawLine({ x: 0, y: xAxisY }, { x: this.size.x, y: xAxisY });
    // Y Axis
    const yAxisX = this.getCanvasX(0);
    this.drawLine(
      { x: yAxisX, y: legendHeightPx },
      { x: yAxisX, y: this.size.y }
    );

    // X Axis Ticks
    const drawXTicks = (x: number) => {
      this.drawLine(
        { x, y: xAxisY - tickLengthPx / 2 },
        { x, y: xAxisY + tickLengthPx / 2 }
      );
      this.writeText(
        { x, y: xAxisY - this.axisLabelSize.y / 2 },
        this.numberToString(this.getX(x))
      );
    };
    for (let x = yAxisX - this.axisStep.x; x >= 0; x -= this.axisStep.x) {
      drawXTicks(x);
    }
    for (
      let x = yAxisX + this.axisStep.x;
      x <= this.size.x;
      x += this.axisStep.x
    ) {
      drawXTicks(x);
    }

    // Y Axis Ticks
    const drawYTicks = (y: number) => {
      this.drawLine(
        { x: yAxisX - tickLengthPx / 2, y },
        { x: yAxisX + tickLengthPx / 2, y }
      );
      this.writeText(
        { x: yAxisX + tickLengthPx, y: y + this.axisLabelSize.y / 2 },
        this.numberToString(this.getY(y))
      );
    };
    for (
      let y = xAxisY - this.axisStep.y;
      y >= legendHeightPx;
      y -= this.axisStep.y
    ) {
      drawYTicks(y);
    }
    for (
      let y = xAxisY + this.axisStep.y;
      y <= this.size.y;
      y += this.axisStep.y
    ) {
      drawYTicks(y);
    }
  }

  private drawLine(start: Coordinates, end: Coordinates) {
    const oldStyle = this.context.strokeStyle;
    const oldWidth = this.context.lineWidth;
    this.context.beginPath();
    this.context.strokeStyle = `black ${axisWidthPx}px`;
    this.context.lineWidth = axisWidthPx;
    this.context.moveTo(start.x, start.y);
    this.context.lineTo(end.x, end.y);
    this.context.stroke();
    this.context.strokeStyle = oldStyle;
    this.context.lineWidth = oldWidth;
  }

  private writeText(position: Coordinates, text: string) {
    const oldText = this.context.font;
    this.context.font = this.axisLabelSize.y + 'px ' + font;
    this.context.fillText(text, position.x, position.y);
    this.context.font = oldText;
  }

  private drawPoint(point: Coordinates, color: string) {
    const oldStyle = this.context.fillStyle;
    this.context.fillStyle = color;
    this.context.beginPath();
    this.context.fillRect(
      point.x - pointSizePx / 2,
      point.y - pointSizePx / 2,
      pointSizePx,
      pointSizePx
    );
    this.context.fillStyle = oldStyle;
  }

  private updateLimits(): Limits {
    this.limits = getLimits();
    for (const { x, y } of this.points) {
      if (x < this.limits.x.min) {
        this.limits.x.min = x;
      }
      if (x > this.limits.x.max) {
        this.limits.x.max = x;
      }
      if (y < this.limits.y.min) {
        this.limits.y.min = y;
      }
      if (y > this.limits.y.max) {
        this.limits.y.max = y;
      }
    }
    return this.limits;
  }

  private updateAxisLabelSize(): Coordinates {
    this.axisLabelSize = {
      x: 0,
      y: Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize
      ),
    };
    for (const { y } of this.points) {
      this.context.font = this.axisLabelSize.y + 'px ' + font;
      this.axisLabelSize.x = this.getTextWidth(this.numberToString(y));
    }
    return this.axisLabelSize;
  }

  private getTextWidth(text: string) {
    this.context.font = this.axisLabelSize.y + 'px ' + font;
    return this.context.measureText(text).width;
  }

  private updateCanvasSize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.size = { x: width, y: height };
    this.canvas.width = this.size.x;
    this.canvas.height = this.size.y;
    return this.size;
  }

  private calculateAxisSteps() {
    this.axisStep.x = this.axisLabelSize.x + xIntervalPx;
    this.axisStep.y = this.axisLabelSize.y + yIntervalPx;
    return this.axisStep;
  }

  private calculateFactors() {
    // this.factors.x = (this.size.x - paddingPx * 2) / Math.abs(this.limits.x.max - this.limits.x.min);
    // this.factors.y = (this.size.y - paddingPx * 2) / Math.abs(this.limits.y.max - this.limits.y.min);
    this.factors.x = Math.min(
      (this.size.x - paddingPx * 2) /
        Math.abs(this.limits.x.max - this.limits.x.min),
      (this.size.y - paddingPx * 2 - legendHeightPx) /
        Math.abs(this.limits.y.max - this.limits.y.min)
    );
    this.factors.y = this.factors.x;
  }

  private normalizeLimits() {
    // const xNormalFactor = mathSignedCeil(this.size.x / this.axisStep.x) * this.axisStep.x;
    // const yNormalFactor = mathSignedCeil((this.size.y - legendHeightPx) / this.axisStep.y) * this.axisStep.y;
    // this.limits.x.min *= mathSignedCeil(this.limits.x.min / this.axisStep.x) * this.axisStep.x;
    // this.limits.x.max *= mathSignedCeil(this.limits.x.max / this.axisStep.x) * this.axisStep.x;
    // this.limits.y.min *= mathSignedCeil(this.limits.y.min / this.axisStep.y) * this.axisStep.y;
    // this.limits.y.max *= mathSignedCeil(this.limits.y.max / this.axisStep.y) * this.axisStep.y;
    // this.limits.x.min -= paddingPx;
    // this.limits.x.max += paddingPx;
    // this.limits.y.min -= paddingPx;
    // this.limits.y.max += paddingPx;
  }

  private getCanvasX(x: number) {
    return paddingPx + (x - Math.min(this.limits.x.min, 0)) * this.factors.x;
  }

  private getX(canvasX: number) {
    return (
      (canvasX - paddingPx) / this.factors.x + Math.min(this.limits.x.min, 0)
    );
  }

  private getCanvasY(y: number) {
    return (
      this.size.y -
      (y - Math.min(this.limits.y.min, 0)) * this.factors.y -
      paddingPx
    );
  }

  private getY(canvasY: number) {
    return (
      -(canvasY - this.size.y + paddingPx) / this.factors.y +
      Math.min(this.limits.y.min, 0)
    );
  }

  private numberToString(value: number) {
    return value.toFixed(2);
  }
}

export function defaultOptionLabelGetter(option: number) {
  return option.toString();
}

interface Limits {
  x: AxisLimits;
  y: AxisLimits;
}

function getLimits() {
  return {
    x: {
      min: 0,
      max: 0,
    },
    y: {
      min: 0,
      max: 0,
    },
  };
}

interface AxisLimits {
  min: number;
  max: number;
}

interface Coordinates {
  x: number;
  y: number;
}
