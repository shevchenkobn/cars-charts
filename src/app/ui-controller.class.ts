import { Subject, takeUntil } from 'rxjs';
import { ChartsXAxisType, ColorCodedProperty } from './charts/types';
import { ReadonlyInteractiveDataSource } from './data-source/data-source.class';
import { CarId } from './data-source/types';
import { Nullable } from './lib/types';
import * as d3 from 'd3';

export interface UiSelectors {
  readonly xAxisType: string;
  readonly colorCodedKey: string;
  readonly renderButton: string;
  readonly table: string;
}
export interface UiChangeCallbacks {
  xAxisType(xAxisType: ChartsXAxisType): void;
  renderClicked(): void;
}
export interface UiControllerConfig {
  readonly selectors: UiSelectors;
  readonly xAxisType: ChartsXAxisType;
  readonly colorCodedProperty: ColorCodedProperty;
  onXAxisTypeChange(xAxisType: ChartsXAxisType): void;
  onColorCodedPropertyChange(property: ColorCodedProperty): void;
  onRenderClick(): void;
  dataSource: ReadonlyInteractiveDataSource;
}

type ChangeListener = (this: HTMLInputElement, event: Event) => void;
type CheckboxListener = (this: HTMLInputElement, event: Event) => void;

export class UiController {
  private readonly config: UiControllerConfig;

  private readonly onXAxisTypeChangeListener: ChangeListener;
  private readonly onColorCodedPropertyChangeListener: ChangeListener;
  private readonly onRenderClickListener: EventListener;
  private readonly onRenderEnterPressedListener: EventListener;
  private destroy$: Nullable<Subject<boolean>> = null;
  private table: d3.Selection<any, any, any, any>;

  constructor(config: UiControllerConfig) {
    this.config = config;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.onXAxisTypeChangeListener = function (event) {
      self.config.onXAxisTypeChange(this.value as ChartsXAxisType);
    };
    this.onColorCodedPropertyChangeListener = function (event) {
      self.config.onColorCodedPropertyChange(this.value as ColorCodedProperty);
    };
    this.onRenderClickListener = function (event) {
      self.config.onRenderClick();
    };
    this.onRenderEnterPressedListener = function (event) {
      if ((event as GlobalEventHandlersEventMap['keydown']).key === 'Enter') {
        self.config.onRenderClick();
      }
    };

    this.table = d3.select(this.config.selectors.table);
    if (!this.table.node() || this.table.node().tagName !== 'TABLE') {
      throw new Error('Failed to load table!');
    }
  }

  init() {
    for (const element of document.querySelectorAll(
      this.config.selectors.xAxisType
    )) {
      element.addEventListener('change', this.onXAxisTypeChangeListener);
      if (this.config.xAxisType === element.getAttribute('value')) {
        (element as HTMLInputElement).checked = true;
      }
    }
    for (const element of document.querySelectorAll(
      this.config.selectors.colorCodedKey
    )) {
      element.addEventListener(
        'change',
        this.onColorCodedPropertyChangeListener
      );
      if (this.config.colorCodedProperty === element.getAttribute('value')) {
        (element as HTMLInputElement).checked = true;
      }
    }
    const renderButton = document.querySelector(
      this.config.selectors.renderButton
    );
    if (!renderButton) {
      throw new TypeError('Button not found!');
    }
    renderButton.addEventListener('click', this.onRenderClickListener);
    renderButton.addEventListener('keydown', this.onRenderEnterPressedListener);
    this.destroy$ = new Subject<boolean>();
    this.table.select('*').remove();
    this.table
      .append('tr')
      .selectAll()
      .data([
        'Price',
        'Manufacturer',
        'Fuel Type',
        'Cylinder count',
        'Horsepower',
        'City MPG',
        'Highway MPG',
      ])
      .join('th')
      .each(function (header) {
        if (!this) {
          throw new Error('No row!');
        }
        this.innerHTML = header;
      });
    for (const carId of this.config.dataSource.selected) {
      this.processSelected(carId, true);
    }
    this.config.dataSource.selected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ carId, selected }) => {
        this.processSelected(carId, selected);
      });
    return this;
  }

  dispose() {
    for (const element of document.querySelectorAll(
      this.config.selectors.xAxisType
    )) {
      element.removeEventListener('change', this.onXAxisTypeChangeListener);
    }
    for (const element of document.querySelectorAll(
      this.config.selectors.colorCodedKey
    )) {
      element.removeEventListener(
        'change',
        this.onColorCodedPropertyChangeListener
      );
    }
    const renderButton = document.querySelector(
      this.config.selectors.renderButton
    );
    if (!renderButton) {
      throw new TypeError('Button not found!');
    }
    renderButton.removeEventListener('click', this.onRenderClickListener);
    renderButton.removeEventListener(
      'keydown',
      this.onRenderEnterPressedListener
    );
    if (this.destroy$) {
      this.destroy$.next(true);
      this.destroy$.complete();
      this.destroy$ = null;
    }
    return this;
  }

  private processSelected(carId: CarId, selected: boolean) {
    if (!selected) {
      this.table.select(`[data-id="${carId}"]`).remove();
    } else {
      const car = this.config.dataSource.map.get(carId);
      this.table
        .append('tr')
        .attr('data-id', carId)
        .selectAll()
        .data([
          formatNaN(car.price, (value) => value.toLocaleString()),
          car.manufacturer,
          car.fuelType,
          formatNaN(car.cylinderCount, (value) => value.toString()),
          formatNaN(car.horsepower, (value) => value.toString()),
          formatNaN(car.cityMpg, (value) => value.toString()),
          formatNaN(car.highwayMpg, (value) => value.toString()),
        ])
        .join('td')
        .each(function (value) {
          if (!this) {
            throw new Error('No row td!');
          }
          this.innerHTML = value;
        });
    }
  }
}

function formatNaN(value: number, formatter: (value: number) => string) {
  if (Number.isNaN(value)) {
    return '-';
  }
  return formatter(value);
}
