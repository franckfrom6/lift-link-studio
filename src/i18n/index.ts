import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frProgram from './locales/fr/program.json';
import frSession from './locales/fr/session.json';
import frCalendar from './locales/fr/calendar.json';
import frNutrition from './locales/fr/nutrition.json';
import frCheckin from './locales/fr/checkin.json';
import frDashboard from './locales/fr/dashboard.json';
import frExercises from './locales/fr/exercises.json';
import frRecovery from './locales/fr/recovery.json';
import frSettings from './locales/fr/settings.json';
import frBilan from './locales/fr/bilan.json';
import frRecommendations from './locales/fr/recommendations.json';
import frPlans from './locales/fr/plans.json';
import frAdmin from './locales/fr/admin.json';
import frFeedback from './locales/fr/feedback.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enProgram from './locales/en/program.json';
import enSession from './locales/en/session.json';
import enCalendar from './locales/en/calendar.json';
import enNutrition from './locales/en/nutrition.json';
import enCheckin from './locales/en/checkin.json';
import enDashboard from './locales/en/dashboard.json';
import enExercises from './locales/en/exercises.json';
import enRecovery from './locales/en/recovery.json';
import enSettings from './locales/en/settings.json';
import enBilan from './locales/en/bilan.json';
import enRecommendations from './locales/en/recommendations.json';
import enPlans from './locales/en/plans.json';
import enAdmin from './locales/en/admin.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        common: frCommon,
        auth: frAuth,
        program: frProgram,
        session: frSession,
        calendar: frCalendar,
        nutrition: frNutrition,
        checkin: frCheckin,
        dashboard: frDashboard,
        exercises: frExercises,
        recovery: frRecovery,
        settings: frSettings,
        bilan: frBilan,
        recommendations: frRecommendations,
        plans: frPlans,
        admin: frAdmin,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        program: enProgram,
        session: enSession,
        calendar: enCalendar,
        nutrition: enNutrition,
        checkin: enCheckin,
        dashboard: enDashboard,
        exercises: enExercises,
        recovery: enRecovery,
        settings: enSettings,
        bilan: enBilan,
        recommendations: enRecommendations,
        plans: enPlans,
        admin: enAdmin,
      },
    },
    lng: 'fr',
    fallbackLng: 'fr',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;