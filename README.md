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

The project **doesn't** have any runtime dependencies.

However, it uses WebPack, TypeScript for building from the sources. For code linting _eslint_ with _prettier_ is used.

# Development

To start the local web server with watcher run:
```shell
npm start
```
This will start a watcher for files with auto reload.
> **If the changes are made to `./src/index.html`, the browser has to be refreshed manually**

# Description

The project provides a native canvas implementation for 2D scatter charts with an enum-like option.
There are two different CSV files that are separately visualised.
Both files have X and Y. For the first file there are 3 possible options `['a', 'b', 'c']`, for the second - `['bar', 'baz', 'foo']`. The options are marked with red (`#ff0000`), blue (`#0000ff`), and green (`#00ff00`).

## Chart implementation aspects

The chart is a normal Cartesian coordinate system, meaning that the relation of the X and Y axis is 1:1.

There are as many axes tick labels as possible. It is calculated with a 20 pixel spacing for X-axis and 10 pixels for Y-axis. This allows easier checking for the point coordinates.

The chart implementation used adaptability. The document font size is used as font size for the text in charts. Additionally, the implementation takes the window size as the size of the chart. This means that after resizing or zooming and pressing the "Load" button, the chart will be rerendered within the given constraints.

As a result, the implementation turned out to be a general-purpose library for scatter-plot data, that has 3 options as a third coordinate.

# TODO
- tree-shake RxJs.
