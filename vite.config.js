import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { remarkCodeHike } from "@code-hike/mdx"
import mdx from "@mdx-js/rollup"
import UnoCSS from 'unocss/vite'
import transformerDirectives from '@unocss/transformer-directives'
import theme from "./learn-mdx/theme/theme"
import { chunkSplitPlugin } from 'vite-plugin-chunk-split'
export default defineConfig({
	base: '/mini-vue',
	optimizeDeps: {
		include: ["react/jsx-runtime"],
	},
	plugins: [
		react(),
		mdx({
			remarkPlugins: [
				[remarkCodeHike, {
					theme,
					lineNumbers: true
				}]
			]
		}),
		UnoCSS({
			transformers: [
				transformerDirectives()
			]
		}),
		chunkSplitPlugin({
			customChunk({ id }) {
				if (id.includes('node_modules')) {
					return `vendor`
				}
				return null
			},
		}),
	],
})