import { createRenderer } from "../runtime-core/renderer"
import { extend, isFunction, isString } from "../share"
import { nodeOps } from "./nodeOps"

const renderOptions = extend({}, nodeOps)

function ensureRenderer () {
	return createRenderer(renderOptions)
}

export const createApp = (...args) => {
	const app = ensureRenderer().createApp(...args)
	const { mount } = app

	app.mount = (containerOrSelector) => {
		const container = normalizeContainer(containerOrSelector)
		let component = app._component

		if (!container) return

		if (!isFunction(component) && !component.render && !component.template) {
      component.template = container.innerHTML
    }

		container.innerHTML = ''

		return mount(container)
	}

	return app
}

const normalizeContainer =(container) => isString(container) ? document.querySelector(container) : container