import { DeepReadonlyArray, Nullable } from './lib/types';

export interface LoadRequest {
  key: string;
  isRefreshEnabled: boolean;
}
export interface UiClasses {
  readonly xAxis: string;
  readonly renderButton: string;
}
export interface UiControllerConfig {
  readonly classes: UiClasses;

  readonly keys: DeepReadonlyArray<string>;
  readonly uiClassPrefix: string;
  onLoadRequest(event: LoadRequest): Promise<void>;

  readonly currentKey: string;
  readonly isRefreshEnabled: boolean;
}

export type ChangeListener = (this: HTMLInputElement, event: Event) => void;
export type CheckboxListener = (this: HTMLInputElement, event: Event) => void;

export class UiController {
  private readonly keys: DeepReadonlyArray<string>;
  private readonly uiClassPrefix: string;
  private readonly loadRequested: UiControllerConfig['onLoadRequest'];
  private key: string;
  private isRefreshEnabled: boolean;

  private readonly onChangeListener: ChangeListener;
  private readonly onCheckboxListener: CheckboxListener;
  private readonly onLoadButtonClickListener: EventListener;
  private readonly onLoadButtonEnterPressedListener: EventListener;

  private get refreshEnabledClassList() {
    return `.${this.uiClassPrefix}-refresh`;
  }
  private get loadButtonClassList() {
    return `.${this.uiClassPrefix}-load`;
  }
  private get selectorClassList() {
    return `.${this.uiClassPrefix}-selector`;
  }

  constructor(config: UiControllerConfig) {
    this.keys = config.keys;
    this.uiClassPrefix = config.uiClassPrefix;
    this.loadRequested = config.onLoadRequest;

    this.key = config.currentKey;
    this.isRefreshEnabled = config.isRefreshEnabled;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.onChangeListener = function (event) {
      self.handleChange(this, event);
    } as ChangeListener;
    this.onCheckboxListener = function (event) {
      self.handleCheckboxChange(this, event);
    } as CheckboxListener;
    this.onLoadButtonClickListener = function () {
      self.handleLoad();
    };
    this.onLoadButtonEnterPressedListener = function (event) {
      if ((event as GlobalEventHandlersEventMap['keydown']).key === 'Enter') {
        self.handleLoad();
      }
    };
  }

  init() {
    for (const element of document.querySelectorAll(this.selectorClassList)) {
      element.addEventListener('change', this.onChangeListener);
      if (this.key === element.getAttribute('value')) {
        (element as HTMLInputElement).checked = true;
      }
    }
    const refreshCheckbox = document.querySelector(
      this.refreshEnabledClassList
    ) as HTMLInputElement;
    const loadButton = document.querySelector(this.loadButtonClassList);
    if (!refreshCheckbox || !loadButton) {
      throw new TypeError('Button or checkbox not found!');
    }

    refreshCheckbox.addEventListener('change', this.onCheckboxListener);
    refreshCheckbox.checked = this.isRefreshEnabled;

    loadButton.addEventListener('click', this.onLoadButtonClickListener);
    loadButton.addEventListener(
      'keydown',
      this.onLoadButtonEnterPressedListener
    );

    return this;
  }

  dispose() {
    for (const element of document.querySelectorAll(this.selectorClassList)) {
      element.removeEventListener('change', this.onChangeListener);
    }
    const refreshCheckbox = document.querySelector(
      this.refreshEnabledClassList
    );
    const loadButton = document.querySelector(this.loadButtonClassList);
    if (!refreshCheckbox || !loadButton) {
      throw new TypeError('Button or checkbox not found!');
    }

    refreshCheckbox.removeEventListener('change', this.onCheckboxListener);
    loadButton.removeEventListener('click', this.onLoadButtonClickListener);
    loadButton.removeEventListener(
      'keydown',
      this.onLoadButtonEnterPressedListener
    );

    return this;
  }

  handleLoad() {
    const element = document.querySelector(
      this.loadButtonClassList
    ) as Nullable<HTMLButtonElement>;
    const callback = () => {
      if (element) {
        element.disabled = false;
      }
    };
    if (element) {
      element.disabled = true;
    }
    this.loadRequested({
      key: this.key,
      isRefreshEnabled: this.isRefreshEnabled,
    })
      .then(callback)
      .catch((error) => {
        console.error('ERROR:', error);
        callback();
      });

    return this;
  }

  private handleChange(
    element: HTMLInputElement,
    ev: HTMLElementEventMap['change']
  ) {
    for (const key of this.keys) {
      if (element.value === key) {
        this.key = key;
      }
    }
  }

  private handleCheckboxChange(
    element: HTMLInputElement,
    ev: HTMLElementEventMap['change']
  ) {
    this.isRefreshEnabled = element.checked;
  }
}
