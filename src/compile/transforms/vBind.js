import { createObjectProperty } from "../ast"

export const transformBind = (dir, _node, context) => {
	const { exp, modifiers, arg } = dir

	return {
    props: [createObjectProperty(arg, exp)]
  }
}