import { motion, useReducedMotion } from 'framer-motion';

// Reveal-on-scroll wrapper: fades and lifts its content in once, the first time
// it enters the viewport. Collapses to a plain element for visitors who ask the
// OS for reduced motion.
export default function FadeIn({ children, delay = 0, y = 16, as = 'div', className, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
