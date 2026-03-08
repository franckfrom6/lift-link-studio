import { useTranslation } from "react-i18next";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Dumbbell, Timer, CalendarDays, Apple, RefreshCw, TrendingUp } from "lucide-react";
import featureImg1 from "@/assets/landing-feature-1.png";

const ACCENT = "#6C5CE7";

const features = [
  { icon: Dumbbell, n: 1, img: featureImg1 },
  { icon: Timer, n: 2 },
  { icon: CalendarDays, n: 3 },
  { icon: Apple, n: 4 },
  { icon: RefreshCw, n: 5 },
  { icon: TrendingUp, n: 6 },
];

const FeatureBlock = ({ n, icon: Icon, reverse, img }: { n: number; icon: any; reverse: boolean; img?: string }) => {
  const { t } = useTranslation("landing");
  const ref = useScrollReveal();

  const textSide = (
    <div className="flex-1">
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        {t(`feat_${n}_title`)}
      </h3>
      <p className="text-base text-gray-500 mb-4">{t(`feat_${n}_subtitle`)}</p>
      <ul className="space-y-2">
        {[1, 2, 3, 4].map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
            {t(`feat_${n}_bullet_${b}`)}
          </li>
        ))}
      </ul>
    </div>
  );

  const visualSide = img ? (
    <div className="flex-shrink-0 w-32 sm:w-40 lg:w-44">
      <img src={img} alt={t(`feat_${n}_title`)} className="w-full rounded-xl border border-gray-200 shadow-sm" loading="lazy" />
    </div>
  ) : (
    <div className="flex-shrink-0">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center">
        <Icon size={22} style={{ color: ACCENT }} className="opacity-50" />
      </div>
    </div>
  );

  return (
    <div ref={ref} className={`flex items-center gap-6 lg:gap-10 scroll-reveal ${reverse ? "lg:flex-row-reverse" : ""}`}>
      {visualSide}
      {textSide}
    </div>
  );
};

const FeaturesSection = () => {
  const { t } = useTranslation("landing");

  return (
    <section id="fonctionnalites" className="py-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-16">
          {t("features_title")}
        </h2>
        <div className="space-y-12">
          {features.map((f, i) => (
            <FeatureBlock key={f.n} n={f.n} icon={f.icon} reverse={i % 2 === 1} img={f.img} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
