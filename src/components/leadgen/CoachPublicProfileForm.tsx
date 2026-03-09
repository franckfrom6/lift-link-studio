import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const SPECIALTIES = [
  "personal_training", "hyrox", "weight_loss", "muscle_gain",
  "strength", "endurance", "flexibility", "rehab"
];

const LOCATIONS = ["gym", "home", "outdoor", "online"];

const CoachPublicProfileForm = () => {
  const { t, i18n } = useTranslation("leadgen");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    bio_fr: "",
    bio_en: "",
    specialties: [] as string[],
    location_city: "",
    location_area: "",
    training_locations: [] as string[],
    price_range: "€€",
    is_accepting_clients: true,
  });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("coach_profiles_public")
        .select("*")
        .eq("coach_id", user.id)
        .maybeSingle();
      if (data) {
        setProfile({
          bio_fr: data.bio_fr || "",
          bio_en: data.bio_en || "",
          specialties: data.specialties || [],
          location_city: data.location_city || "",
          location_area: data.location_area || "",
          training_locations: data.training_locations || [],
          price_range: data.price_range || "€€",
          is_accepting_clients: data.is_accepting_clients,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const toggleSpecialty = (s: string) => {
    setProfile(prev => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter(x => x !== s)
        : [...prev.specialties, s],
    }));
  };

  const toggleLocation = (l: string) => {
    setProfile(prev => ({
      ...prev,
      training_locations: prev.training_locations.includes(l)
        ? prev.training_locations.filter(x => x !== l)
        : [...prev.training_locations, l],
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("coach_profiles_public")
      .upsert({
        coach_id: user.id,
        ...profile,
      }, { onConflict: "coach_id" });

    if (error) {
      console.error(error);
      toast.error("Erreur");
    } else {
      toast.success(t("profile_saved"));
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold">{t("bio")} (FR)</Label>
        <Textarea
          value={profile.bio_fr}
          onChange={e => setProfile(p => ({ ...p, bio_fr: e.target.value }))}
          rows={3}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-sm font-semibold">{t("bio")} (EN)</Label>
        <Textarea
          value={profile.bio_en}
          onChange={e => setProfile(p => ({ ...p, bio_en: e.target.value }))}
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold">{t("specialties")}</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {SPECIALTIES.map(s => (
            <Badge
              key={s}
              variant={profile.specialties.includes(s) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleSpecialty(s)}
            >
              {t(`specialty_${s}`)}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold">{t("location")}</Label>
          <Input
            value={profile.location_city}
            onChange={e => setProfile(p => ({ ...p, location_city: e.target.value }))}
            placeholder="Paris"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm font-semibold">Quartier</Label>
          <Input
            value={profile.location_area}
            onChange={e => setProfile(p => ({ ...p, location_area: e.target.value }))}
            placeholder="Bastille"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">{t("training_locations")}</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {LOCATIONS.map(l => (
            <Badge
              key={l}
              variant={profile.training_locations.includes(l) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleLocation(l)}
            >
              {t(l)}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">{t("price_range")}</Label>
        <div className="flex gap-2 mt-2">
          {["€", "€€", "€€€"].map(p => (
            <Badge
              key={p}
              variant={profile.price_range === p ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setProfile(prev => ({ ...prev, price_range: p }))}
            >
              {p}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={profile.is_accepting_clients}
          onCheckedChange={v => setProfile(p => ({ ...p, is_accepting_clients: v }))}
        />
        <Label className="text-sm">{t("accept_new_clients")}</Label>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {t("edit_profile")}
      </Button>
    </div>
  );
};

export default CoachPublicProfileForm;
