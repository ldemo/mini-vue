export const NodeTypes = {
	ROOT: 0,
	ELEMENT: 1,
	TEXT: 2,
	COMMENT: 3,
	SIMPLE_EXPRESSION: 4,
	INTERPOLATION: 5,
	ATTRIBUTE: 6,
	DIRECTIVE: 7
}

export const createRoot = (children, loc) => {
	return {
		type: NodeTypes.ROOT,
		children,
		codegenNode: undefined,
		loc
	}
}