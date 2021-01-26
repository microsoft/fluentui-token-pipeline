🏠 [Home](./)

# Modifying the pipeline

## Setting up

1. Install [Node.js](https://nodejs.org/).
2. Run `npm install` once to install dependencies.
3. Install the recommended ESLint extension in Visual Studio Code (if you're using that as your editor).

## Building the pipeline

To build the pipeline's source code, just run `npm run build`. That's it! You can use `npm run watch` instead to automatically rebuild the code as you make changes.

The pipeline comes with a demo JSON file. You can transform it and output files to the `build` folder by running `npm run transform`.

## Verifying that it works

Open one of the pages in `src/demo/web/` in a browser after transforming to see some of the tokens used in code.

* [Sample app](src/demo/web/app-demo.html)
* [Button styles](src/demo/web/buttons-demo.html)
