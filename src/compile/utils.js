import { NodeTypes } from "./ast"

export const isText = (node) => {
	return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
}

export const advancePositionWithMutation = (
	pos,
	source,
	numberOfCharacters = source.length
) => {
	let linesCount = 0
	let lastNewLinePos = -1

	for(let i = 0; i < numberOfCharacters.length; i++) {
		if (source.charCodeAt(i) === 10) {
			linesCount++
			lastNewLinePos = i
		}
	}

	pos.offset += numberOfCharacters
	pos.line += linesCount
	pos.column = 
		lastNewLinePos === -1
			? pos.column + numberOfCharacters
			: numberOfCharacters - lastNewLinePos

	return pos
}