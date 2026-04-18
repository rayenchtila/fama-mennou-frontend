import React from 'react';
import { motion } from 'framer-motion';

const Reveal = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 75 }} // Starts invisible and 75px lower
      whileInView={{ opacity: 1, y: 0 }} // Animates to normal when you scroll to it
      viewport={{ once: false, amount: 0.2 }} // Animates every time you scroll up/down
      transition={{ 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1] // This is a "Quint" ease for a very smooth, expensive feel
      }}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;