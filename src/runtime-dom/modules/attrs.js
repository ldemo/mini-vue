export function patchAttr(el, key, value) {
	// 简单处理
	if (value == null) {
		el.removeAttribute(key)
	} else {
		el.setAttribute(key, value)
	}
}