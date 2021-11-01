import { HttpRequest, requestHttpText } from '../lib/http';
import { DeepReadonly } from '../lib/types';
import { DataLoader } from './types';

export type RowParser<T> = (row: string[]) => T;
export interface CsvHtmlDataLoaderConfig<T = any> {
  readonly element: InnerHTML;
  readonly httpRequest: DeepReadonly<HttpRequest>;
  readonly rowParser: RowParser<T>;
}

export class CsvHtmlDataLoader<T = any> implements DataLoader<T> {
  private element: InnerHTML;
  private httpRequest: HttpRequest;
  private readonly parseRow: RowParser<T>;

  constructor(config: CsvHtmlDataLoaderConfig) {
    this.element = config.element;
    this.httpRequest = { ...config.httpRequest };
    this.parseRow = config.rowParser;
  }

  load(): Promise<T[]> {
    return Promise.resolve(this.parseCsv(this.element.innerHTML));
  }

  refresh(): Promise<T[]> {
    return requestHttpText(this.httpRequest).then((text) =>
      this.parseCsv(text)
    );
  }

  private parseCsv(text: string) {
    const rows: (T | string[])[] = parseCsv(text);
    for (let i = 0; i < rows.length; i += 1) {
      rows[i] = this.parseRow(rows[i] as string[]);
    }
    return rows as T[];
  }
}

export function parseCsv(text: string) {
  const rows: (string | string[])[] = text.split('\n');
  for (let i = 0; i < rows.length; i += 1) {
    rows[i] = (rows[i] as string).split(',');
  }
  return rows as string[][];
}
