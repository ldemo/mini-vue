import { ReactiveEffect } from "../reactive"
import { ShapeFlag } from "../share"
import { createAppAPI } from "./apiCreateApp"
import { setupComponent } from "./component"
import { renderComponentRoot } from "./componentRenderUtil"
import { normalizeChildren, normalizeVNode } from "./vnode"

export function createRenderer (nodeOps) {

	const {
		insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId,
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

				const subTree = instance.subTree = renderComponentRoot(instance)
				patch(null, subTree, container, anchor)
				vnode.el = subTree.el
				instance.isMounted = true
			} else {
				const nextTree = renderComponentRoot(instance)
				const prevTree = instance.subTree
        instance.subTree = nextTree
				patch(
					prevTree,
					nextTree,
					container,
					anchor
				)
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
			patchElement(n1, n2, container)
		}
	}

	const patchElement = (n1, n2, parentComponent) => {
		const el = n2.el = n1.el
		const oldProps = n1.props
		const newProps = n2.props

		patchChildren(n1, n2, el, null, parentComponent)
		patchProps(el, n2, oldProps, newProps)
	}

	const patchChildren = (n1, n2, container, anchor, parentComponent) => {
		const c1 = n1.children
		const c2 = n2.children
		const { shapeFlag } = n2
		const { shapeFlag: preShapeFlag = 0 } = n1

		// children has 3 possibilities: text, array or none
		
		// a t -> unmount set
		// t t -> set
		// n t -> set

		// a a -> patch
		// a n -> unmount

		// t a -> set mount
		// t n -> set
		// n a -> mount
		// n n
		if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
			if (preShapeFlag & ShapeFlag.ARRAY_CHILDREN) {
				unmountChildren(c1, parentComponent)
			}
			c2 !== c1 && hostSetElementText(container, c2)
		} else {
			if (preShapeFlag & ShapeFlag.ARRAY_CHILDREN) {
				if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
					patchKeyedChildren(
						c1,
						c2,
						container,
						anchor,
						parentComponent
					)
				} else {
					unmountChildren(c1, parentComponent)
				}
			} else {
				if (preShapeFlag & ShapeFlag.TEXT_CHILDREN) {
					hostSetElementText(container, '')
				}

				if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
					mountChildren(c1, container, anchor)
				}

			}
		}
	}

	const unmountChildren = (children, parentComponent) => {
		for(let i = 0; i < children.length; i++) {
			unmount(children[i], parentComponent)
		}
	}

	const unmount = (vnode, parentCompoent) => {

	}

	const patchKeyedChildren = (c1, c2, container, anchor, parentComponent) => {

	}

	const patchProps = (el, n2, oldProps, newProps) => {

		for(const key in (oldProps || {})) {
			!newProps[key] && hostPatchProp(
				el,
				key,
				oldProps[key],
				null
			)
		}

		for(const key in newProps) {
			hostPatchProp(
				el,
				key,
				oldProps[key],
				newProps[key]
			)
		}

	}

	const mountElement = (vnode, container, anchor) => {

		const { type, shapeFlag, children, props } = vnode
		let el = vnode.el = hostCreateElement(type)

		if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
			hostSetElementText(el, children)
		} else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
			mountChildren(children, el, null)
		}

		for (const key in (props || {})) {
			hostPatchProp(
				el,
				key,
				null,
				props[key],
			)
		}

		hostInsert(vnode.el, container, anchor)
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
