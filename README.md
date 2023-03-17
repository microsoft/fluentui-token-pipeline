# Fluent UI token pipeline

The Fluent UI token pipeline transforms JSON files describing design tokens into source code for eventual use in the Fluent UI libraries.

This tool was originally designed to process files in Microsoft's proprietary design token format. Our design token files are now in the [W3C Design Token Community Group](https://design-tokens.github.io/community-group/format/) draft standard format, so this tool is no longer required to work with them.

Do not add new dependencies on this tool. Over time, it is expected that Fluent UI teams will transition from using this tool to using standard open source solutions for consuming design tokens. But while this tool is deprecated, it is still fully functional and will remain so for the foreseeable future. And since this tool can also read DTCG format JSON, existing code written when continues to work even though we no longer use this proprietary format.

* **[Documentation site](https://microsoft.github.io/fluentui-token-pipeline/)**
* [Source code on GitHub](https://github.com/microsoft/fluentui-token-pipeline)
* [`@fluentui/token-pipeline` on NPM](https://www.npmjs.com/package/@fluentui/token-pipeline)
* [Fluent UI design tokens on GitHub](https://github.com/microsoft/fluentui-design-tokens) 🔒 with links to packages of transformed tokens

---

# The legal stuff

The actual token values in the `src/demo` folder are just examples, and they do not represent an evolution of Microsoft's design systems.

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

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow Microsoft's [Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party's policies.
