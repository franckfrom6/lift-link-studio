import { useTranslation } from "react-i18next";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight } from "lucide-react";

const ACCENT = "#6C5CE7";

const StepsSection = () => {
  const { t } = useTranslation("landing");
  const ref = useScrollReveal();

  const steps = [
    { num: "①", title: t("step_1_title"), desc: t("step_1_desc") },
    { num: "②", title: t("step_2_title"), desc: t("step_2_desc") },
    { num: "③", title: t("step_3_title"), desc: t("step_3_desc") },
  ];

  return (
    <section className="py-20 bg-gray-50/50">
      <div ref={ref} className="max-w-[1200px] mx-auto px-4 sm:px-6 scroll-reveal">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-14">
          {t("steps_title")}
        </h2>
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-6 sm:gap-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-4 sm:gap-3">
              <div className="text-center max-w-[200px]">
                <div className="text-4xl mb-3" style={{ color: ACCENT }}>{step.num}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
              {i < 2 && (
                <ArrowRight size={20} className="hidden sm:block text-gray-300 flex-shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
