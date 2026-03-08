import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Users, BarChart3, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PlanBadge from "@/components/plans/PlanBadge";

const AdminDashboard = () => {
  const { t, i18n } = useTranslation("admin");
  const [stats, setStats] = useState({ total: 0, coaches: 0, students: 0, planCounts: {} as Record<string, number> });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: profiles } = await supabase.from("profiles").select("role");
      const { data: subs } = await supabase.from("user_subscriptions").select("plan_id");
      const { data: plans } = await supabase.from("plans").select("id, name");

      const planMap = new Map((plans || []).map((p: any) => [p.id, p.name]));
      const planCounts: Record<string, number> = { free: 0, essential: 0, advanced: 0 };
      (subs || []).forEach((s: any) => {
        const name = planMap.get(s.plan_id) || "free";
        planCounts[name] = (planCounts[name] || 0) + 1;
      });

      setStats({
        total: profiles?.length || 0,
        coaches: profiles?.filter((p: any) => p.role === "coach").length || 0,
        students: profiles?.filter((p: any) => p.role === "student").length || 0,
        planCounts,
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-destructive" />
        <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("total_users")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.coaches} coaches · {stats.students} {i18n.language === "fr" ? "élèves" : "students"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("plan_distribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.planCounts).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between">
                  <PlanBadge plan={plan} showTooltip={false} />
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;