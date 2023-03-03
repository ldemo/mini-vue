import { ReactiveEffect } from "../reactive"
import { ShapeFlag } from "../share"
import { createAppAPI } from "./apiCreateApp"
import { setupComponent } from "./component"
import { renderComponentRoot } from "./componentRenderUtil"
import { normalizeChildren, normalizeVNode } from "./vnode"

export function createRenderer (nodeOps) {

	const {
		insert,
    remove,
    patchProp,
    createElement,
    createText,
    createComment,
    setText,
    setElementText,
    parentNode,
    nextSibling,
    setScopeId,
	} = nodeOps

	const patch = (n1, n2, container, anchor) => {
		if (n1 === n2) return

		const { type, shapeFlag } = n2
		switch(type) {
			default:
				if (shapeFlag & ShapeFlag.ELEMENT) {
					processElement(n1, n2, container, anchor)
				} else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
					processComponent(n1, n2, container, anchor)
				}
		}
	}

	const processComponent = (n1, n2, container, anchor) => {
		if (!n1) {
			mountComponent(n2, container, anchor)
		} else {
			updateComponent(n1, n2, container, anchor)
		}
	}

	const mountComponent = (vnode, container, anchor) => {
		const { type } = vnode

		const instance = vnode.component = {
			vnode,
			type,
			parent: container,

			ctx: {},
			data: {},
			props: {},
			attrs: {},
			slots: {},
			setupState: {},
			setupContext: null
		}

		instance.ctx._ = instance

		setupComponent(instance)

		setupRenderEffect(
			instance,
			vnode,
			container,
			anchor
		)
	}

	const setupRenderEffect = (instance, vnode, container, anchor) => {
		const componentUpdateFn = () => {
			if (!instance.isMounted) {
				const { el } = vnode

				if (!el) {
					const subTree = instance.subTree = renderComponentRoot(instance)
					patch(null, subTree, container, anchor)
					vnode.el = subTree.el
				}
			} else {
				// update
			}
		}

		const effect = new ReactiveEffect(componentUpdateFn)
		const update = instance.update = () => effect.run()

		update()
	}

	const updateComponent = (n1, n2, container, anchor) => {

	}

	const processElement = (n1, n2, container, anchor) => {
		if (!n1) {
			mountElement(n2, container, anchor)
		} else {
			// patch element
		}
	}

	const mountElement = (vnode, container, anchor) => {

		const { type, shapeFlag, children } = vnode
		let el = vnode.el = createElement(type)

		if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
			setElementText(el, children)
		} else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
			mountChildren(children, el, null)
		}

		insert(vnode.el, container, anchor)
	}

	const mountChildren = (children, el, anchor) => {
		for(let i = 0; i < children.length; i++) {
			let child = normalizeVNode(children[i])
			patch(null, child, el, anchor)
		}
	}

	const render = (vnode, container) => {
		patch(container._vnode, vnode, container, null)
	}

	return {
		createApp: createAppAPI(render)
	}
}
