/**
 * reactive
 */
let activeEffect = undefined
const targetMap = new WeakMap()

const track = (target, key) => {
	if (activeEffect) {
		let depsMap = targetMap.get(target)
		if (!depsMap) {
			targetMap.set(target, (depsMap = new Map()))
		}

		let dep = depsMap.get(key)

		if (!dep) {
			depsMap.set(key, (dep = new Set()))
		}

		if (!dep.has(activeEffect)) {
			dep.add(activeEffect)
		}
	}
}

const trigger = (target, key) => {
	const depsMap = targetMap.get(target)
	if (!depsMap) return

	const deps = depsMap.get(key)
	if (!deps) return

	deps.forEach(v => v.run())
}

class ReactiveEffect {
	_fn = null

	constructor(fn) {
		this._fn = fn
	}

	run() {
		activeEffect = this
		this._fn()
		activeEffect = null
	}
}

const proxyMap = new WeakMap()
const reactive = (target) => {
	if (proxyMap.get(target)) {
		return proxyMap.get(target)
	}

	let proxy = new Proxy(target, {
		get(target, key, receiver) {
			const res = Reflect.get(target, key, receiver)
			track(target, key)
			return res
		},

		set(target, key, val, receiver) {
			const res = Reflect.set(target, key, val, receiver)
			trigger(target, key)
			return res
		}
	})

	proxyMap.set(target, proxy)
	return proxy
}

const hasOwn = (val, key) => hasOwnProperty.call(val, key)
const isOn = key => /^on[^a-z]/.test(key)
const extend = Object.assign
const camelize = (str) => {
	return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}
const toHandlerKey = str => str ? `on${capitalize(str)}` : ``
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1)

function emit (instance, event, ...rawArgs) {

	if (instance.isUnmounted) return
	const props = instance.vnode.props || {}

	let handler = props[toHandlerKey(event)]
	rawArgs ? handler(rawArgs) : handler()

}

const cloneVNode = (vnode, extraProps) => {
	const { props } = vnode

	const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props

	return {
		...vnode,
		props: mergedProps
	}
}

const mergeProps = (...args) => {
	let ret = {}
	for (let i = 0; i < args.length; i++) {
		const toMerge = args[i]
		for (const key in toMerge) {
			if (key === 'class' && toMerge[key] !== ret[key]) {
				// TODO class merge
				// normalizeClass([ret.class, toMerge.class])
				// 简单处理
				ret.class = (ret.class || '') + (toMerge.class || '')
			} else if (key === 'style') {
				// TODO style merge
				// normalizeStyle([ret[key], toMerge[key]])
				// 简单处理
				ret.style = { ...ret[key], ...toMerge[key] }
			} else if (isOn(key)) {
				// 简单处理
				ret[key] = toMerge[key]
			} else if (key !== ''){
				ret[key] = toMerge[key]
			}
		}
	}
	return ret
}

const createComponentInstance = (vnode, parent) => {
	const type = vnode.type
	const instance = {
		vnode,
		type,
		parent,

		// TODO
		propsOptions: normalizePropsOptions(type),
		emitsOptions: normalizeEmitsOptions(type),

		props: {},
		attrs: {},

		emit: null
	}

	// TODO
	instance.emit = emit.bind(null, instance)

	return instance
}

function isEmitListener(
	options,
	key
) {
	if (!options || !isOn(key)) return false

	key = key.slice(2)
	return (
		hasOwn(options, key[0].toLowerCase() + key.slice(1)) ||
		hasOwn(options, key)
	)
}

const normalizePropsOptions = (comp) => {
	const raw = comp.props
	const normalized = {}

	if (isArray(raw)) {
		for (let i = 0; i < raw.length; i++) {
			const normalizedKey = camelize(raw[i])
			normalized[normalizedKey] = {}
		}
	} else {
		for (const key in raw) {
			const normalizeKey = camelize(key)
			normalized[normalizeKey] = raw[key]
		}
	}

	return [normalized]
}

const normalizeEmitsOptions = (comp) => {

	const raw = comp.emits
	let normalized = {}

	if (isArray(raw)) {
		raw.forEach(key => normalized[key] = null)
	} else {
		extend(normalized, raw)
	}

	return normalized
}

const renderComponentRoot = (instance) => {
	const { render, attrs } = instance
	let result = render()

	if (attrs) {
		const keys = Object.keys(attrs)
		const { shapeFlag } = result
		if (keys.length) {
			if (shapeFlag & (ShapeFlags.ELEMENT | ShapeFlags.COMPONENT)) {
				// TODO
				result = cloneVNode(result, attrs)
			}
		}
	}
	return result
}

function initProps(instance, rawProps = {}) {
	const props = {}
	const attrs = {}
	setFullProps(instance, rawProps, props, attrs)

	instance.attrs = attrs
	instance.props = props
}

const setFullProps = (instance, rawProps, props, attrs) => {
	const [options] = instance.propsOptions

	if (rawProps) {
		for(const key in rawProps) {
			const value = rawProps[key]
			let camelKey
			if (options && hasOwn(options, (camelKey = camelize(key)))) {
				props[camelKey] = value
			} else if (!isEmitListener(instance.emitsOptions, key)){
				if (!(key in attrs) || value !== attrs[key]) {
					attrs[key] = value
				}
			}
		}
	}
}

const updateComponentPreRender = (instance, nextVNode) => {
	nextVNode.component = instance
	const prevProps = instance.vnode.props
	instance.vnode = nextVNode
	instance.next = null

	updateProps(instance, nextVNode.props, prevProps)
}

const updateProps = (instance, nextProps, prevProps) => {
	const { props, attrs } = instance
	const rawCurrentProps = props
	
	setFullProps(instance, nextProps, props, attrs)

	for (const key in rawCurrentProps) {
		if (!nextProps || !hasOwn(nextProps, key)) {
			delete props[key]
		}
	}
}

const shouldUpdateComponent = (n1, n2) => {
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
	},
	parentNode: node => node.parentNode,
	nextSibling: node => node.nextSibling
}

const patchProp = (
	el,
	key,
	prevVal,
	nextVal
) => {
	if (key === 'class') {
		patchClass(el, nextVal)
	} else if (key === 'style') {
		patchStyle(el, prevVal, nextVal)
	} else if (isOn(key)) {
		patchEvent(el, key, prevVal, nextVal)
	} else {
		patchAttr(el, key, nextVal)
	}
}

const patchClass = (el, val) => {
	if (val === null) {
		el.removeAttribute('class')
	} else {
		el.className = val
	}
}

const patchAttr = (el, key, value) => {
	if (value == null) {
		el.removeAttribute(key)
	} else {
		el.setAttribute(key, value)
	}
}
const patchStyle = (el, prev, next) => {
	const style = el.style
	const isCssString = isString(style)

	if (next && !isCssString) {
		if(prev && !isString(prev)) {
			for (const key in prev) {
				next[key] === null && setStyle(style, key, '')
			}
		}
		for (const key in next) {
			setStyle(style, key, next[key])
		}
	} else {
		if (isCssString) {
			style.cssText = next
		} else if (prev) {
			el.removeAttribute('style')
		}
	}
}

const setStyle = (style, key, val) => {
	// 简单处理
	style[key] = val
}
const patchEvent = (el, rawName, prev, next) => {
	const invokers = el._invokers || (el._invokers = {})
	
	if (next && invokers[rawName]) {
		invokers[rawName].value = next
	} else {
		const name = parseName(rawName)
		if (next) {
			const fn = () => fn.value()
			fn.value = next
			invokers[rawName] = fn
			el.addEventListener(name, invokers[rawName])
		} else {
			el.removeEventListener(name, invokers[rawName])
			invokers[rawName] = undefined
		}
	}
}

const parseName = (name) => {
	return name.slice(2).toLowerCase()
}

const ShapeFlags = {
	ELEMENT: 1,
	STATEFUL_COMPONENT: 1 << 2,
	TEXT_CHILDREN: 1 << 3,
	ARRAY_CHILDREN: 1 << 4,
}

const ensureRenderer = (renderOptions) => {
	const {
		createElement: hostCreateElement,
		setElementText: hostSetElementText,
		insert: hostInsert,
		patchProp: hostPatchProp,
		parentNode: hostParentNode,
		nextSibling: hostNextSibling
	} = renderOptions

	const patch = (
		n1,
		n2,
		container,
		anchor,
		parentComponent
	) => {
		const { shapeFlag } = n2
	
		if (shapeFlag & ShapeFlags.ELEMENT) {
			processElement(n1, n2, container, anchor, parentComponent)
		} else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
			processComponent(n1, n2, container, anchor, parentComponent)
		}
	}
	
	const processElement = (
		n1,
		n2,
		container,
		anchor,
		parentComponent
	) => {
		if (!n1) {
			mountElement(n2, container, anchor, parentComponent)
		} else {
			patchElement(n1, n2, parentComponent)
		}
	}
	
	const processComponent = (n1, n2, container, anchor, parentComponent) => {
		if (!n1) {
			mountComponent(n2, container, anchor, parentComponent)
		} else {
			updateComponent(n1, n2)
		}
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
	
	const mountElement = (vnode, container, anchor, parentComponent) => {
		const { type, shapeFlag, children, props } = vnode
		const el = vnode.el = hostCreateElement(type)
	
		if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
			hostSetElementText(el, children)
		} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			mountChildren(children, el, null, parentComponent)
		}
	
		for(const key in props) {
			hostPatchProp(el, key, '', props[key])
		}
		hostInsert(container, el, anchor)
	}
	
	const patchElement = (n1, n2) => {
		const el = n2.el = n1.el
		const oldProps = n1.props
		const newProps = n2.props
	
		// TODO 
		// patchChildren(n1, n2, el, null)
		patchProps(el, n2, oldProps, newProps)
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
	
	const setupRenderEffect = (instance, vnode, container, anchor) => {
		const componentUpdateFn = () => {
			if (!instance.isMounted) {
				const subTree = instance.subTree = renderComponentRoot(instance)
				patch(null, subTree, container, anchor, instance)
				vnode.el = subTree.el
				instance.isMounted = true
			} else {
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
					hostNextSibling(prevTree.anchor || prevTree.el)
				)
				next.el = nextTree.el
			}
		}
	
		const update = instance.update = () => effect.run()
		const effect = new ReactiveEffect(componentUpdateFn)
	
		update()
	}
	
	const handleSetupResult = (instance, setupResult) => {
		if (isFunction(setupResult)) {
			instance.render = setupResult
		}
		finishSetupComponent(instance)
	}
	
	const mountComponent = (
		vnode,
		container,
		anchor,
		parentComponent
	) => {
		const instance = vnode.component =
			createComponentInstance(vnode, parentComponent)
	
		setupComponent(instance)
	
		setupRenderEffect(
			instance,
			vnode,
			container,
			anchor
		)
	}
	
	const finishSetupComponent = (instance) => {
		if (!instance.render) {
			instance.render = instance.type.render
		}
	}
	
	const setupComponent = instance => {
	
		const { props } = instance.vnode
		initProps(instance, props)
	
		return setupStatefulComponent(instance)
	}
	
	const setupStatefulComponent = instance => {
		const component = instance.type
		const { setup } = component
	
		if (setup) {
			const setupContext = {
				emit: instance.emit
			}
	
			const setupResult = setup(instance.props, setupContext)
			handleSetupResult(instance, setupResult)
		} else {
			finishSetupComponent(instance)
		}
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
	props: ['fontColor'],
	emits: ['changeColor'],
	setup(props, { emit }) {
		return () => (
			console.log('Comp render'),
			h('div',
				{
					onClick: () => emit('changeColor'),
					style: {
						color: props.fontColor.value
					}
				},
				'hello world'
			)
		)
	}
}
createApp({
	setup() {
		const fontColor = reactive({ value: '#5dbe8a' })
		const handleChangeColor = () => {
			fontColor.value = '#baccd9'
		}

		return () => (
			console.log('app render'),
			h(Comp,
				{
					inheritCustomAttr: fontColor.value,
					fontColor: fontColor,
					class: 'text-white',
					onChangeColor: handleChangeColor
				}
			)
		)
	}
}).mount('#root')