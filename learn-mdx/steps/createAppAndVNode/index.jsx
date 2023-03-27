import { motion } from 'framer-motion'
import Step1 from './1.mdx'
import Step2 from './2.mdx'

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
			<Step1 />
		</motion.div>
		<Step2 />
	</>
)