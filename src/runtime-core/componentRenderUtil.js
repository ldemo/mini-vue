import { ShapeFlag } from "../share"
import { cloneVNode } from "./vnode"

export function renderComponentRoot(instance) {
	const { render, proxy, attrs } = instance
	let result = render.call(proxy)

	if (attrs) {
		const keys = Object.keys(attrs)
		const { shapeFlag } = result
		if (keys.length) {
			if (shapeFlag & (ShapeFlag.ELEMENT | ShapeFlag.COMPONENT)) {
				result = cloneVNode(result, attrs)
			}
		}
	}
	return result
}