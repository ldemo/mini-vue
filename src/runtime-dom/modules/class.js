export const patchClass = (el, val) => {
	if (val === null) {
		el.removeAttribute('class')
	} else {
		el.className = val
	}
}