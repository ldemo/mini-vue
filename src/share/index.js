export const extend = Object.assign
export const isFunction = val => typeof val === 'function'
export const isString = val => typeof val === 'string'
export const isObject = val => val !== null && typeof val === 'object'
export const isArray = Array.isArray

export const hasOwn = (val, key) => hasOwnProperty.call(val, key)

export const ShapeFlag = {
	ELEMENT: 1,
	STATEFUL_COMPONENT: 1 << 2,
	TEXT_CHILDREN: 1 << 3,
	ARRAY_CHILDREN: 1 << 4
}