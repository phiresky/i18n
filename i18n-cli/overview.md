```sh
i18n extract
```

```sh
# --partial: Don't delete non-uploaded categories
# --partial-categories: Don't delete anything in an uploaded category
i18n upload --partial --partial-categories
```

i18n-package.json

```json
{
	"packageName": "Notifications",
	"files": ["../**/*"],
	"defaultLang": "en"
}
```

```ts
// Everything must be extractable without type information!
const str = TransText({
    id: "6f6821e0",
    data: { minutes, amount: info.current_amount }
    default: 'The next rain will be in {minutes} {mapPlural {minutes} { one: <minute> many: <minutes> }}. It currently has {amount} coins.',
});
```

```json
{
	"versionId": 1234, // must exist on the server
	"i18nPackages": [
		{
			"packageId": "Notifications",
			"formats": [
				{
					"id": "6f6821e0",
					"default": "The next rain will be in {minutes} minutes. It currently has {amount} coins.",
					"origin": {
						"kind": "source",
						"url": "project://src/main.ts",
						"line": 10
					}
				}
			]
		}
	]
}
```
