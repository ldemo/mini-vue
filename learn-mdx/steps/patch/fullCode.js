const isObject = val => val !== null && typeof val === 'object'
const isFunction = val => typeof val === 'function'
const isString = val => typeof val === 'string'
const isNumber = val => typeof val === 'number'
const isArray = Array.isArray

const nodeOpts = {
	createElement: tag => document.createElement(tag),
	setElementText: (el, text) => el.textContent = text,
	insert: (parent, child, anchor) => {
		return parent.insertBefore(child, anchor)
	}
}

const patchProp = (el, key, prevVal, nextVal) => {
	el.setAttribute(key, nextVal)
}

const ShapeFlags = {
	ELEMENT: 1,
	STATEFUL_COMPONENT: 1 << 2,
	TEXT_CHILDREN: 1 << 3,
	ARRAY_CHILDREN: 1 << 4,
}

const ensureRenderer = (renderOptions) => {
	const {
		createElement,
		setElementText,
		insert,
		patchProp
	} = renderOptions

	const patch = (n1, n2, container, anchor) => {
		const { shapeFlag } = n2
	
		if (shapeFlag & ShapeFlags.ELEMENT) {
			processElement(n1, n2, container, anchor)
		} else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
			processComponent(n1, n2, container, anchor)
		}
	}

	const processComponent = (n1, n2, container, anchor) => {
		if (!n1) {
			mountComponent(n2, container, anchor)
		}
	}
	
	const createComponentInstance = vnode => {
		const type = vnode.type
		const instance = {
			vnode,
			type,
		}
		return instance
	}
	
	const setupComponent = instance => {
		return setupStatefulComponent(instance)
	}
	
	const setupStatefulComponent = instance => {
		const component = instance.type
		const { setup } = component
	
		if (setup) {
			const setupResult = setup()
			handleSetupResult(instance, setupResult)
		} else {
			finishSetupComponent(instance)
		}
	}
	
	const handleSetupResult = (instance, setupResult) => {
		if (isFunction(setupResult)) {
			instance.render = setupResult
		}
		finishSetupComponent(instance)
	}
	
	const finishSetupComponent = (instance) => {
		if (!instance.render) {
			instance.render = instance.type.render
		}
	}
	
	const mountComponent = (vnode, container, anchor) => {
		const instance = vnode.component = createComponentInstance(vnode)
	
		setupComponent(instance)
	
		const subTree = instance.subTree = instance.render()
		patch(null, subTree, container, anchor)
		vnode.el = subTree.el
	}

	const processElement = (n1, n2, container, anchor) => {
		if (!n1) {
			mountElement(n2, container, anchor)
		} else {
			// TODO update
		}
	}

	const mountChildren = (children, el, anchor) => {
		for(let i = 0; i < children.length; i++) {
			let child = children[i]
			patch(null, child, el, anchor)
		}
	}
	const mountElement = (vnode, container, anchor) => {
		const { type, shapeFlag, children, props } = vnode
		const el = vnode.el = createElement(type)
	
		if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
			setElementText(el, children)
		} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			mountChildren(children, el, null)
		}
	
		for(const key in props) {
			patchProp(el, key, '', props[key])
		}
		insert(container, el, anchor)
	}

	const render = (vnode, container) => {
		patch(null, vnode, container, null)
	}

	return {
		createApp: function(rootComponent) {
			return {
				mount(selector) {
					const container = document.querySelector(selector)
					const vnode = h(rootComponent, {})

					render(vnode, container)
				}
			}
		}
	}
}

const renderOptions = { ...nodeOpts, patchProp }
const createApp = ensureRenderer(renderOptions).createApp

const h = function(type, propsOrChildren, children) {
	const l = arguments.length
	if (l === 2) {
		if (isObject(propsOrChildren)) {
			return createVNode(type, propsOrChildren)
		} else {
			return createVNode(type, null, propsOrChildren)
		}
	} else {
		return createVNode(type, propsOrChildren, children)
	}
}

const normalizeChildren = (vnode, children) => {
	let type = 0 

	if (isArray(children)) {
		type = ShapeFlags.ARRAY_CHILDREN
	} else if (isString(children) || isNumber(children)) {
		type = ShapeFlags.TEXT_CHILDREN
	}

	vnode.shapeFlag |= type
}

const createVNode = (type, props, children) => {
	const shapeFlag = isString(type)
		? ShapeFlags.ELEMENT
		: isObject(type)
			? ShapeFlags.STATEFUL_COMPONENT
			: 0

	const vnode = {
		type,
		props,
		children,
		shapeFlag
	}

	normalizeChildren(vnode, children)

	return vnode
}

const Comp = {
	setup() {
		const msg = "I'm comp"
		return () => (
			h('div', msg)
		)
	}
}

createApp({
	render() {
		return (
			h('div', { id: 'demo' }, [
				h('span', 'hello world'),
				h(Comp, {})
			])
		)
	}
}).mount('#root')