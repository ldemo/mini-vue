export function patchAttr(el, key, value) {
	// įŽåå¤į
	if (value == null) {
		el.removeAttribute(key)
	} else {
		el.setAttribute(key, value)
	}
}