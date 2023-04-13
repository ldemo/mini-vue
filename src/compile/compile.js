import { extend } from "../share"
import { baseParse } from "./parse"
import { transform } from "./transform"
import { transformText } from "./transforms/transfromText"

export const compile = (template, options) => {
	const ast = baseParse(template)

	transform(
		ast,
		extend({}, options, {
			nodeTransforms: [
				transformText
			],
			directiveTransforms: []
		})
	)
}