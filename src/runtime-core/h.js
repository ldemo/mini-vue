import { createVNode, isVNode } from "./vnode";

export function h(type, props, children) {
	return createVNode(
		type,
		props,
		children === undefined
			? undefined
			: isVNode(children)
				? [children]
				: children
		)
}