import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { remarkCodeHike } from "@code-hike/mdx"
import mdx from "@mdx-js/rollup"
import theme from "./learn-mdx/theme/theme"

export default defineConfig({
	base: '/mini-vue',
	build: {
		outDir: 'dist'
	},
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
	],
})