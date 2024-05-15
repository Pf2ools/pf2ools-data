# Contributing to Pf2ools' data project

More information will be added here at a later date. Until then, come talk with us in our [Discord server](https://discord.gg/2hzNxErtVu)!

## Integration with Visual Studio Code

If you use [Visual Studio Code](https://code.visualstudio.com/) or [VSCodium](https://vscodium.com/), you can set up repository-wide, schema-informed verification and suggestion. To do so, save the following code as `settings.json` and place it inside a directory named `.vscode/` within `pf2ools-data/`.

```json
{
	"json.schemas": [
		{
			"fileMatch": [
				"data/*/*/*.json",
				"data/*/*/*/*.json"
			],
			"url": "https://raw.githubusercontent.com/Pf2ools/pf2ools-schema/master/_dist/schema/data.json"
		}
	]
}
```

## Other ways to help

Finding data a bit overwhelming, or want to put different skills to use? There's other places open for contribution!

- **[pf2ools-app](https://github.com/Pf2ools/pf2ools-app):** create features, fix bugs, or write or improve the website's documentation
- **[pf2ools-schema](https://github.com/Pf2ools/pf2ools-schema):** propose improvements to the data-format itself, or add/improve annotations to aid converters in their work here
- **pf2ools-utils:** build or improve scripts to aid conversion, validation, or data manipulation
