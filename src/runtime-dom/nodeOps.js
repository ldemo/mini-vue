export const nodeOps = {
	insert: (child, parent, anchor) => {
		parent.insertBefore(child, anchor)
	},

	remove: child => {
		const parent = child.parentNode
		parent && parent.removeChild(child)
	},

	createElement: (tag, props) => {
		let el = document.createElement(tag)
		return el
	},

	createText: text => document.createTextNode(text),

	createComment: text => document.createComment(text),

	setText: (node, text) => node.nodeValue = text,

	setElementText: (el, text) => el.textContent = text,

	parentNode: node => node.parentNode,

	nextSibling: node => node.nextSibling,

	querySelector: selector => document.querySelector(selector),

	setScopeId: (el, id) => el.setAttribute(id, ''),

}