import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const ACCENT = "#6C5CE7";

const LandingNav = () => {
  const { t, i18n } = useTranslation("landing");
  const [open, setOpen] = useState(false);

  const toggleLang = () => i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr");

  const scrollTo = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: ACCENT }}>
            F6
          </div>
          <span className="font-black text-xl tracking-tighter">
            F<span style={{ color: ACCENT }}>6</span>GYM
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => scrollTo("fonctionnalites")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            {t("nav_features")}
          </button>
          <button onClick={() => scrollTo("tarifs")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            {t("nav_pricing")}
          </button>
          <button onClick={toggleLang} className="text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2 py-1 transition-colors">
            {i18n.language === "fr" ? "EN" : "FR"}
          </button>
          <Link to="/auth" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            {t("nav_login")}
          </Link>
          <Link
            to="/auth?tab=signup"
            className="text-sm font-semibold text-white rounded-lg px-4 py-2 transition-all hover:opacity-90"
            style={{ background: ACCENT }}
          >
            {t("nav_cta")}
          </Link>
        </div>

        {/* Mobile burger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <button onClick={() => scrollTo("fonctionnalites")} className="block w-full text-left text-sm text-gray-600">
            {t("nav_features")}
          </button>
          <button onClick={() => scrollTo("tarifs")} className="block w-full text-left text-sm text-gray-600">
            {t("nav_pricing")}
          </button>
          <button onClick={toggleLang} className="text-xs font-bold text-gray-500 border border-gray-200 rounded-lg px-2 py-1">
            {i18n.language === "fr" ? "EN" : "FR"}
          </button>
          <Link to="/auth" className="block text-sm text-gray-600" onClick={() => setOpen(false)}>
            {t("nav_login")}
          </Link>
          <Link
            to="/auth?tab=signup"
            className="block text-center text-sm font-semibold text-white rounded-lg px-4 py-2.5"
            style={{ background: ACCENT }}
            onClick={() => setOpen(false)}
          >
            {t("nav_cta")}
          </Link>
        </div>
      )}
    </nav>
  );
};

export default LandingNav;
