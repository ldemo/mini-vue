import { PatchFlags } from '../../share/patchFlags'
import {
	ConstantTypes,
	createCallExpression,
	createObjectExpression,
	createObjectProperty,
	createSimpleExpression,
	createVNodeCall,
	ElementTypes,
	NodeTypes
} from '../ast'
import { NORMALIZE_CLASS, RESOLVE_COMPONENT } from '../runtimeHelpers'
import { getInnerRange } from '../utils'
import { getConstantType } from './hoistStatic'

export const transformElement = (node, context) => {
	return () => {
		node = context.currentNode

		if (
			!(
				node.type === NodeTypes.ELEMENT &&
				(
					node.tagType === ElementTypes.ELEMENT ||
					node.tagType === ElementTypes.COMPONENT
				)
			)
		) {
			return
		}

		const { tag, props } = node
		const isComponent = node.tagType === ElementTypes.COMPONENT

		let vnodeTag = isComponent
			? resolveComponentType(node, context)
			: `"${tag}"`

		let vnodeProps
		let vnodeChildren
		let vnodePatchFlag
		let patchFlag
		let vnodeDynamicProps
		let dynamicPropNames

		let shouldUseBlock = false

		// props
		if (props.length > 0) {
			const propsBuildResult = buildProps(
				node,
				context,
				undefined,
				isComponent
			)
			vnodeProps = propsBuildResult.props
			patchFlag = propsBuildResult.patchFlag
			vnodeDynamicProps = propsBuildResult.dynamicPropNames
			if (propsBuildResult.shouldUseBlock) {
        shouldUseBlock = true
      }
		}

		// children
		if (node.children.length > 0) {
			const shouldBuildAsSlots = isComponent
			if (shouldBuildAsSlots) {


			} else if (node.children.length === 1) {
				const child = node.children[0]
				const type = child.type
				// check for dynamic text children
				const hasDynamicChildren = 
					type === NodeTypes.INTERPOLATION ||
					type === NodeTypes.COMPOUND_EXPRESSION

				if (
					hasDynamicChildren &&
					getConstantType(child, context) === ConstantTypes.NOT_CONSTANT
				) {
					patchFlag |= PatchFlags.TEXT
				}

				if (hasDynamicChildren || type === NodeTypes.TEXT) {
					vnodeChildren = child
				} else {
					vnodeChildren = node.children
				}
			} else {
				vnodeChildren = node.children
			}
		}

		if (patchFlag !== 0) {
			vnodePatchFlag = String(patchFlag)
			if (dynamicPropNames && dynamicPropNames.length) {
        vnodeDynamicProps = stringifyDynamicPropNames(dynamicPropNames)
      }
		}

		node.codegenNode = createVNodeCall(
			context,
			vnodeTag,
			vnodeProps,
			vnodeChildren,
			vnodePatchFlag,
			vnodeDynamicProps,
			shouldUseBlock,
			isComponent
		)
	}
}

const resolveComponentType = (node, context) => {
	const { tag } = node
	context.helper(RESOLVE_COMPONENT)
  context.components.add(tag)
  return `_component_${tag}`
}

export const buildProps = (
	node,
	context,
	props = node.props,
	isComponent
) => {
	const { tag, loc: elementLoc, children } = node
	let properties = []
	const hasChildren = children.length > 0
	let shouldUseBlock = false

	// patch analysis
	let patchFlag = 0
	let hasClassBinding = false
	let hasStyleBinding = false

	let dynamicPropNames = []

	const analyzePatchFlag = ({ key, value }) => {
		const name = key.content

		if (name === 'class') {
			hasClassBinding = true
		} else if (name === 'style') {
			hasStyleBinding = true
		} else if (name !== 'key' && !dynamicPropNames.includes(name)) {
			dynamicPropNames.push(name)
		}

		if (
			isComponent &&
			(name === 'class' || name === 'style') &&
			!dynamicPropNames.includes(name)
		) {
			dynamicPropNames.push(name)
		}
	}

	for (let i = 0; i < props.length; i++) {
		const prop = props[i]
		if (prop.type === NodeTypes.ATTRIBUTE) {
			const { name, value, loc } = prop

			properties.push(
				createObjectProperty(
					createSimpleExpression(
						name,
						true,
						getInnerRange(loc, 0, name.length)
					),
					createSimpleExpression(
						value.content,
						true,
						value.loc
					)
				)
			)
		} else {
			// directive
			const { name, exp, arg, loc } = prop

			const directiveTransform = context.directiveTransforms[name]
			if (directiveTransform) {
				const { props } = directiveTransform(prop, node, context)

				props.forEach(analyzePatchFlag)
				properties.push(...props)
			}
		}
	}

	let propsExpression

	if (properties.length) {
    propsExpression = createObjectExpression(
      properties,
      elementLoc
    )
  }

	if (hasClassBinding && !isComponent) {
		patchFlag |= PatchFlags.CLASS
	}
	if (hasStyleBinding && !isComponent) {
		patchFlag |= PatchFlags.STYLE
	}
	if (dynamicPropNames.length) {
		patchFlag |= PatchFlags.PROPS
	}

	if (propsExpression) {
		let classKeyIndex = -1
		let styleKeyIndex = -1

		for (let i = 0; i < propsExpression.properties.length; i++) {
			const key = propsExpression.properties[i].key
			if (key.content === 'class') {
				classKeyIndex = i
			} else if (key.content === 'style') {
				styleKeyIndex = i
			}
		}

		const classProp = propsExpression.properties[classKeyIndex]

		if (classProp) {
			classProp.value = createCallExpression(
				context.helper(NORMALIZE_CLASS),
				[classProp.value]
			)
		}
	}

	return {
		props: propsExpression,
		patchFlag,
		dynamicPropNames,
		shouldUseBlock
	}

}

const stringifyDynamicPropNames = (props) => {
	let propsNameString = '['
	for(let i = 0, l = props.length; i < l; i++) {
		propsNameString += JSON.stringify(props[i])
		if (i < l - 1) propsNameString += ', '
	}
	return propsNameString + `]`
}