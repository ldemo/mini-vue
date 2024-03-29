import { extend } from "../share"
import { generate } from "./codegen"
import { baseParse } from "./parse"
import { transform } from "./transform"
import { transformElement } from "./transforms/transformElement"
import { transformText } from "./transforms/transfromText"
import { transformBind } from "./transforms/vBind"
import { transformOn } from "./transforms/vOn"

export const compile = (template, options) => {
	const ast = baseParse(template)

	transform(
		ast,
		extend({}, options, {
			nodeTransforms: [
				transformElement,
				transformText
			],
			directiveTransforms: {
				bind: transformBind,
				on: transformOn
			}
		})
	)
	return generate(ast)
}