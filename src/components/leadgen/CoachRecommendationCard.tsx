import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Star } from "lucide-react";

interface CoachRecommendationCardProps {
  coach: {
    coach_id: string;
    full_name: string;
    bio: string;
    specialties: string[];
    location_city?: string;
    location_area?: string;
    price_range?: string;
    client_count: number;
    is_featured: boolean;
    match_score: number;
    match_reasons: string[];
  };
  onViewProfile: () => void;
  onContact: () => void;
}

const CoachRecommendationCard = ({ coach, onViewProfile, onContact }: CoachRecommendationCardProps) => {
  const { t } = useTranslation("leadgen");

  return (
    <div className={`glass p-4 space-y-3 ${coach.is_featured ? "ring-1 ring-primary/30" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {coach.is_featured && (
              <Star className="w-4 h-4 text-primary fill-primary" strokeWidth={1.5} />
            )}
            <span className="font-semibold text-sm">Coach {coach.full_name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
            {(coach.location_city || coach.location_area) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" strokeWidth={1.5} />
                {[coach.location_city, coach.location_area].filter(Boolean).join(" · ")}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" strokeWidth={1.5} />
              {t("athletes_count", { count: coach.client_count })}
            </span>
            {coach.price_range && <span>{coach.price_range}</span>}
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs font-bold">
          {t("match", { score: Math.round(coach.match_score) })}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {coach.specialties.slice(0, 3).map(s => (
          <Badge key={s} variant="outline" className="text-[10px]">
            {t(`specialty_${s}`, s)}
          </Badge>
        ))}
      </div>

      {coach.bio && (
        <p className="text-xs text-muted-foreground line-clamp-2">{coach.bio}</p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onViewProfile}>
          {t("view_profile")}
        </Button>
        <Button size="sm" className="flex-1" onClick={onContact}>
          {t("contact_coach")}
        </Button>
      </div>
    </div>
  );
};

export default CoachRecommendationCard;
