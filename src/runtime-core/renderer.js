import { ReactiveEffect } from "../reactive"
import { ShapeFlag } from "../share"
import { PatchFlag } from "../share/patchFlag"
import { createAppAPI } from "./apiCreateApp"
import { createComponentInstance, setupComponent } from "./component"
import { updateProps } from "./componentProps"
import { renderComponentRoot, shouldUpdateComponent } from "./componentRenderUtil"
import { invalidateJob, queueJob } from "./scheduler"
import { Fragment, isSameVNodeType, normalizeVNode, Text } from "./vnode"

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

	const patch = (
		n1,
		n2,
		container,
		anchor,
		parentComponent,
		optimized = !!n2.dynamicChildren
	) => {
		if (n1 === n2) return

		const { type, shapeFlag } = n2
		switch(type) {
			case Text:
				processText(n1, n2, container, anchor)
				break
			case Fragment:
				processFragment(n1, n2, container, anchor, parentComponent, optimized)
				break
			default:
				if (shapeFlag & ShapeFlag.ELEMENT) {
					processElement(
						n1,
						n2,
						container,
						anchor,
						parentComponent,
						optimized
					)
				} else if (shapeFlag & ShapeFlag.STATEFUL_COMPONENT) {
					processComponent(n1, n2, container, anchor, parentComponent, optimized)
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

	const processFragment = (
		n1,
		n2,
		container,
		anchor,
		parentComponent,
		optimized
	) => {
		const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText('')
		const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText('')

		const { patchFlag, dynamicChildren } = n2

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
			if (
				patchFlag > 0 &&
				patchFlag & PatchFlag.STABLE_FRAGMENT &&
				dynamicChildren
			) {
				patchBlockChildren(
					n1.dynamicChildren,
					dynamicChildren,
					container,
					parentComponent
				)
			} else {
				patchChildren(
					n1,
					n2,
					container,
					fragmentEndAnchor,
					parentComponent,
					optimized
				)
			}
		}
	}

	const processComponent = (
		n1,
		n2,
		container,
		anchor,
		parentComponent,
		optimized
	) => {
		if (!n1) {
			mountComponent(n2, container, anchor, parentComponent, optimized)
		} else {
			updateComponent(n1, n2, optimized)
		}
	}

	const mountComponent = (
		vnode,
		container,
		anchor,
		parentComponent,
		optimized
	) => {

		const instance = vnode.component = createComponentInstance(vnode, parentComponent)

		setupComponent(instance)

		setupRenderEffect(
			instance,
			vnode,
			container,
			anchor,
			optimized
		)
	}

	const setupRenderEffect = (instance, vnode, container, anchor, optimized) => {
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
					updateComponentPreRender(instance, next, optimized)
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

		const update = instance.update = () => effect.run()
		update.id = instance.uid
		const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(update))

		update()
	}

	const updateComponentPreRender = (instance, nextVNode, optimized) => {
		nextVNode.component = instance
		const prevProps = instance.vnode.props
		instance.vnode = nextVNode
		instance.next = null

		updateProps(instance, nextVNode.props, prevProps, optimized)
	}

	const updateComponent = (n1, n2) => {
		const instance = n2.component = n1.component

		if (shouldUpdateComponent(n1, n2)) {
			instance.next = n2
			// in case the child component is also queued, remove it to avoid
			// double updating the same child component in the same flush.
			invalidateJob(instance.update)
			instance.update()
		} else {
			n2.el = n1.el
			instance.vnode = n2
		}
	}

	const processElement = (n1, n2, container, anchor, parentComponent, optimized) => {
		if (!n1) {
			mountElement(n2, container, anchor, parentComponent)
		} else {
			patchElement(n1, n2, parentComponent, optimized)
		}
	}

	const patchElement = (n1, n2, parentComponent, optimized) => {
		const el = n2.el = n1.el
		const { patchFlag, dynamicChildren} = n2
		const oldProps = n1.props
		const newProps = n2.props

		if (dynamicChildren) {
			patchBlockChildren(
				n1.dynamicChildren,
				dynamicChildren,
				el,
				parentComponent
			)
		} else if (!optimized){
			patchChildren(n1, n2, el, null, parentComponent, optimized)
		}

		if (patchFlag > 0) {
			if (patchFlag & PatchFlag.FULL_PROPS) {
				patchProps(el, n2, oldProps, newProps)
			} else {
				if (patchFlag & PatchFlag.CLASS) {
					if (oldProps.class !== newProps.class) {
						hostPatchProp(el, 'class', null, newProps.class)
					}
				}

				if (patchFlag & PatchFlag.STYLE) {
					hostPatchProp(el, 'style', oldProps.style, newProps.style)
				}

				if (patchFlag & PatchFlag.PROPS) {
					const propsToUpdate = n2.dynamicProps
					for (let i = 0; i < propsToUpdate.length; i++) {
						const key = propsToUpdate[i]
						const prev = oldProps[key]
						const next = newProps[key]
						if (prev !== next) {
							hostPatchProp(
								el,
								key,
								prev,
								next
							)
						}
					}
				}
			}

			if (patchFlag & PatchFlag.TEXT) {
				if (n2.children !== n1.children)
				hostSetElementText(el, n2.children)
			}
		} else if (!optimized){
			patchProps(el, n2, oldProps, newProps)
		}
	}

	const patchBlockChildren = (c1, c2, fallbackContainer, parentComponent) => {
		for (let i = 0; i < c2.length; i++) {
			const oldVNode = c1[i]
			const newVNode = c2[i]

			const container = oldVNode.el &&
				(oldVNode.type === Fragment ||
					!isSameVNodeType(oldVNode, newVNode))
					? hostParentNode(oldVNode.el)
					: fallbackContainer

			patch(
				oldVNode,
				newVNode,
				container,
				null,
				parentComponent,
				true
			)
		}
	}

	const patchChildren = (n1, n2, container, anchor, parentComponent, optimized) => {
		const c1 = n1.children
		const c2 = n2.children
		const { patchFlag, shapeFlag } = n2
		const { shapeFlag: preShapeFlag = 0 } = n1

		if (patchFlag > 0) {
			if (patchFlag & PatchFlag.KEYED_FRAGMENT) {
				patchKeyedChildren(
					c1,
					c2,
					container,
					anchor,
					parentComponent,
					optimized
				)
				return
			} else if (patchFlag & PatchFlag.UNKEYED_FRAGMENT) {
				patchUnkeyedChildren(
					c1,
					c2,
					container,
					anchor,
					parentComponent,
					optimized
				)
				return
			}
		}

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
				unmountChildren(c1, parentComponent, optimized)
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
						parentComponent,
						optimized
					)
				} else {
					unmountChildren(c1, parentComponent, optimized)
				}
			} else {
				if (preShapeFlag & ShapeFlag.TEXT_CHILDREN) {
					hostSetElementText(container, '')
				}

				if (shapeFlag & ShapeFlag.ARRAY_CHILDREN) {
					mountChildren(c2, container, anchor, parentComponent, optimized)
				}

			}
		}
	}

	const unmountChildren = (children, parentComponent, optimized) => {
		for(let i = 0; i < children.length; i++) {
			unmount(children[i], parentComponent, optimized)
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

	const patchUnkeyedChildren = (
		c1,
		c2,
		container,
		anchor,
		parentComponent,
		optimized
	) => {
		const oldLength = c1.length
		const newLength = c2.length

		const commonLength = Math.min(oldLength, newLength)

		for(let i = 0; i < commonLength; i++) {
			patch(
				c1[i],
				normalizeVNode(c2[i]),
				container,
				null,
				parentComponent,
				optimized
			)
		}

		if (oldLength > newLength) {
			unmountChildren(
				c1.slice(commonLength),
				parentComponent,
				optimized
			)
		} else {
			mountChildren(
				c2.slice(commonLength),
				container,
				anchor,
				parentComponent,
				optimized
			)
		}
	}

	const patchKeyedChildren = (
		c1,
		c2,
		container,
		parentAnchor,
		parentComponent,
		optimized
	) => {

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
					parentComponent,
					optimized
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
					parentComponent,
					optimized
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
						parentComponent,
						optimized
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
						parentComponent,
						optimized
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
						parentComponent,
						optimized
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

	const mountChildren = (children, el, anchor, parentComponent, optimized) => {
		for(let i = 0; i < children.length; i++) {
			let child = children[i] = normalizeVNode(children[i])
			patch(null, child, el, anchor, parentComponent, optimized)
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
 * 目的：获得最长递增子序列
 * 思路：为了让某段递增子序列更长，其元素应该尽可能的小，值越小，被后面的值大的概率越大，递增长度越长
 * 
 * result: result[i] 代表 arr 数组在长度为 i 的最长递增子序列的尾部最小值的[下标]
 * 举例 arr: [1, 2, 3, 4] 设定 i: 2
 * 最长递增子序列可以为 [1, 2, 3] [2, 3, 4] [1, 2, 4]
 * 其子序列尾部最小值为 3 即 result[2]: 2 
 * 
 * 如何保证 result 的数据
 * 正向遍历 arr，如果循环中 arr[i] 大于 result 尾部的值，则子序列长度扩增，result.push(i)
 * 如果小于 result 尾部的值 则二分查找 result，并插入 i 使得 result 保持自增
 * 至此 result 长度即为 arr 最长递增子序列长度，同时 result 最后一位元素是最长递增子序列的最后一位元素
 * 
 * 由于在保持 result 内部元素尽可能小的过程中，无法保障 result 内的元素下标有序
 * 故于 result 变更的时候，记录当前变更的元素所在的位置的前一个位置的值，记录方式 [p = arr.slice()][i] = arr[arr.indexOf(new) - 1]
 * 在 result 完成变更之后，根据 result 最后一个可靠的值开始逐个回溯前一个位置的值，使得 result 内的元素递增
 * 回溯依据：	正向遍历 arr, 造成 result 变更的元素 e 在result的位置 i 的前一个位置 j 始终是之前遍历生成，即 j < i
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

			// 比较尾部元素
			j = result[result.length - 1]
			if (arr[j] < arrI) {

				// p[i] 始终记录 result 变更元素的前一个元素
				p[i] = j

				// 增加最长序列
				result.push(i)
				continue
			}

			// 二分查找 
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

				// p[i] 始终记录 result 变更元素的前一个元素
				if (u > 0) {
					p[i] = result[u - 1]
				}

				// 替换较大的值，该值越小，后面值大于该值的几率越大
				result[u] = i
			}
		}
	}
	
	// 回溯
	u = result.length
	v = result[u - 1]
	while(u--) {
		result[u] = v
		v = p[v]
	}

	return result
}
