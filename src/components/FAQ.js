import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            {t("Questions fréquentes")}
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            {t("Tout ce qu'il faut savoir avant de commencer.")}
          </p>
        </div>
 
        <div className="max-w-2xl mx-auto border rounded-xl px-6 bg-white">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b last:border-b-0">
              <button
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium hover:text-blue-600 transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                {t(faq.question)}
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="pb-4 text-sm text-gray-500 leading-relaxed">
                  {t(faq.answer)}
                </div>
              )}
            </div>
          ))}
        </div>
 
      </div>
 
    </section>
  );
};
 
export default FAQ;