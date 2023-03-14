import { ShapeFlag } from "../share"
import { cloneVNode, normalizeVNode } from "./vnode"

export const renderComponentRoot = (instance) => {
	const { render, proxy, attrs } = instance
	let result = normalizeVNode(render.call(proxy))

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

export const shouldUpdateComponent = (n1, n2) => {
	const { props: p1 } = n1
	const { props: p2 } = n2

	if (p1 === p2) return false
	if (!p1) return !!p2
	if (!p2) return true

	return hasPropsChanged(p1, p2)
}

const hasPropsChanged = (prevProps, nextProps) => {
	const nextKeys = Object.keys(nextProps)

	if (Object.keys(prevProps).length !== nextKeys.length) return true

	for (let i = 0; i < nextKeys.length; i++) {
		const key = nextKeys[i]
		if (prevProps[key] !== nextProps[key]) {
			return true
		}
	}
	return false
}