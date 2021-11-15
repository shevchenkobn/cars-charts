import { CarsSvgCharts } from './charts';
// import { CanvasChart } from './charts/index.bkp';
import { ChartsXAxisType } from './charts/types';
import { loadCarsData } from './data-source';
import { CsvHtmlDataLoader } from './data-source/csv-data-loader.class';
import { DataReader } from './data-source/data-reader.class';
import { DataSource } from './data-source/data-source.class';
import { GuardedMap } from './lib/map';
import { OptionLabelHandler } from './lib/option-label-handler.class';
import { CsvNumber, DataPoint } from './lib/types';
import './polyfills';
import { UiController } from './ui-controller.class';

export const uiClassPrefix = 'app-ui';

const firstCsvOptions = new OptionLabelHandler(['a', 'b', 'c']);
const secondCsvOptions = new OptionLabelHandler(['foo', 'bar', 'baz']);

const initialKey = CsvNumber.First;
const initialRefreshEnabled = false;

async function main() {
  const dataSource = new DataSource().setData(await loadCarsData());
  const charts = new CarsSvgCharts({
    dataSource,
    container: document.querySelector('.app-chart')!,
    xAxisType: ChartsXAxisType.Prices,
    coloredProperty: 'cylinderCount',
  });
  // setInterval(() => {
  //   charts.render();
  // }, 1000);
  // const firstCsvElement = document.getElementById(toCsvId(CsvNumber.First));
  // const secondCsvElement = document.getElementById(toCsvId(CsvNumber.Second));
  // if (!firstCsvElement || !secondCsvElement) {
  //   throw new TypeError('Failed to get both CSV data elements!');
  // }
  // const dataLoaders = new GuardedMap<CsvNumber, CsvHtmlDataLoader<DataPoint>>([
  //   [
  //     CsvNumber.First,
  //     new CsvHtmlDataLoader<DataPoint>({
  //       element: firstCsvElement,
  //       httpRequest: {
  //         method: 'GET',
  //         url: 'http://cs.lnu.se/isovis/courses/fall21/4dv805/assignments/data1.csv',
  //       },
  //       rowParser(row) {
  //         return {
  //           x: Number.parseFloat(row[0]),
  //           y: Number.parseFloat(row[1]),
  //           option: firstCsvOptions.getOption(row[2]),
  //         };
  //       },
  //     }),
  //   ],
  //   [
  //     CsvNumber.Second,
  //     new CsvHtmlDataLoader<DataPoint>({
  //       element: secondCsvElement,
  //       httpRequest: {
  //         method: 'GET',
  //         url: 'http://cs.lnu.se/isovis/courses/fall21/4dv805/assignments/data2.csv',
  //       },
  //       rowParser(row) {
  //         return {
  //           x: Number.parseFloat(row[0]),
  //           y: Number.parseFloat(row[1]),
  //           option: secondCsvOptions.getOption(row[2]),
  //         };
  //       },
  //     }),
  //   ],
  // ]);
  //
  // const dataReader = new DataReader({
  //   dataLoaders,
  //   currentKey: initialKey,
  //   isRefreshEnabled: initialRefreshEnabled,
  // });
  //
  // const canvasElement = document.querySelector('.chart');
  // if (!(canvasElement instanceof HTMLCanvasElement)) {
  //   throw new TypeError('Canvas is not found!');
  // }
  // const chart = new CanvasChart(canvasElement);
  //
  // const uiController = new UiController({
  //   keys: Array.from(dataLoaders.keys()),
  //   currentKey: initialKey,
  //   isRefreshEnabled: initialRefreshEnabled,
  //   uiClassPrefix,
  //   onLoadRequest({ key, isRefreshEnabled }) {
  //     const labelHandler =
  //       key === CsvNumber.First ? firstCsvOptions : secondCsvOptions;
  //     return dataReader
  //       .setKey(key as any)
  //       .setRefreshEnabled(isRefreshEnabled)
  //       .read()
  //       .then((data) =>
  //         chart.render({
  //           points: data,
  //           getLabel: labelHandler.getLabel,
  //         })
  //       );
  //   },
  // });
  // uiController.init().handleLoad();
}

main().catch((error) => {
  console.error('FATAL:', error);
});

function toCsvId(csvNumber: CsvNumber) {
  return csvNumber + 'Csv';
}
