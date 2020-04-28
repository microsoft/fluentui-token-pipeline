# FluentUI token pipeline

The FluentUI token pipeline produces source code for the FluentUI libraries. **It is currently a proof-of-concept.**

Documentation on how our tokens are named, organized, and used is still in progress. For now, just contact the feature team with questions.

## Setting up

After cloning the repo, run `npm install` once to install dependencies.

## Configuring the pipeline (optional)

You can change the source tokens used for producing output in `src/tokens/fluentui.json`, or configure the pipeline to use a different location in `src/pipeline/config.js`. The pipeline will output files to the `build` folder; you can configure that in `config.js` as well.

*For more information about `config.js`, see the [style-dictionary](https://amzn.github.io/style-dictionary/) documentation: the FluentUI token pipeline uses `style-dictionary` for its configuration.*

## Building the pipeline

To build the pipeline and produce the output files, just run `npm run build`. That's it!

You can use `npm run watch` instead to automatically re-run the pipeline whenever you change the source tokens file `fluentui.json`.

## Verifying that it works

Open one of the pages in `src/demo/web/` in a browser after building to see some of the tokens used in code.

* [Sample app](src/demo/web/app-demo.html)
* [Button styles](src/demo/web/buttons-demo.html)

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
