import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const faqs = [
  {
    question: "L'inscription est-elle gratuite ?",
    answer: "Oui, l'inscription est  gratuite. ",
  },
  {
    question: "C'est quoi FamaMennou ?",
    answer: "'FamaMennou' est une plateforme tunisienne qui connecte freelances, clients et services pour des jobs et des courses.",
  },
  {
    question: "Comment trouver des freelances ?",
    answer: "Parcourez les profils ou publiez une demande pour recevoir des propositions.",
  },
  {
    question: "Comment trouver des clients ?",
    answer: "Créez votre profil et recevez des demandes adaptées à vos services.",
  },
  {
    question: "Comment trouver des jobs ?",
    answer: "Consultez les offres disponibles et postulez directement.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const { t } = useTranslation();

  return (
    <section className="relative w-full bg-white dark:bg-slate-950 py-20 md:py-28 overflow-hidden">

      {/* Background blobs — same as hero */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-px bg-gradient-to-r from-transparent via-indigo-200 dark:via-indigo-900/40 to-transparent" />
        <div className="absolute -bottom-16 -left-16 w-[280px] h-[280px] rounded-full bg-indigo-100 dark:bg-indigo-900/15 blur-3xl opacity-60" />
        <div className="absolute -top-8 -right-8 w-[220px] h-[220px] rounded-full bg-violet-100 dark:bg-violet-900/15 blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
         
          <h2 className="font-poppins font-bold text-slate-900 dark:text-white text-2xl sm:text-[1.85rem] mt-1">
            {t("Questions fréquentes")}
          </h2>
          <p className="font-inter text-slate-500 dark:text-slate-400 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
            {t("Tout ce qu'il faut savoir avant de commencer.")}
          </p>
        </motion.div>

        {/* FAQ accordion card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
        >
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-slate-100 dark:border-slate-800/80 last:border-b-0">

              {/* Question row */}
              <button
                className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-inter font-medium text-[13.5px] text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 leading-snug">
                  {t(faq.question)}
                </span>
                <motion.span
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                    openIndex === i
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-400/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </motion.span>
              </button>

              {/* Answer — animated */}
              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-0">
                      <p className="font-inter text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed border-l-2 border-indigo-400/50 pl-3">
                        {t(faq.answer)}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default FAQ;
