import { compile } from "../src/compile/compile";

const template = `<div :id="demo" class="fs-12">
	<Comp v-if="a" @click="handleClick" />
	hello world
	<span>{{ msg }}</span> 
</div>`

const { ast, code } = compile(template)
console.log(ast)
console.log(code)
