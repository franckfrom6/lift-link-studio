import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

const ACCENT = "#6C5CE7";

const LegalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation("landing");

  const titleKey = slug === "terms" ? "legal_terms_title" : slug === "privacy" ? "legal_privacy_title" : "legal_mentions_title";
  const content = slug === "mentions" ? t("legal_mentions_content") : t("legal_placeholder");

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ colorScheme: "light" }}>
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-8">
          <ArrowLeft size={16} />
          F<span style={{ color: ACCENT }}>6</span>GYM
        </Link>
        <h1 className="text-3xl font-bold mb-6">{t(titleKey)}</h1>
        <p className="text-gray-500 leading-relaxed">{content}</p>
      </div>
    </div>
  );
};

export default LegalPage;
