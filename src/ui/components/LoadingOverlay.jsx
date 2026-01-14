import { motion } from "framer-motion";

export default function LoadingOverlay({ text = "Initializing agents..." }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] backdrop-blur-md z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="panel px-6 py-5 text-center"
      >
        <div className="text-xs uppercase tracking-[0.25em] text-cyber-purple mb-2">
          Neural Spin-Up
        </div>
        <div className="text-lg font-semibold text-white mb-2">{text}</div>
        <div className="w-48 h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-cyber-blue to-cyber-purple"
            initial={{ width: "0%" }}
            animate={{ width: ["20%", "80%", "40%", "100%"] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
