const isObject = val => val !== null && typeof val === 'object'

const h = function(type, propsOrChildren, children) {
	const l = arguments.length
	if (l === 2) {
		if (isObject(propsOrChildren)) {
			// props without children
			return createVNode(type, propsOrChildren)
		} else {
			// omit props
			return createVNode(type, null, propsOrChildren)
		}
	} else {
		return createVNode(type, propsOrChildren, children)
	}
}

const createVNode = (type, props, children) => {
	return {
		type,
		props,
		children
	}
}

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

const ensureRenderer = (renderOptions) => {
	const {
		createElement,
		setElementText,
		insert,
		patchProp
	} = renderOptions

	const render = (vnode, container) => {
		const child = vnode.type.render()
		const el = createElement(child.type)
		setElementText(el, child.children)
		for(const key in child.props) {
			patchProp(el, key, '', child.props[key])
		}
		insert(container, el)
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

const template = h(
	'div',
	{ id: 'demo' },
	'hello world'
)

createApp({
	render() {
		return template
	}
}).mount('#root')