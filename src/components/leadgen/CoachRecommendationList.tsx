import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CoachRecommendationCard from "./CoachRecommendationCard";
import ContactCoachModal from "./ContactCoachModal";
import { Loader2 } from "lucide-react";

interface CoachProfile {
  coach_id: string;
  bio_fr: string;
  bio_en: string;
  specialties: string[];
  location_city: string | null;
  location_area: string | null;
  training_locations: string[];
  price_range: string | null;
  is_accepting_clients: boolean;
  client_count: number;
  is_featured: boolean;
}

const CoachRecommendationList = () => {
  const { t, i18n } = useTranslation("leadgen");
  const { user, profile } = useAuth();
  const [coaches, setCoaches] = useState<(CoachProfile & { full_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactCoach, setContactCoach] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data: publicProfiles } = await supabase
        .from("coach_profiles_public")
        .select("*")
        .eq("is_accepting_clients", true);

      if (!publicProfiles?.length) {
        setCoaches([]);
        setLoading(false);
        return;
      }

      // Get coach names
      const coachIds = publicProfiles.map(p => p.coach_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", coachIds);

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.user_id] = p.full_name; });

      setCoaches(publicProfiles.map(p => ({
        ...p,
        full_name: nameMap[p.coach_id] || "Coach",
        specialties: p.specialties || [],
        training_locations: p.training_locations || [],
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  // Calculate match scores
  const scoredCoaches = useMemo(() => {
    return coaches.map(coach => {
      let score = 0;
      const reasons: string[] = [];

      // Objective match
      if (profile?.goal && coach.specialties.some(s =>
        s.includes(profile.goal!.toLowerCase()) ||
        profile.goal!.toLowerCase().includes(s)
      )) {
        score += 30;
        reasons.push("Même objectif");
      }

      // Featured bonus
      if (coach.is_featured) {
        score += 20;
      }

      // Has specialties
      if (coach.specialties.length > 0) score += 15;

      // Location
      if (coach.location_city) score += 10;

      // Accepting clients
      score += 10;

      // Base score
      score += 15;

      return {
        coach_id: coach.coach_id,
        full_name: coach.full_name,
        bio: i18n.language === "en" ? coach.bio_en : coach.bio_fr,
        specialties: coach.specialties,
        location_city: coach.location_city || undefined,
        location_area: coach.location_area || undefined,
        price_range: coach.price_range || undefined,
        client_count: coach.client_count,
        is_featured: coach.is_featured,
        match_score: Math.min(score, 100),
        match_reasons: reasons,
      };
    }).sort((a, b) => b.match_score - a.match_score);
  }, [coaches, profile, i18n.language]);

  if (loading) {
    return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (scoredCoaches.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">{t("no_coaches_found")}</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-sm">{t("recommended_coaches")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t("based_on_profile")}</p>
      </div>
      <div className="space-y-3">
        {scoredCoaches.map(coach => (
          <CoachRecommendationCard
            key={coach.coach_id}
            coach={coach}
            onViewProfile={() => {/* future: navigate to profile */}}
            onContact={() => setContactCoach(coach.coach_id)}
          />
        ))}
      </div>
      {contactCoach && (
        <ContactCoachModal
          open={!!contactCoach}
          onClose={() => setContactCoach(null)}
          coachId={contactCoach}
        />
      )}
    </div>
  );
};

export default CoachRecommendationList;
