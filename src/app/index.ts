import './polyfills';
import { CarsSvgCharts } from './charts/scatter-plot-charts.class';
import { ChartsXAxisType, ColorCodedProperty } from './charts/types';
import { loadCarsData } from './data-source';
import { DataSource } from './data-source/data-source.class';
import { UiController } from './ui-controller.class';

const defaultXAxisType = ChartsXAxisType.Manufacturers;
const defaultColorCodedProperty: ColorCodedProperty = 'fuelType';

async function main() {
  const chartsContainer = document.querySelector('.app-chart');
  if (!chartsContainer) {
    throw new Error('Charts container is not found');
  }

  const dataSource = new DataSource().setData(await loadCarsData());
  const charts = new CarsSvgCharts({
    dataSource,
    container: chartsContainer,
    colorCodedLegendContainer:
      document.querySelector('.app-color-legend') ?? undefined,
    xAxisType: defaultXAxisType,
    colorCodedProperty: defaultColorCodedProperty,
  });
  const uiController = new UiController({
    selectors: {
      renderButton: '.app-ui-render',
      xAxisType: '.app-ui-x-selector',
      colorCodedKey: '.app-ui-colored-selector',
      table: '.app-data-table',
    },
    xAxisType: defaultXAxisType,
    colorCodedProperty: defaultColorCodedProperty,
    onRenderClick() {
      charts.render();
    },
    onXAxisTypeChange(xAxisType: ChartsXAxisType) {
      charts.render({
        xAxisType,
      });
    },
    onColorCodedPropertyChange(property: ColorCodedProperty) {
      charts.render({
        colorCodedProperty: property,
      });
    },
    dataSource,
  });
  uiController.init();
  charts.render();
}

main().catch((error) => {
  console.error('FATAL:', error);
});
