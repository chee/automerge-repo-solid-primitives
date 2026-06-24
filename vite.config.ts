import {defineConfig} from "vitest/config"
import wasm from "vite-plugin-wasm"
import solid from "vite-plugin-solid"

export default defineConfig({
	test: {
		testTimeout: 1000,
		// happy-dom, not jsdom: jsdom's polyfills break wasm-bindgen
		// instanceof checks as values cross the wasm boundary.
		environment: "happy-dom",
		setupFiles: ["./testSetup.ts"],
		server: {
			deps: {
				inline: [/solid-js/],
			},
		},
	},
	plugins: [solid(), wasm()],
})
