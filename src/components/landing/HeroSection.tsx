import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const ACCENT = "#6C5CE7";

const HeroSection = () => {
  const { t } = useTranslation("landing");
  const ref = useScrollReveal();

  return (
    <section className="pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div ref={ref} className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 scroll-reveal">
        {/* Text */}
        <div className="flex-1 text-center lg:text-left">
          <div className="mb-6">
            <div className="inline-flex flex-col items-center lg:items-start">
              <span className="font-black text-5xl sm:text-6xl tracking-tighter leading-none">
                F<span style={{ color: ACCENT }}>6</span>GYM
              </span>
              <span className="text-[9px] tracking-[5px] text-gray-400 mt-1">COACHING</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-gray-900">
            {t("hero_title_1")}
            <br />
            {t("hero_title_2")}
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {t("hero_subtitle")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              to="/auth?tab=signup"
              className="inline-flex items-center justify-center text-base font-semibold text-white rounded-xl px-6 py-3 transition-all hover:opacity-90 shadow-lg"
              style={{ background: ACCENT, boxShadow: `0 8px 30px -8px ${ACCENT}66` }}
            >
              {t("hero_cta_primary")}
            </Link>
            <button
              onClick={() => document.getElementById("fonctionnalites")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center justify-center text-base font-semibold text-gray-700 rounded-xl px-6 py-3 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {t("hero_cta_secondary")}
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-400">{t("hero_free_mention")}</p>
        </div>

        {/* Visual placeholder */}
        <div className="flex-1 w-full max-w-md lg:max-w-lg">
          <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center">
            <div className="text-center px-8">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-xl" style={{ background: ACCENT }}>
                F6
              </div>
              <p className="text-sm text-gray-400">{t("placeholder_visual")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
