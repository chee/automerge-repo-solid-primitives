import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import solid from "eslint-plugin-solid"

export default [
	{files: ["**/*.{js,mjs,cjs,ts}"]},
	{languageOptions: {globals: globals.browser}},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	solid.configs["flat/typescript"],
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn", // or "error"
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"prefer-const": "off",
			"solid/event-handlers": [
				"warn",
				{
					ignoreCase: true,
					warnOnSpread: false,
				},
			],
		},
	},
]
