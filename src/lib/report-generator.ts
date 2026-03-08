import jsPDF from "jspdf";
import "jspdf-autotable";
import { BilanData, BilanRawData } from "@/components/coach/AIBilanView";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

export function generateBilanPDF(bilan: BilanData, rawData: BilanRawData, coachNotes?: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const addSection = (title: string, startY: number) => {
    if (startY > 260) {
      doc.addPage();
      startY = 20;
    }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(title, 14, startY);
    return startY + 8;
  };

  const addText = (text: string, startY: number, indent = 14) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, pageWidth - indent - 14);
    lines.forEach((line: string) => {
      if (startY > 275) {
        doc.addPage();
        startY = 20;
      }
      doc.text(line, indent, startY);
      startY += 5;
    });
    return startY + 2;
  };

  const addBullets = (items: string[], startY: number) => {
    items.forEach((item) => {
      if (startY > 275) {
        doc.addPage();
        startY = 20;
      }
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 32);
      lines.forEach((line: string) => {
        if (startY > 275) {
          doc.addPage();
          startY = 20;
        }
        doc.text(line, 18, startY);
        startY += 5;
      });
    });
    return startY + 2;
  };

  // Header
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Bilan de fin de cycle", 14, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${rawData.student_name} — ${rawData.student_level}`, 14, 26);
  doc.setFontSize(9);
  doc.text(`${rawData.date_start} → ${rawData.date_end} (${rawData.weeks} semaines) · Objectif : ${rawData.student_goal}`, 14, 33);
  y = 50;

  // Summary
  y = addSection("Résumé", y);
  y = addText(bilan.summary, y);

  // KPI Table
  y = addSection("Données clés", y);
  doc.autoTable({
    startY: y,
    head: [["Métrique", "Valeur"]],
    body: [
      ["Séances complétées", `${rawData.sessions_completed}/${rawData.sessions_programmed} (${rawData.adherence_rate}%)`],
      ["Séances externes", `${rawData.external_count}`],
      ["Volume total", `${Math.round(rawData.total_volume).toLocaleString()} kg`],
      ["Swaps", `${rawData.swaps_count}`],
      ["Poids", `${rawData.weight_start ?? "—"} → ${rawData.weight_end ?? "—"} kg`],
      ["Nutrition (jours loggués)", `${rawData.days_logged}/${rawData.total_days}`],
      ["Macros moyens", `P ${rawData.avg_macros.protein}g / C ${rawData.avg_macros.carbs}g / L ${rawData.avg_macros.fat}g`],
      ["Énergie / Sommeil / Stress", `${rawData.avg_energy} / ${rawData.avg_sleep} / ${rawData.avg_stress}`],
    ],
    theme: "striped",
    headStyles: { fillColor: [24, 24, 27] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 10;

  // Highlights
  y = addSection("✅ Points forts", y);
  y = addBullets(bilan.highlights, y);

  // Areas to improve
  y = addSection("⚠️ Axes d'amélioration", y);
  y = addBullets(bilan.areas_to_improve, y);

  // Strength
  y = addSection(`💪 Progression (${bilan.strength_progress.assessment})`, y);
  y = addText(bilan.strength_progress.detail, y);

  // Nutrition
  y = addSection(`🍎 Nutrition (${bilan.nutrition_assessment.adherence})`, y);
  y = addText(bilan.nutrition_assessment.detail, y);

  // Recovery
  y = addSection("❤️ Récupération", y);
  y = addText(bilan.recovery_assessment.detail, y);

  // Recommendations
  y = addSection("🎯 Recommandations pour le prochain cycle", y);
  y = addBullets(bilan.next_cycle_recommendations, y);
  y = addText(bilan.suggested_program_adjustments, y);

  // Coach talking points
  y = addSection("💬 Points à aborder", y);
  y = addBullets(bilan.coach_talking_points, y);

  // Coach notes
  if (coachNotes) {
    y = addSection("📝 Notes du coach", y);
    y = addText(coachNotes, y);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i}/${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, doc.internal.pageSize.getHeight() - 10);
  }

  return doc;
}
