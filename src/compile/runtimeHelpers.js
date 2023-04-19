export const TO_DISPLAY_STRING = Symbol('toDisplayString')
export const CREATE_TEXT = Symbol('createTextNode')
export const RESOLVE_COMPONENT = Symbol('resolveComponent')
export const NORMALIZE_CLASS = Symbol('normalClass')
export const OPEN_BLOCK = Symbol('openBlock')
export const CREATE_BLOCK = Symbol('createBlock')
export const CREATE_ELEMENT_BLOCK = Symbol('createElementBlock')
export const CREATE_VNODE = Symbol('createVNode')
export const CREATE_ELEMENT_VNODE = Symbol('createElementVNode')


export const helperNameMap = {
	[TO_DISPLAY_STRING]: `toDisplayString`,
	[CREATE_TEXT]: `createTextVNode`,
	[RESOLVE_COMPONENT]: `resolveComponent`,
	[NORMALIZE_CLASS]: `normalizeClass`,
	[OPEN_BLOCK]: `openBlock`,
	[CREATE_BLOCK]: `createBlock`,
  [CREATE_ELEMENT_BLOCK]: `createElementBlock`,
  [CREATE_VNODE]: `createVNode`,
  [CREATE_ELEMENT_VNODE]: `createElementVNode`,
}