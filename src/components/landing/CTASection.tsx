import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const ACCENT = "#6C5CE7";

const CTASection = () => {
  const { t } = useTranslation("landing");
  const ref = useScrollReveal();

  return (
    <section className="py-24">
      <div ref={ref} className="max-w-[720px] mx-auto px-4 sm:px-6 text-center scroll-reveal">
        <div className="rounded-3xl p-10 sm:p-14" style={{ background: `${ACCENT}08` }}>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            {t("cta_title")}
          </h2>
          <p className="text-base text-gray-500 mb-8">{t("cta_subtitle")}</p>
          <Link
            to="/auth?tab=signup"
            className="inline-flex items-center justify-center text-base font-semibold text-white rounded-xl px-8 py-3.5 transition-all hover:opacity-90 shadow-lg"
            style={{ background: ACCENT, boxShadow: `0 8px 30px -8px ${ACCENT}66` }}
          >
            {t("cta_button")}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
