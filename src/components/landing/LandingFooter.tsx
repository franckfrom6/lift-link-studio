import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const ACCENT = "#6C5CE7";

const LandingFooter = () => {
  const { t, i18n } = useTranslation("landing");
  const toggleLang = () => i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr");

  return (
    <footer className="border-t border-gray-100 py-12 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-4 gap-8 mb-10">
          {/* Logo */}
          <div>
            <span className="font-black text-xl tracking-tighter">
              F<span style={{ color: ACCENT }}>6</span>GYM
            </span>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t("footer_product")}</h4>
            <ul className="space-y-2">
              <li><a href="#fonctionnalites" className="text-sm text-gray-600 hover:text-gray-900">{t("footer_features")}</a></li>
              <li><a href="#tarifs" className="text-sm text-gray-600 hover:text-gray-900">{t("footer_pricing")}</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t("footer_resources")}</h4>
            <ul className="space-y-2">
              <li><Link to="/support/help" className="text-sm text-gray-600 hover:text-gray-900">{t("footer_help")}</Link></li>
              <li><Link to="/support" className="text-sm text-gray-600 hover:text-gray-900">{t("footer_support")}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t("footer_legal")}</h4>
            <ul className="space-y-2">
              <li><Link to="/legal/terms" className="text-sm text-gray-600 hover:text-gray-900">{t("footer_terms")}</Link></li>
              <li><Link to="/legal/privacy" className="text-sm text-gray-600 hover:text-gray-900">{t("footer_privacy")}</Link></li>
              <li><Link to="/legal/mentions" className="text-sm text-gray-600 hover:text-gray-900">{t("footer_mentions")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400">{t("footer_copyright")}</p>
          <button onClick={toggleLang} className="text-xs font-bold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2 py-1">
            {i18n.language === "fr" ? "EN" : "FR"}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
