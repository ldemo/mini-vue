export const extend = Object.assign
export const isFunction = val => typeof val === 'function'
export const isString = val => typeof val === 'string'
export const isNumber = val => typeof val === 'number'
export const isObject = val => val !== null && typeof val === 'object'
export const isArray = Array.isArray

export const isOn = key => /^on[^a-z]/.test(key)

export const hasOwn = (val, key) => hasOwnProperty.call(val, key)
export const ShapeFlags = {
	ELEMENT: 1,
	STATEFUL_COMPONENT: 1 << 2,
	TEXT_CHILDREN: 1 << 3,
	ARRAY_CHILDREN: 1 << 4,
	COMPONENT: 1 << 2
}

export const camelize = (str) => {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

export const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1)

export const toHandlerKey = str => str ? `on${capitalize(str)}` : ``

window.ShapeFlags = ShapeFlags