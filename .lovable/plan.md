## Cause racine

Les 2 users créés depuis Lovable Cloud (`franck.berthelot@darix.io`, `simon@sonhoagency.com`) existent dans `auth.users` mais n'ont **aucune ligne dans `public.profiles`** (vérifié en base).

Pourquoi :
- La création de profil se fait **côté client** dans `AuthContext.signUp()`, uniquement quand l'inscription passe par l'écran de l'app.
- Il n'existe **aucun trigger** sur `auth.users` (db_triggers vide).
- Donc tout user créé hors signup de l'app (Lovable Cloud admin, invite, OAuth futur) n'a pas de profil.

Conséquences observées :
1. **Invisible dans l'admin** : `AdminPanel.fetchUsers()` liste `profiles` → ces users n'apparaissent pas.
2. **Login impossible (écran blanc)** : le token est bien émis (les logs auth montrent `/token` 200), mais `fetchProfile()` renvoie `null`, et `AuthGuard` bloque (`if (!user || !profile) return null`).

Le reset password marche car il ne touche qu'à `auth.users`.

## Plan

### 1. Migration — trigger d'auto-création de profil

Ajouter une fonction `SECURITY DEFINER` + trigger `AFTER INSERT ON auth.users` qui insère systématiquement une ligne dans `public.profiles` avec `onboarding_completed=false`. `ON CONFLICT (user_id) DO NOTHING` pour rester idempotent avec l'insert client existant.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    false
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 2. Backfill — combler les profils manquants

Dans la même migration, créer les profils orphelins pour les users existants (les 2 nouveaux + tout autre éventuel) :

```sql
insert into public.profiles (user_id, full_name, onboarding_completed)
select u.id, '', false
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null
on conflict (user_id) do nothing;
```

Le trigger existant `auto_assign_free_plan` (sur `profiles`) leur attribuera automatiquement le plan free.

### 3. Vérification

- Les 2 users apparaissent dans l'admin panel.
- Leur login redirige vers `/onboarding` au lieu d'un écran blanc.

### Hors scope

- Aucun changement de UI, de `AuthContext`, ou du flow signup app.
- Pas de modification des RLS existantes.
