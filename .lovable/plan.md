## Objectif

Permettre la création d'athlètes (et de coachs) de deux façons :
1. **Depuis l'app admin** : formulaire complet → crée le compte + profil + lien coach optionnel + envoie un magic link.
2. **Depuis Lovable Cloud** : l'utilisateur passe par l'onboarding normal à sa 1re connexion et choisit lui-même coach/athlète (déjà couvert par le trigger `handle_new_user` qu'on vient d'ajouter — rien à faire de plus, c'est exactement le flux "choix à la 1re connexion").

## Plan

### 1. Edge function `admin-create-user`

Nouvelle fonction `supabase/functions/admin-create-user/index.ts` qui utilise la `service_role` :

- **Auth** : vérifie le JWT du caller via `getClaims(token)` puis check `is_admin = true` dans `profiles`. Sinon 403.
- **Input validé** (Zod) :
  - `email` (requis)
  - `full_name` (requis)
  - `role` : `"coach" | "student"` (requis)
  - `coach_id` (optionnel, uniquement si role=student)
  - `plan_name` (optionnel, défaut `free`)
- **Actions** :
  1. `admin.createUser({ email, email_confirm: true, user_metadata: { full_name } })`
  2. `upsert` dans `profiles` avec `user_id`, `full_name`, `role`, `onboarding_completed = true`
  3. Si `coach_id` fourni + role=student : `insert` dans `coach_students` (status=active)
  4. Si `plan_name` ≠ free : update/insert `user_subscriptions`
  5. `admin.generateLink({ type: 'magiclink', email })` → renvoyer le lien au front (l'email part automatiquement via les templates auth en place)
- **CORS** + erreurs propres + logs `[admin-create-user]`.
- `config.toml` : `verify_jwt = false` (on valide en code).

### 2. UI admin — modale "Créer un utilisateur"

Dans `src/pages/AdminPanel.tsx`, ajouter au-dessus de la liste users un bouton **"+ Créer un utilisateur"** qui ouvre un `Dialog` shadcn contenant :

- `Input` email
- `Input` full_name
- `Select` rôle (Athlète / Coach)
- Si rôle = Athlète :
  - `Select` coach assigné (optionnel — peuplé depuis `profiles where role='coach'`)
- `Select` plan (free / pro / … — depuis `allPlans` déjà chargé)
- Bouton "Créer" → `supabase.functions.invoke('admin-create-user', { body })`
- Toast succès + refresh de la liste users + affichage du magic link copiable (utile si l'email n'arrive pas tout de suite).

### 3. Vérification

- Créer un athlète depuis l'admin : il apparaît immédiatement dans la liste, reçoit un email magic link, peut se connecter sans onboarding.
- Créer un user depuis Lovable Cloud : il atterrit sur `/onboarding` à sa 1re connexion (comportement actuel, déjà OK depuis la migration précédente).

### Détails techniques

- L'edge function utilise `SUPABASE_SERVICE_ROLE_KEY` (déjà présente dans les secrets).
- Le trigger `auto_assign_free_plan` existant gère le plan free par défaut ; on n'override que si l'admin choisit autre chose.
- Le trigger `handle_new_user` (déjà en place) crée le profil ; l'edge function le met juste à jour avec role + onboarding_completed=true via `upsert`.
- Pas de modif des RLS existantes (la fonction utilise service_role).

### Hors scope

- Création en masse / import CSV.
- Modification d'un user existant via cette modale (l'admin a déjà le changement de plan en place).
- Reset password depuis l'admin (peut être ajouté dans un 2e temps).
