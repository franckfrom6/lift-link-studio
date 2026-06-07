#!/usr/bin/env python3
"""Génère docs/testing/test-registry.json à partir de la classification de la Section 3 athlete.

À lancer depuis la racine du projet : python3 scripts/generate-test-registry.py

Le script :
1. Construit le registry en mémoire à partir de dicts Python (pas de génération de string géante).
2. Écrit le JSON sur disque avec json.dumps (garantit la validité syntaxique).
3. Relit le fichier et lance des assertions pour vérifier que les invariants de classification sont respectés.

À étendre au fur et à mesure que de nouvelles sections sont classifiées (Section 0, Section 1, etc.).
"""
import json
from pathlib import Path
from datetime import datetime, timezone


SECTION_3_ATHLETE = {
    "T-A-30": {
        "category": "auto-with-precond",
        "section": 3,
        "title": "Session loads correctly",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": "Rule 4b - heritage section Live Session. Entree dans la session depuis le preview.",
    },
    "T-A-31": {
        "category": "auto-with-precond",
        "section": 3,
        "title": "Previous session weight suggestion",
        "preconditions": [
            "athlete-has-completed-session",
            "athlete-has-programmed-session-today",
        ],
        "notes": (
            "Rule 4a + 4b. 'exercise you have done before' + 'last logged weight' matchent Rule 4a. "
            "Preconditions chainees : athlete-has-completed-session depend de "
            "athlete-has-programmed-session-today."
        ),
    },
    "T-A-32": {
        "category": "auto-with-precond",
        "section": 3,
        "title": "Log a set",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": "Rule 4b - heritage section pur. Aucun keyword Rule 4a dans le texte.",
    },
    "T-A-33": {
        "category": "auto-with-precond",
        "section": 3,
        "title": "Comparison arrows",
        "preconditions": [
            "athlete-has-completed-session",
            "athlete-has-programmed-session-today",
            "athlete-in-advanced-mode",
        ],
        "notes": (
            "Rule 4a + 4b. 'last session' match Rule 4a. "
            "Sans athlete-has-completed-session, les arrows n'ont rien a comparer "
            "(echec pour mauvaise raison). "
            "Toggle Mode avance requis - localisation a confirmer au premier run."
        ),
    },
    "T-A-34": {
        "category": "auto-with-precond",
        "section": 3,
        "title": "Rest timer - start",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": "Rule 4b - heritage section pur.",
    },
    "T-A-35": {
        "category": "auto-with-caveat",
        "section": 3,
        "title": "Rest timer - background / return",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": (
            "Rule 3 > Rule 4b. "
            "Simulation imparfaite : visibilitychange event + waitForTimeout(30000). "
            "Ne simule pas l'eviction memoire iOS reelle - a flaguer dans le rapport."
        ),
    },
    "T-A-36": {
        "category": "manual-only",
        "section": 3,
        "title": "Rest timer - silent mode (iOS)",
        "preconditions": [],
        "notes": "Rule 1 - ringer switch physique iOS. Non simulable Playwright.",
    },
    "T-A-37": {
        "category": "manual-only",
        "section": 3,
        "title": "Rest timer - alarm volume",
        "preconditions": [],
        "notes": "Rule 1 - 'clearly audible' = evaluation qualite sonore subjective. Non testable en headless.",
    },
    "T-A-38": {
        "category": "auto-with-precond",
        "section": 3,
        "title": "Demo video button",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": "Rule 4b - heritage section pur. Visibilite bouton (accent colour) + chargement embed YouTube.",
    },
    "T-A-39": {
        "category": "auto-with-precond",
        "section": 3,
        "title": "Add a set after completion",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": (
            "Rule 4b. Known bug (script explicite) : bouton 'Ajouter une serie' desactive ou cache "
            "apres completion de tous les sets. Test conserve - signal quand le bug est corrige."
        ),
    },
    "T-A-40": {
        "category": "auto-with-precond",
        "section": 3,
        "title": "Exercise video replay after done",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": (
            "Rule 4b - heritage section pur. "
            "Watch-for eleve : l'app pourrait marquer la session comme terminee "
            "ou naviguer ailleurs lors du tap sur le bouton video apres completion."
        ),
    },
    "T-A-41": {
        "category": "auto-with-precond",
        "section": 3,
        "title": "Skip exercise",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": "Rule 4b - heritage section pur.",
    },
    "T-A-42": {
        "category": "auto-with-precond",
        "section": 3,
        "title": "Swap exercise",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": (
            "Rule 4b - heritage section pur. "
            "Watch-for eleve : substitution pourrait ne pas persister apres scroll, "
            "nom original toujours affiche."
        ),
    },
    "T-A-43": {
        "category": "auto-with-caveat",
        "section": 3,
        "title": "Session elapsed timer - after app switch",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": (
            "Rule 3 > Rule 4b. "
            "Simulation imparfaite : visibilitychange event + waitForTimeout(60000). "
            "Ne simule pas l'eviction memoire iOS reelle - a flaguer dans le rapport."
        ),
    },
    "T-A-44": {
        "category": "auto-with-caveat",
        "section": 3,
        "title": "Active exercise key restored after reload",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": (
            "Rule 3 > Rule 4b. "
            "Simulation imparfaite : page.reload() ne simule pas l'eviction memoire iOS reelle - "
            "a flaguer dans le rapport. "
            "Groupe sequential : le spec doit skip x2 exercices dans le meme test "
            "pour atteindre le 3e avant reload. State accumule en une seule execution."
        ),
    },
    "T-A-45": {
        "category": "auto-with-precond",
        "section": 3,
        "title": "End session - undo",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": (
            "Rule 4b. "
            "Groupe sequential : 'near the end of the session' - "
            "le spec doit valider ou skipper N-1 exercices dans le meme test. "
            "Logique de progression a definir au moment du spec."
        ),
    },
    "T-A-46": {
        "category": "auto-with-precond",
        "section": 3,
        "title": "Session saves correctly",
        "preconditions": ["athlete-has-programmed-session-today"],
        "notes": (
            "Rule 4b. Fin de session complete. "
            "Requiert un E2E Test Program avec au moins 1 exercice entierement validable jusqu'au bout."
        ),
    },
}


def main():
    registry = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "scripts": {
            "athlete-test-script.md": {
                "tests": SECTION_3_ATHLETE,
            }
        },
    }

    output_path = Path("docs/testing/test-registry.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(registry, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    # Self-check : re-lire et parser pour confirmer
    parsed = json.loads(output_path.read_text(encoding="utf-8"))
    tests = parsed["scripts"]["athlete-test-script.md"]["tests"]
    test_count = len(tests)
    print(f"Wrote {output_path} ({test_count} tests)")

    # Assertions invariants de classification
    assert test_count == 17, f"Attendu 17 tests, trouve {test_count}"
    assert len(tests["T-A-33"]["preconditions"]) == 3, "T-A-33 doit avoir 3 preconditions"
    assert len(tests["T-A-31"]["preconditions"]) == 2, "T-A-31 doit avoir 2 preconditions"
    assert "known bug" not in tests["T-A-40"]["notes"].lower(), "T-A-40 ne doit pas mentionner known bug"
    assert "known bug" not in tests["T-A-42"]["notes"].lower(), "T-A-42 ne doit pas mentionner known bug"
    assert "sequential" in tests["T-A-44"]["notes"].lower(), "T-A-44 doit mentionner sequential"
    assert "sequential" in tests["T-A-45"]["notes"].lower(), "T-A-45 doit mentionner sequential"
    assert tests["T-A-36"]["preconditions"] == [], "T-A-36 doit avoir preconditions vides"
    assert tests["T-A-37"]["preconditions"] == [], "T-A-37 doit avoir preconditions vides"
    assert "known bug" in tests["T-A-39"]["notes"].lower(), "T-A-39 doit mentionner known bug"
    assert "simulation imparfaite" in tests["T-A-35"]["notes"].lower(), "T-A-35 doit mentionner simulation imparfaite"
    assert "simulation imparfaite" in tests["T-A-43"]["notes"].lower(), "T-A-43 doit mentionner simulation imparfaite"
    assert "simulation imparfaite" in tests["T-A-44"]["notes"].lower(), "T-A-44 doit mentionner simulation imparfaite"
    assert tests["T-A-36"]["category"] == "manual-only", "T-A-36 doit etre manual-only"
    assert tests["T-A-37"]["category"] == "manual-only", "T-A-37 doit etre manual-only"

    print("All assertions passed")


if __name__ == "__main__":
    main()
