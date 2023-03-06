export const patchEvent = (el, rawName, prev, next) => {
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