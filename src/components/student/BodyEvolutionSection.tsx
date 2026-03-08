import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBodyMeasurements, BodyMeasurement } from "@/hooks/useBodyMeasurements";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Ruler, Loader2 } from "lucide-react";
import { format } from "date-fns";

const BodyEvolutionSection = () => {
  const { t } = useTranslation("dashboard");
  const { measurements, loading, addMeasurement } = useBodyMeasurements();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    weight_kg: "",
    body_fat_pct: "",
    chest_cm: "",
    waist_cm: "",
    hips_cm: "",
    thigh_cm: "",
    arm_cm: "",
    notes: "",
  });

  const handleSave = async () => {
    await addMeasurement({
      date: form.date,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      body_fat_pct: form.body_fat_pct ? Number(form.body_fat_pct) : null,
      chest_cm: form.chest_cm ? Number(form.chest_cm) : null,
      waist_cm: form.waist_cm ? Number(form.waist_cm) : null,
      hips_cm: form.hips_cm ? Number(form.hips_cm) : null,
      thigh_cm: form.thigh_cm ? Number(form.thigh_cm) : null,
      arm_cm: form.arm_cm ? Number(form.arm_cm) : null,
      notes: form.notes || null,
    });
    setShowForm(false);
    setForm({ date: format(new Date(), "yyyy-MM-dd"), weight_kg: "", body_fat_pct: "", chest_cm: "", waist_cm: "", hips_cm: "", thigh_cm: "", arm_cm: "", notes: "" });
  };

  const weightData = [...measurements]
    .filter(m => m.weight_kg !== null)
    .reverse()
    .map(m => ({ date: m.date, value: m.weight_kg }));

  return (
    <div className="glass p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">{t("body_evolution")}</h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
          {t("add_measurement")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : weightData.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <Ruler className="w-8 h-8 text-muted-foreground mx-auto" strokeWidth={1.5} />
          <p className="font-semibold text-sm">{t("no_measurements")}</p>
          <p className="text-xs text-muted-foreground">{t("no_measurements_desc")}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weightData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
            <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            <Line type="monotone" dataKey="value" name={t("weight_kg")} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Recent measurements list */}
      {measurements.length > 0 && (
        <div className="space-y-1">
          {measurements.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
              <span className="text-muted-foreground">{new Date(m.date).toLocaleDateString()}</span>
              <div className="flex gap-3">
                {m.weight_kg !== null && <span>{m.weight_kg} kg</span>}
                {m.body_fat_pct !== null && <span>{m.body_fat_pct}%</span>}
                {m.waist_cm !== null && <span>{t("waist").split(" ")[0]}: {m.waist_cm}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add measurement dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("add_measurement")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("date")}</label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["weight_kg", t("weight_kg")],
                ["body_fat_pct", t("body_fat")],
                ["chest_cm", t("chest")],
                ["waist_cm", t("waist")],
                ["hips_cm", t("hips")],
                ["thigh_cm", t("thigh")],
                ["arm_cm", t("arm")],
              ] as [string, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
                  <Input
                    type="number"
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder="—"
                    className="h-8 text-sm"
                    step={0.1}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("notes")}</label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="..." className="h-9" />
            </div>
            <Button onClick={handleSave} className="w-full">{t("common:save")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BodyEvolutionSection;
