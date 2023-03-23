import { MotionConfig, motion } from "framer-motion"

export default () => {
	return (
		<>
			<MotionConfig transition={{ duration: 0.5 }}>
				<motion.div
					className="py-1 text-white flex flex-col justify-center items-center"
					initial={{ x: '100%', opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ delay: 0.5 }}
				>
					<img src="/1.png"/>
				</motion.div>
			</MotionConfig>
		</>
	)
}