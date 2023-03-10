import { isArray } from "../share";
import { createVNode } from "./vnode";

export function h(type, props, children) {
	return createVNode(
		type,
		props,
		children === undefined
			? undefined
			: isArray(children)
				? children
				: [children]
		)
}