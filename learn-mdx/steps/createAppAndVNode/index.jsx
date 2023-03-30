import { motion } from 'framer-motion'
import Topic from './topic.mdx'
import Content from './content.mdx'

export default () => (
	<>
		<div className="h-screen flex justify-center items-center text-cyan-50 text-9xl">
			hello Vue
		</div>
		<motion.div
			transition={{ duration: 0.5 }}
			initial={{ scale: 0, opacity: 0 }}
			whileInView={{ scale: 1, opacity: 1 }}
		>
			<Topic />
		</motion.div>
		<Content />
	</>
)