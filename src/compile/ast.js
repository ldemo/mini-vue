export const NodeTypes = {
	ROOT: 0,
	ELEMENT: 1,
	TEXT: 2,
	COMMENT: 3,
	SIMPLE_EXPRESSION: 4,
	INTERPOLATION: 5,
	ATTRIBUTE: 6,
	DIRECTIVE: 7,
	// containers
	COMPOUND_EXPRESSION: 8,
	TEXT_CALL: 12,
	// codegen
	VNODE_CALL: 13,
	JS_CALL_EXPRESSION: 14,
	JS_OBJECT_EXPRESSION: 15,
	JS_PROPERTY: 16
}

export const ElementTypes = {
	ELEMENT: 0,
	COMPONENT: 1,
	SLOT: 2,
	TEMPLATE: 3
}

export const ConstantTypes = {
	NOT_CONSTANT: 0,
	CAN_SKIP_PATCH: 1,
	CAN_HOIST: 2,
	CAN_STRINGIFY: 3
}

export const locStub = {
  source: '',
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 }
}

export const createRoot = (children, loc) => {
	return {
		type: NodeTypes.ROOT,
		children,
		loc,
		codegenNode: undefined
	}
}

export const createCompoundExpression = (children, loc) => {
	return {
		type: NodeTypes.COMPOUND_EXPRESSION,
		loc,
		children
	}
}

export const createCallExpression = (callee, args, loc = locStub) => {
	return {
		type: NodeTypes.JS_CALL_EXPRESSION,
		loc,
		callee,
		arguments: args,
	}
}

export const createSimpleExpression = (
	content,
	isStatic,
	loc = locStub,
	constType = ConstantTypes.NOT_CONSTANT
) => {
	return {
		type: NodeTypes.SIMPLE_EXPRESSION,
		loc,
		content,
		isStatic,
		constType: isStatic ? ConstantTypes.CAN_STRINGIFY : constType
	}
}

export const createObjectProperty = (key, value) => {
	return {
		type: NodeTypes.JS_PROPERTY,
		loc: locStub,
		key,
		value
	}
}

export const createObjectExpression = (
  properties,
  loc = locStub
 ) => {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    loc,
    properties
  }
}

export const createVNodeCall = (
	context,
	tag,
	props,
	children,
	patchFlag,
	dynamicProps,
	isBlock,
	isComponent,
	loc = locStub
) => {
	return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    isBlock,
    isComponent,
    loc
  }
}