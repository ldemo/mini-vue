import { extend, isFunction } from "../share"
import { createVNode } from "./vnode"

export function createAppAPI (render) {

	return function (rootComponent) {
		if (isFunction(rootComponent)) {
			rootComponent = extend({}, rootComponent)
		}

		return {
			_component: rootComponent,
			
			mount(rootContainer) {
				const vnode = createVNode(rootComponent)
				render(vnode, rootContainer)
			}
		}
	}
}