export class OptionLabelHandler {
  readonly options: ReadonlyArray<string>;

  constructor(options: ReadonlyArray<string>) {
    this.options = options;
  }

  getOption = (label: string) => this.options.indexOf(label);

  getLabel = (option: number) => this.options[option];
}
