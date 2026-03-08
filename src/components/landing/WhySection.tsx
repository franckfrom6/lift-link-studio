import { useTranslation } from "react-i18next";
import { ClipboardList, Bot, BarChart3 } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const ACCENT = "#6C5CE7";

const cards = [
  { icon: ClipboardList, titleKey: "why_card_1_title", descKey: "why_card_1_desc" },
  { icon: Bot, titleKey: "why_card_2_title", descKey: "why_card_2_desc" },
  { icon: BarChart3, titleKey: "why_card_3_title", descKey: "why_card_3_desc" },
];

const WhySection = () => {
  const { t } = useTranslation("landing");
  const ref = useScrollReveal();

  return (
    <section className="py-20 bg-gray-50/50">
      <div ref={ref} className="max-w-[1200px] mx-auto px-4 sm:px-6 scroll-reveal">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
          {t("why_title")}
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.titleKey} className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg hover:border-gray-200 transition-all">
              <card.icon size={32} style={{ color: ACCENT }} className="mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(card.titleKey)}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{t(card.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySection;
