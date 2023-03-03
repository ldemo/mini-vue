export function renderComponentRoot(instance) {
	const { render, proxy } = instance
	let result = render.call(proxy)

	return result
}