# Running

This project contains already prebuilt version as a single standalone file `./dist/index.html`.

This file can be safely copied to any place, all the information is bundled in the file.

An HTML5 browser is required to open the project.

# Building

To build the project (to `./dist`) run 2 commands in the project root:
```shell
npm i
npm run build
```

The project uses D3 and a set of helper libraries.

However, it uses WebPack, TypeScript for building from the sources. For code linting _eslint_ with _prettier_ is used.

# Development

To start the local web server with watcher run:
```shell
npm start
```
This will start a watcher for files with auto reload.
> **If the changes are made to `./src/index.html`, the browser has to be refreshed manually**

# Description



## Chart implementation aspects

The chart implementation used adaptability. The implementation takes the window size as the size of the chart. This means that after resizing or zooming and pressing the "Render" button, the chart will be rerendered within the given constraints.

The project renders 3 scatter plots with common X axes for easier checking.

As an X-axis 2 properties can be used:
- Price;
- Manufacturer;

As Y-axis data 3 properties are used:
- Horsepower;
- City MPG;
- Highway MPG;

As a color (third dimension) can show 2 properties:
- Cylinder count;
- Fuel type;

The connection between the points is done this way:
- when the point has hovered over, the point is highlighted in all 3 charts as well as the color scale of cylinder count or fuel type;
- when the point is clicked it is highlighted, the point is highlighted in all 3 charts and is shown in the table.

The missing values are shown on the axes in charts and with "-" in the table.

While switching between the 4 axes, there can be seen interesting correlations between the parameters.

# TODO
- tree-shake RxJs.
- format better labels.
