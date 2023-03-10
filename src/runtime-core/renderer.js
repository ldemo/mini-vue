import { ReactiveEffect } from "../reactive"
import { ShapeFlag } from "../share"
import { createAppAPI } from "./apiCreateApp"
import { setupComponent } from "./component"
import { normalizePropsOption, updateProps } from "./componentProps"
import { renderComponentRoot, shouldUpdateComponent } from "./componentRenderUtil"
import { Fragment, isSameVNodeType, normalizeChildren, normalizeVNode, Text } from "./vnode"

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

	const patch = (n1, n2, container, anchor, parentComponent) => {
		if (n1 === n2) return

		const { type, shapeFlag } = n2
		switch(type) {
			case Text:
				processText(n1, n2, container, anchor)
				break
			case Fragment:
				processFragment(n1, n2, container, anchor, parentComponent)
				break
			default:
				if (shapeFlag & ShapeFlag.ELEMENT) {
					processElement(n1, n2, container, anchor, parentComponent)
				} else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
					processComponent(n1, n2, container, anchor, parentComponent)
				}
		}
	}

	const processText = (n1, n2, container, anchor) => {
		if (!n1) {
			hostInsert(
				(n2.el = hostCreateText(n2.children)),
				container,
				anchor)
		} else {
			const el = n2.el = n1.el
			if (n2.children !== n1.children) {
				hostSetText(el, n2.children)
			}
		}
	}

	const processFragment = (n1, n2, container, anchor, parentComponent) => {
		const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText('')
		const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText('')

		if (n1 == null) {
			hostInsert(fragmentStartAnchor, container, anchor)
			hostInsert(fragmentEndAnchor, container, anchor)

			mountChildren(
				n2.children,
				container,
				fragmentEndAnchor,
				parentComponent
			)
		} else {
			patchChildren(
				n1.children,
				n2.children,
				container,
				fragmentEndAnchor,
				parentComponent
			)
		}
	}

	const processComponent = (n1, n2, container, anchor, parentComponent) => {
		if (!n1) {
			mountComponent(n2, container, anchor, parentComponent)
		} else {
			updateComponent(n1, n2)
		}
	}

	const mountComponent = (vnode, container, anchor) => {
		const { type } = vnode

		const instance = vnode.component = {
			vnode,
			type,
			parent: container,

			propsOptions: normalizePropsOption(type),

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
				// updateComponent
        // This is triggered by mutation of component's own state (next: null)
        // OR parent calling processComponent (next: VNode)
				let { next, vnode } = instance

				if (next) {
					next.el = vnode.el
					updateComponentPreRender(instance, next)
				} else {
					next = vnode
				}
				const nextTree = renderComponentRoot(instance)
				const prevTree = instance.subTree
        instance.subTree = nextTree
				patch(
					prevTree,
					nextTree,
					hostParentNode(prevTree.el),
					hostNextSibling(prevTree.anchor || prevTree.el),
					instance
				)
				next.el = nextTree.el
			}
		}

		const effect = new ReactiveEffect(componentUpdateFn)
		const update = instance.update = () => effect.run()

		update()
	}

	const updateComponentPreRender = (instance, nextVNode) => {
		nextVNode.component = instance
		const prevProps = instance.vnode.props
		instance.vnode = nextVNode
		instance.next = null

		updateProps(instance, nextVNode.props, prevProps)
	}

	const updateComponent = (n1, n2) => {
		const instance = n2.component = n1.component

		if (shouldUpdateComponent(n1, n2)) {
			instance.next = n2
			instance.update()
		} else {
			n2.el = n1.el
			instance.vnode = n2
		}
	}

	const processElement = (n1, n2, container, anchor, parentComponent) => {
		if (!n1) {
			mountElement(n2, container, anchor, parentComponent)
		} else {
			patchElement(n1, n2, parentComponent)
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
					mountChildren(c2, container, anchor, parentComponent)
				}

			}
		}
	}

	const unmountChildren = (children, parentComponent) => {
		for(let i = 0; i < children.length; i++) {
			unmount(children[i], parentComponent)
		}
	}

	const unmount = (vnode, parentComponent, doRemove) => {
		if (doRemove) {
			remove(vnode)
		}
	}

	const remove = vnode => {
		hostRemove(vnode.el)
	}

	const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent) => {

		let i = 0
		const l2 = c2.length
		let e1 = c1.length - 1
		let e2 = l2 - 1

		// 1 sync from start
		// (a b) c
		// (a b) d e
		while (i <= e1 && i <= e2) {
			const n1 = c1[i]
			const n2 = normalizeVNode(c2[i])

			if (isSameVNodeType(n1, n2)) {
				patch(
					n1,
					n2,
					container,
					null,
					parentComponent
				)
				i++
			} else {
				break
			}
		}

		// 2 sync from end
		// a (b c)
		// d e (b c)
		while(i <= e1 && i <= e2) {
			const n1 = c1[e1]
			const n2 = normalizeVNode(c2[e2])
			if (isSameVNodeType(n1, n2)) {
				patch(
					n1,
					n2,
					container,
					null,
					parentComponent
				)
				e1--
				e2--
			} else {
				break
			}
		}

		// 3 common sequence + mount
		// (a b)
		// (a b) c
		// i = 2 e1 = 1 e2 = 2
		// (a b)
		// c (a b)
		// i = 0 e1 = -1 e2 = 0
		if (i > e1) {
			if (i <= e2) {
				let anchor = e2 + 1 < l2 ? (c2[e2 + 1]).el : parentAnchor
				while(i <= e2) {
					const n2 = normalizeVNode(c2[i])
					patch(
						null,
						n2,
						container,
						anchor,
						parentComponent
					)
					i++
				}
			}
		}

		// 4 common sequence unmount
		// (a b) c
		// (a b)
		// i = 2 e1 = 2 e2 = 1
		// c (a b)
		// (a b)
		// i = 0 e1 = 0 e2 = -1
		else if (i > e2) {
			while(i <= e1) {
				unmount(c1[i], parentComponent, true)
				i++
			}
		}

		// 5 unknow sequence
		// [i ... e1 + 1] a b [c d e] f g
		// [i ... e2 + 1] a b [e d c h] f g
		// i = 2 e1 = 4 e2 = 5
		else {
			const s1 = i
			const s2 = i

			// 5.1 build key:index map for new children
			const keyToNewIndexMap = new Map()
			for (i = s2; i <= e2 + 1; i++) {
				const nextChild = normalizeVNode(c2[i])
				if (nextChild.key !== null) {
					keyToNewIndexMap.set(nextChild.key, i)
				}
			}

			// 5.2 loop through old children left to be patched and try to patch
			// matching nodes & remove nodes that are no longer present

			let j
			let patched = 0
			const toBePatched = e2 - s2 + 1
			let moved = false
			let maxNewIndexSoFar = 0

			const newIndexToOldIndexList = new Array(toBePatched)
			for(i = 0; i < toBePatched; i++) newIndexToOldIndexList[i] = 0

			for(i = s1; i <= e1; i++) {
				let prevChild = c1[i]
				if (patched >= toBePatched) {
					unmount(prevChild, parentComponent, true)
					continue
				}

				let newIndex
				let key = prevChild.key
				if (key !== null) {
					newIndex = keyToNewIndexMap.get(key)
				} else {
					// key less
					for(j = s2; j <= e2; j++) {
						if (
							newIndexToOldIndexList[j - s2] === 0 &&
							isSameVNodeType(prevChild, c2[j])
						) {
							newIndex = j
							break
						}
					}
				}

				if (newIndex === undefined) {
					unmount(prevChild, parentComponent, true)
				} else {
					newIndexToOldIndexList[newIndex - s2] = i + 1 // TODO why + 1
					if (newIndex > maxNewIndexSoFar) {
						maxNewIndexSoFar = newIndex
					} else {
						moved = true
					}
					patch(
						prevChild,
						c2[newIndex],
						container,
						null,
						parentComponent
					)
					patched++
				}
			}

			// 5.3 move and mount
			const increasingNewIndexSequence = moved
				? getSequence(newIndexToOldIndexList)
				: []

			j = increasingNewIndexSequence.length - 1
			for (i = toBePatched - 1; i >= 0; i--) {
				const nextIndex = s2 + i
				const nextChild = c2[nextIndex]

				const anchor = nextIndex + 1 < l2 ? (c2[nextIndex + 1].el) : parentAnchor
				if (newIndexToOldIndexList[i] === 0) {
					// mount new
					patch(
						null,
						nextChild,
						container,
						anchor,
						parentComponent
					)
				} else if (moved) {
					if (j < 0 || i !== increasingNewIndexSequence[j]) {
						move(nextChild, container, anchor)
					} else {
						j--
					}
				}

			}
		}

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

	const mountElement = (vnode, container, anchor, parentComponent) => {

		const { type, shapeFlag, children, props } = vnode
		let el = vnode.el = hostCreateElement(type)

		if (shapeFlag & ShapeFlag.TEXT_CHILDREN) {
			hostSetElementText(el, children)
		} else if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
			mountChildren(children, el, null, parentComponent)
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

	const mountChildren = (children, el, anchor, parentComponent) => {
		for(let i = 0; i < children.length; i++) {
			let child = children[i] = normalizeVNode(children[i])
			patch(null, child, el, anchor, parentComponent)
		}
	}

	const render = (vnode, container) => {
		patch(container._vnode, vnode, container, null)
	}

	return {
		createApp: createAppAPI(render)
	}
}

const move = (vnode, container, anchor) => {
	const { el, shapeFlag } = vnode
	hostInsert(el, container, anchor)
}

/**
 * ????????????????????????????????????
 * ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
 * 
 * result: result[i] ?????? arr ?????????????????? i ?????????????????????????????????????????????[??????]
 * ?????? arr: [1, 2, 3, 4] ?????? i: 2
 * ?????????????????????????????? [1, 2, 3] [2, 3, 4] [1, 2, 4]
 * ?????????????????????????????? 3 ??? result[2]: 2 
 * 
 * ???????????? result ?????????
 * ???????????? arr?????????????????? arr[i] ?????? result ??????????????????????????????????????????result.push(i)
 * ???????????? result ???????????? ??????????????? result???????????? i ?????? result ????????????
 * ?????? result ???????????? arr ???????????????????????????????????? result ???????????????????????????????????????????????????????????????
 * 
 * ??????????????? result ??????????????????????????????????????????????????? result ????????????????????????
 * ?????? result ??????????????????????????????????????????????????????????????????????????????????????????????????? [p = arr.slice()][i] = arr[arr.indexOf(new) - 1]
 * ??? result ??????????????????????????? result ???????????????????????????????????????????????????????????????????????? result ??????????????????
 * ???????????????	???????????? arr, ?????? result ??????????????? e ???result????????? i ?????????????????? j ????????????????????????????????? j < i
 * 
 */
const getSequence = (arr) => {
	const p = arr.slice()
	const result = [0]
	let i, j, u, v, c
	const len = result.length
	for (i = 0; i < len; i++) {
		const arrI = arr[i]
		if (arrI !== 0) {

			// ??????????????????
			j = result[result.length - 1]
			if (arr[j] < arrI) {

				// p[i] ???????????? result ??????????????????????????????
				p[i] = j

				// ??????????????????
				result.push(i)
				continue
			}

			// ???????????? 
			u = 0
			v = result.length - 1
			while(u < v) {
				c = u + v >> 1
				if (arrI > arr[result[c]]) {
					u = c + 1
				} else {
					v = c
				}
			}
			
			if (arrI < arr[result[u]]) {

				// p[i] ???????????? result ??????????????????????????????
				if (u > 0) {
					p[i] = result[u - 1]
				}

				// ????????????????????????????????????????????????????????????????????????
				result[u] = i
			}
		}
	}
	
	// ??????
	u = result.length
	v = result[u - 1]
	while(u--) {
		result[u] = v
		v = p[v]
	}

	return result
}
