import { MotionConfig, motion } from "framer-motion"
import HPreImg from '/1.png'

export default () => {
	return (
		<>
			<MotionConfig transition={{ duration: 0.5 }}>
				<motion.div
					className="py-1 text-white flex flex-col justify-center items-center"
					initial={{ x: '100%', opacity: 0, rotate: '30deg' }}
					whileInView={{ x: 0, opacity: 1, rotate: 0 }}
					transition={{ delay: 0.5 }}
				>
					<img src={HPreImg} />
				</motion.div>
			</MotionConfig>
		</>
	)
}