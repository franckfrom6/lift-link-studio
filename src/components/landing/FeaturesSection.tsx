import { useTranslation } from "react-i18next";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Dumbbell, Timer, CalendarDays, Apple, RefreshCw, TrendingUp } from "lucide-react";

const ACCENT = "#6C5CE7";

const features = [
  { icon: Dumbbell, n: 1 },
  { icon: Timer, n: 2 },
  { icon: CalendarDays, n: 3 },
  { icon: Apple, n: 4 },
  { icon: RefreshCw, n: 5 },
  { icon: TrendingUp, n: 6 },
];

const FeatureBlock = ({ n, icon: Icon, reverse }: { n: number; icon: any; reverse: boolean }) => {
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

  const visualSide = (
    <div className="flex-1 w-full">
      <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <Icon size={40} style={{ color: ACCENT }} className="mx-auto mb-3 opacity-40" />
          <p className="text-xs text-gray-400">{t("placeholder_visual")}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={ref} className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-10 lg:gap-16 scroll-reveal`}>
      {textSide}
      {visualSide}
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
        <div className="space-y-24">
          {features.map((f, i) => (
            <FeatureBlock key={f.n} n={f.n} icon={f.icon} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
