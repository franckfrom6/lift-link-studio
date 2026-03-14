export interface ProgramSection {
  name: string;
  duration: string;
  notes: string;
  exercises: ProgramExerciseDetail[];
}

export interface ProgramExerciseDetail {
  name: string;
  sets: string;
  reps: string;
  tempo: string;
  rest: string;
  rpe: string;
  load: string;
  video: string;
  videoSearchQuery?: string;
  channel: string;
  notes: string;
  videoUrlFemale?: string;
  videoUrlMale?: string;
  exerciseVideoUrl?: string;
}

export interface FullProgram {
  title: string;
  client: string;
  objective: string;
  duration: string;
  status: "draft" | "active" | "completed";
  sections: ProgramSection[];
  progression: string[];
}

export const YANA_PROGRAM: FullProgram = {
  title: "LOWER BODY — Glutes & Hamstrings Focus",
  client: "Femme • Avancée • 1x/semaine salle",
  objective: "Hypertrophie fessiers & ischios • Surcharge progressive",
  duration: "~1h10-1h15 tout inclus",
  status: "active",
  sections: [
    {
      name: "🔥 WARM-UP",
      duration: "10 min",
      notes: "Activation glutes + mobilité hanches. Objectif : réveiller le grand fessier avant les charges lourdes.",
      exercises: [
        {
          name: "Foam rolling — ischios, fessiers, TFL/IT band",
          sets: "2 min",
          reps: "",
          tempo: "",
          rest: "",
          rpe: "",
          load: "",
          video: "https://www.youtube.com/watch?v=SrUvx4YJmbo",
          channel: "Squat University",
          notes: "Insister sur les points de tension, rouler lentement"
        },
        {
          name: "90/90 Hip Switch",
          sets: "2",
          reps: "8/côté",
          tempo: "Contrôlé",
          rest: "—",
          rpe: "",
          load: "PDC",
          video: "https://www.youtube.com/watch?v=dEPaA-nxPzo",
          channel: "Squat University",
          notes: "Mobilité rotation interne/externe hanche"
        },
        {
          name: "Glute Bridge au sol (activation)",
          sets: "2",
          reps: "15",
          tempo: "2-0-2-1",
          rest: "—",
          rpe: "",
          load: "PDC + élastique genoux",
          video: "https://www.youtube.com/watch?v=OUgsJ8-Vi0E",
          channel: "Bret Contreras",
          notes: "Squeeze 2s en haut, focus contraction fessier"
        },
        {
          name: "Clamshell avec élastique",
          sets: "2",
          reps: "12/côté",
          tempo: "2-0-1-1",
          rest: "—",
          rpe: "",
          load: "Élastique moyen",
          video: "https://www.youtube.com/watch?v=cEhHoOBbFOQ",
          channel: "Bret Contreras",
          notes: "Activation gluteus medius, garder les pieds collés"
        }
      ]
    },
    {
      name: "🏋️ BLOC A — Compounds lourds (Force / Hypertrophie)",
      duration: "25 min",
      notes: "Mouvements principaux. Charges lourdes, mécanique hip-dominant. C'est ici que la magie opère pour le développement des fessiers.",
      exercises: [
        {
          name: "Hip Thrust Barre",
          sets: "4",
          reps: "8-10",
          tempo: "2-0-1-2",
          rest: "2'30\"",
          rpe: "8-9",
          load: "Progressif — viser +2.5kg/semaine",
          video: "https://www.youtube.com/watch?v=xDmFkJxPzeM",
          channel: "Bret Contreras",
          notes: "Roi des exos fessiers. Menton rentré, côtes basses, squeeze maximal en haut. Full hip extension sans hyperextension lombaire."
        },
        {
          name: "Romanian Deadlift (RDL) Barre",
          sets: "4",
          reps: "10-12",
          tempo: "3-0-1-1",
          rest: "2'00\"",
          rpe: "7-8",
          load: "Progressif",
          video: "https://www.youtube.com/watch?v=7j-2w4-P14I",
          channel: "Jeff Nippard",
          notes: "Étirement maximal des ischios en excentrique. Barre proche du corps, léger bend genoux, hinge aux hanches."
        }
      ]
    },
    {
      name: "🦵 BLOC B — Unilatéral & Hypertrophie",
      duration: "20 min",
      notes: "Travail unilatéral pour corriger les asymétries et cibler les fessiers sous différents angles. Volume modéré, contraction maximale.",
      exercises: [
        {
          name: "Bulgarian Split Squat (haltères)",
          sets: "3",
          reps: "10-12/côté",
          tempo: "2-1-1-0",
          rest: "1'30\" entre chaque jambe",
          rpe: "8",
          load: "Haltères moyens",
          video: "https://www.youtube.com/watch?v=2C-uNgKwPLE",
          channel: "Jeff Nippard",
          notes: "Buste légèrement penché en avant pour recruter davantage les glutes vs quads. Pied avant suffisamment loin du banc."
        },
        {
          name: "Step-Up sur box haute (haltères)",
          sets: "3",
          reps: "10/côté",
          tempo: "2-0-1-1",
          rest: "1'30\"",
          rpe: "7-8",
          load: "Haltères légers à moyens",
          video: "https://www.youtube.com/watch?v=dQqApCGd5Ss",
          channel: "Jeff Nippard",
          notes: "Box à hauteur du genou minimum. Pousser à travers le talon, pas d'impulsion avec le pied arrière."
        }
      ]
    },
    {
      name: "🎯 BLOC C — Isolation Glutes & Finisher",
      duration: "15 min",
      notes: "Isolation pure fessiers. Ici on cherche le pump, la connexion mind-muscle et le volume métabolique.",
      exercises: [
        {
          name: "Cable Pull-Through",
          sets: "3",
          reps: "15",
          tempo: "2-0-1-2",
          rest: "1'15\"",
          rpe: "7-8",
          load: "Modéré",
          video: "https://www.youtube.com/watch?v=ArPaAX_nvbw",
          channel: "Jeff Nippard",
          notes: "Hinge pattern. Squeeze glutes en fin de mouvement, ne pas hyperextendre. Excellent pour le pump fessier."
        },
        {
          name: "Cable Kickback (poulie basse)",
          sets: "3",
          reps: "12-15/côté",
          tempo: "2-0-1-1",
          rest: "1'00\"",
          rpe: "8",
          load: "Léger à modéré",
          video: "https://www.youtube.com/watch?v=dFp37Ias7oo",
          channel: "Bret Contreras",
          notes: "Contrôle total, pas de momentum. Extension hanche pure, garder le bassin neutre."
        },
        {
          name: "Seated Abduction Machine",
          sets: "3",
          reps: "15-20",
          tempo: "1-0-1-1",
          rest: "1'00\"",
          rpe: "9 (finisher)",
          load: "Dernier set en drop set",
          video: "https://www.youtube.com/watch?v=wz-vA3AvMLY",
          channel: "Bret Contreras",
          notes: "Buste penché en avant pour cibler le grand fessier. Dernier set : drop set pour finir en feu 🔥"
        }
      ]
    },
    {
      name: "🧘 COOL-DOWN",
      duration: "5 min",
      notes: "Retour au calme. Étirements statiques ciblés sur les zones travaillées.",
      exercises: [
        {
          name: "Étirement piriforme (figure 4 stretch)",
          sets: "1",
          reps: "45s/côté",
          tempo: "",
          rest: "—",
          rpe: "",
          load: "—",
          video: "https://www.youtube.com/watch?v=jRBLMxePwRs",
          channel: "Squat University",
          notes: "Allongée au sol, cheville sur genou opposé, tirer vers soi"
        },
        {
          name: "Étirement ischios (debout, pied sur banc)",
          sets: "1",
          reps: "45s/côté",
          tempo: "",
          rest: "—",
          rpe: "",
          load: "—",
          video: "https://www.youtube.com/watch?v=3MxHX9j15MU",
          channel: "Squat University",
          notes: "Hinge en avant, garder le dos droit"
        },
        {
          name: "Étirement fléchisseurs de hanche (lunge stretch)",
          sets: "1",
          reps: "45s/côté",
          tempo: "",
          rest: "—",
          rpe: "",
          load: "—",
          video: "https://www.youtube.com/watch?v=ePOUGBMTcHo",
          channel: "Squat University",
          notes: "Squeeze fessier du côté étiré, ne pas cambrer"
        }
      ]
    }
  ],
  progression: [
    "Semaines 1-2 : Apprentissage des tempos, trouver les charges de travail (RPE 7-8)",
    "Semaines 3-4 : Augmenter charges de 2.5-5kg sur Hip Thrust et RDL, maintenir les reps",
    "Semaines 5-6 : Augmenter les reps (haut de la fourchette) puis re-augmenter les charges",
    "Semaine 7 : DELOAD — 60% des charges, mêmes exos, focus technique et récupération",
    "Semaine 8 : Nouveau cycle avec variations (ex: B-Stance RDL, Sumo RDL, Hip Thrust pied surélevé)"
  ]
};
