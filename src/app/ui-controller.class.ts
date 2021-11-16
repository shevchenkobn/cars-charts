import { ChartsXAxisType, ColorCodedProperty } from './charts/types';

export interface UiClasses {
  readonly xAxisType: string;
  readonly renderButton: string;
}
export interface UiChangeCallbacks {
  xAxisType(xAxisType: ChartsXAxisType): void;
  renderClicked(): void;
}
export interface UiControllerConfig {
  readonly selectors: UiClasses;
  readonly xAxisType: ChartsXAxisType;
  readonly colorCodedProperty: ColorCodedProperty;
  onXAxisTypeChange(xAxisType: ChartsXAxisType): void;
  onRenderClick(): void;
}

type ChangeListener = (this: HTMLInputElement, event: Event) => void;
type CheckboxListener = (this: HTMLInputElement, event: Event) => void;

export class UiController {
  private readonly config: UiControllerConfig;

  private readonly onXAxisTypeChangeListener: ChangeListener;
  private readonly onRenderClickListener: EventListener;
  private readonly onRenderEnterPressedListener: EventListener;

  constructor(config: UiControllerConfig) {
    this.config = config;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.onXAxisTypeChangeListener = function (event) {
      self.config.onXAxisTypeChange(this.value as ChartsXAxisType);
    };
    this.onRenderClickListener = function (event) {
      self.config.onRenderClick();
    };
    this.onRenderEnterPressedListener = function (event) {
      if ((event as GlobalEventHandlersEventMap['keydown']).key === 'Enter') {
        self.config.onRenderClick();
      }
    };
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
    const renderButton = document.querySelector(
      this.config.selectors.renderButton
    );
    if (!renderButton) {
      throw new TypeError('Button not found!');
    }
    renderButton.addEventListener('click', this.onRenderClickListener);
    renderButton.addEventListener('keydown', this.onRenderEnterPressedListener);
    return this;
  }

  dispose() {
    for (const element of document.querySelectorAll(
      this.config.selectors.xAxisType
    )) {
      element.removeEventListener('change', this.onXAxisTypeChangeListener);
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
    return this;
  }
}
