# DevTool – Spécif### 1.3 Types Stricts
- Chaque composant/hook reçoit un client ORPC typé spécifique à son contrat
- Utilisation de `useDevTool<PluginContract>().orpc.[functionToCall]()` pour les appels typés
- IntelliSense complet et vérification de types au compile-timeion Technique & Guide d'Implémentation

Ce document constitue la référence complète à transmettre à un autre LLM / développ5. Fonctions Publiques Principales
usePlugins(pluginList: ModulePlugin[], options?: UsePluginsOptions): ResolvedRegistry

Fusionne l'inventaire UI/hooks des plugins activés.
Valide dépendances si strictDependencies.
getRouterFromPlugins(pluginLi12. Flux de Données
Démarrage: on charge config (env, etc.)
On déclare une liste statique ou dynamiq19. Critères d'Acceptation
L'utilisation de Tu es chargé d'implémenter un DevTool selon la spécification suivante. Respecte strictement:
- Structure de répertoires
- Interfaces (ModulePlugin, ORPCRouter, etc.)
- Fonctions publiques: usePlugins, getRouterFromPlugins, useDevTool<PluginContract>
- Namespacing: core.* et mod.<nom>.*
- Utilisation exclusive de useDevTool<PluginContract>().orpc.[functionToCall]() pour les appels

Livrables:
1. Code TypeScript complet
2. Tests minimalistes (au moins core + module exemple)
3. Script main démonstration
4. Aucun framework externe (pas d'Express, etc.)

Référence Spécification:
[Coller ici tout le document de spécification fourni]

Quand tu as fini, fournis:
- Liste fichiers + extraits clés
- Commandes pour build & run
- Résultats attendus d'exécutionontract>().orpc.version()` retourne un objet { commit, buildTime }.
L'ajout de todoPlugin rend accessible `useDevTool<TodoContract>().orpc.todos.list()`.
La désactivation d'un plugin (enabled:false) retire ses routes & exports.
Conflits de composants en mode namespace impossible (noms distincts).
Tests passent (≥ 90% des cas listés §14).
Aucune dépendance externe autre que TypeScript / Node (sauf dev).
Code structuré et lisible.
Mise à jour (nouveau catalogue):
- L'utilisation de `useDevTool<BundleContract>().orpc.version()` retourne les métadonnées build.
- L'utilisation de `useDevTool<AuthContract>().orpc.session.get()` retourne la session utilisateur lorsque authPlugin est présent.
UI & Registry:
- DevToolProvider ne monte rien en production.
- En dev, changement d'état (none -> normal -> expanded) fonctionne.
- Pinned plugin apparaît dans la barre reduced.
- Event d'expansion sélectionne correctement la page ciblée.sePlugins construit un registre UI (lazy imports).
getRouterFromPlugins construit l'API unifiée.
Un adaptateur HTTP mappe les requêtes entrantes vers les procédures du router.
Les composants utilisent useDevTool<PluginContract>().orpc.[functionToCall]() pour les appels typés.dulePlugin[]): ORPCRouter

Construit un router global:
merge('', coreRouter)
pour chaque plugin actif avec router: merge(namespace, plugin.router)
useDevTool<PluginContract>(): { orpc: TypedORPCClient }

Retourne un client ORPC typé pour un plugin spécifique.
Usage: `const { orpc } = useDevTool<AuthContract>(); const session = await orpc.session.get();`plémenter le système. Il décrit: objectifs, concepts, architecture, structure de répertoires, API internes, conventions, cas de test, roadmap et tâches.

## 1. Objectif

Construire un système de plugins DevTool avec une architecture **contract-first** où chaque plugin définit son propre contrat ORPC et ses exports sélectifs. Trois piliers fondamentaux:

### 1.1 Contrats Embarqués
- Chaque plugin définit son contrat ORPC dans sa définition
- Les contrats sont co-localisés avec les plugins (pas de définition externe)
- Namespace unifié: `mainRoute.[pluginName].*` pour tous les plugins

### 1.2 Chargement Sélectif  
- Les exports (server/components/hooks) sont chargés à la demande via des imports inline
- Permet de charger uniquement server OU client OU hooks selon les besoins
- Optimise les performances et réduit la taille des bundles

### 1.3 Types Stricts
- Chaque composant/hook reçoit un client ORPC typé spécifique à son contrat
- Utilisation de `useDevTool<PluginContract>()` pour obtenir un client typé
- IntelliSense complet et vérification de types au compile-timecification Technique & Guide d’Implémentation
Ce document constitue la référence complète à transmettre à un autre LLM / développeur pour implémenter le système. Il décrit: objectifs, concepts, architecture, structure de répertoires, API internes, conventions, cas de test, roadmap et tâches.

1. Objectif
Construire un noyau (core) toujours présent + un système de plugins modules optionnels. Deux piliers:

Agrégation logique (UI/components/hooks) avec usePlugins(pluginList)
Agrégation RPC (procedures) avec getRouterFromPlugins(pluginList) qui inclut:
Tous les routers core (par défaut)
Les routers des plugins activés
Aucun plugin ne doit avoir à "déclarer" le core. Le core est global, stable, namespacé sous core.*.

Les modules sont namespacés mod.<nom>.*.

## 2. Concepts Clés

| Concept | Description |
|---------|-------------|
| **Plugin Contract** | Définition ORPC embarquée dans chaque plugin spécifiant les procédures disponibles |
| **Typed Client** | Client ORPC typé spécifique au contrat d'un plugin, obtenu via `useDevTool<Contract>().orpc` |
| **Selective Loading** | Système d'imports inline permettant de charger uniquement server/components/hooks à la demande |
| **Unified Namespace** | Tous les plugins utilisent le préfixe `mainRoute.[pluginName].*` |
| **Contract-First Design** | Chaque plugin définit d'abord son contrat, puis implémente server/client en conséquence |
| **Plugin Definition** | Structure déclarative contenant contrat, exports sélectifs et métadonnées |

### 2.1 Catalogue des Plugins (Version Contract-First)

| Type | Nom Plugin | Namespace | Responsabilité | Exemple Contract |
|------|------------|-----------|----------------|-----------------|
| Core | bundle | `core.bundle.*` | Infos build, assets, versions | `listAssets()`, `getVersion()` |
| Core | routes | `core.routes.*` | Introspection des routes applicatives | `list()`, `getDetail(id)` |
| Core | cli | `core.cli.*` | Exposition des commandes internes | `list()`, `run(command)` |
| Core | logs | `core.logs.*` | Accès aux logs applicatifs | `tail()`, `getRecent(limit)` |
| Module | auth | `mod.auth.*` | Sessions & gestion utilisateurs | `session.get()`, `users.list()` |
| Module | todo | `mod.todo.*` | Gestion de tâches de développement | `list()`, `add(title)`, `delete(id)` |
| Module | tanstackQuery | `mod.tanstackQuery.*` | Inspection cache TanStack Query | `cache.keys()`, `cache.detail()` |

### 2.2 Architecture Contract-First

Chaque plugin suit cette structure:

```typescript
interface DevToolPlugin {
  kind: 'core' | 'module';
  name: string; // e.g., 'bundle', 'auth', 'todo'
  version: string;
  
  // Contrat embarqué définissant l'API
  contract: {
    namespace: `mainRoute.${string}`;
    procedures: Record<string, ProcedureDefinition>;
  };
  
  // Exports sélectifs avec imports inline
  exports: {
    server?: () => Promise<ORPCRouter>;
    components?: Record<string, () => Promise<React.ComponentType<{ orpc: TypedClient }>>>;
    hooks?: Record<string, () => Promise<(orpc: TypedClient) => any>>;
  };
  
  meta?: PluginMetadata;
}
```

2.2 Registry & UI DevTool (Nouveau)

Ce projet inclut un **Plugin Registry** runtime + une **UI DevTool** officielle offrant deux modes d'affichage:

| Élément | Description | Raison d'être |
|---------|-------------|---------------|
| Plugin Registry (Zustand) | Stocke l'état des plugins chargés (activation, sélection de page, pages disponibles) et fournit des méthodes: register, unregister, activate, deactivate, selectPage, getSelectedPage, getActivePlugins | Simplifier introspection et orchestration UI des plugins côté client |
| DevToolState Store | Gère: état global (none / normal / expanded), position dock (side + size), settings UI (tooltips, animations, autoExpand), liste pinnedPlugins | Offre persistance UX (localStorage) et personnalisation |
| DevTool UI – Reduced ("normal") | Barre/Sidebar compacte affichant un nombre limité de plugins (pinned ou premiers) et un bouton pour passer en mode étendu | Accès rapide sans encombrer l'écran |
| DevTool UI – Expanded | Panneau principal avec navigation hiérarchique (Core / Plugins), pages et sous-pages, zone de contenu dynamique | Exploration et debugging détaillés |
| Reduced Mode Display | Composant par plugin (optionnel) permettant de montrer un mini état (badge, compteur, status) dans la barre réduite | Feedback en temps réel compact |
| Reduced Mode Menu | Menu contextuel associé à un plugin fournissant actions rapides groupées ou listées | Productivité (actions fréquentes) |

Architecture UI:
- Chaque plugin déclare `groups[]` avec `pages[]` (hiérarchie simple). Une page peut avoir des `children` pour sous-pages.
- Le registre conserve l'ID de page sélectionnée + plugin courant.
- Événement personnalisé `devtools:expand-plugin` (detail: { pluginId, pageId? }) peut forcer l'expansion et navigation directe.

Interfaces UI supplémentaires (à formaliser côté types):
```ts
export interface PluginPage {
  id: string;
  label: string;
  description?: string;
  icon?: string | React.ReactNode;
  badge?: string | number;
  component: React.ComponentType<{ context: PluginContext }>;
  children?: PluginPage[];
}

export interface PluginGroup {
  id: string;
  label: string;
  pages: PluginPage[];
}

export interface DevToolPlugin {
  metadata: {
    id: string;          // ex: routes, cli, logs, mod.todo
    name: string;        // Label UI
    version?: string;
    description?: string;
    author?: string;
    icon?: string | React.ReactNode;
    category?: string;
  };
  groups: PluginGroup[];
  reduced?: ReducedModeConfig;
}

export interface ReducedModeMenuItem { id: string; label: string; description?: string; icon?: string | React.ReactNode; action: () => void; disabled?: boolean; badge?: string | number }
export interface ReducedModeMenuGroup { label: string; items: ReducedModeMenuItem[] }
export interface ReducedModeConfig { component?: React.ComponentType<{ context: PluginContext }>; menu?: { groups: ReducedModeMenuGroup[] } | { items: ReducedModeMenuItem[] }; getData?: () => any }

export interface PluginContext {
  metadata: DevToolPlugin['metadata'];
  isActive: boolean;
  activate: () => void;
  deactivate: () => void;
  orpc: TypedORPCClient; // Typed ORPC client specific to plugin contract
}
```

Store DevToolState (pseudo):
```ts
interface DevToolSettings { showTooltips: boolean; autoExpand: boolean; enableAnimations: boolean; maxNormalPlugins: number }
interface DevToolPosition { side: 'left'|'right'|'top'|'bottom'; size: number }
type DevToolStateMode = 'none' | 'normal' | 'expanded';

interface DevToolStateStore {
  state: DevToolStateMode;
  setState(mode: DevToolStateMode): void;
  position: DevToolPosition;
  setPosition(p: Partial<DevToolPosition>): void;
  settings: DevToolSettings;
  updateSettings(p: Partial<DevToolSettings>): void;
  pinnedPlugins: Set<string>;
  pinPlugin(id: string): void;
  unpinPlugin(id: string): void;
  isPluginPinned(id: string): boolean;
}
```

### 2.3 Interface Utilisateur DevTool (Updated)

Le système DevTool propose deux modes d'affichage principaux inspirés des meilleures pratiques des devtools modernes : **Nuxt DevTools** pour le mode étendu et **Laravel Debugbar** pour le mode réduit.

#### 2.3.1 Mode Réduit (Laravel Debugbar Style)

Le mode réduit présente une **barre horizontale au bas de l'écran** similaire à Laravel Debugbar, offrant un accès rapide aux plugins actifs sous forme d'onglets horizontaux.

**Caractéristiques du Mode Réduit :**
- **Position fixe** : Barre horizontale en bas de l'écran (full-width)
- **Style Laravel Debugbar** : Onglets horizontaux avec indicateurs de statut
- **Plugins actifs** : Affichage des plugins sous forme de boutons/onglets cliquables
- **Indicateurs visuels** : Points colorés pour montrer l'état des plugins
- **Accès rapide** : Ajout de nouveaux plugins via bouton "+"
- **Contrôles** : Logo DevTools, bouton d'expansion, menu settings

**Interface du Mode Réduit :**
```tsx
interface ReducedBarLayout {
  // Zone principale avec plugins actifs
  pluginTabs: {
    layout: 'horizontal';
    style: 'laravel-debugbar';
    items: PluginTab[];
  };
  
  // Zone de contrôles à droite
  controls: {
    devToolsBrand: ReactNode;
    expandButton: Button;
    settingsMenu: DropdownMenu;
  };
}

interface PluginTab {
  icon?: ReactNode;
  name: string;
  status: 'active' | 'inactive' | 'error';
  statusIndicator: ColoredDot;
}
```

#### 2.3.2 Mode Étendu (Nuxt DevTools Style)

Le mode étendu déploie un **panneau type "card" centré en bas de l'écran** inspiré de Nuxt DevTools, avec une sidebar shadcn pour la navigation des plugins.

**Caractéristiques du Mode Étendu :**
- **Position centrée** : Card flottante au centre-bas de l'écran (bottom-center)
- **Style Nuxt DevTools** : Panneau type carte avec coins arrondis et ombre
- **Taille adaptative** : 90% de la largeur d'écran, maximum 6xl (1152px)
- **Hauteur optimisée** : 32rem (512px) par défaut, maximum 80vh
- **Sidebar shadcn** : Navigation avec groups (Core/Modules) et plugins
- **Transparence** : Arrière-plan avec backdrop-blur et opacity

**Architecture de l'Interface Étendue :**

1. **Card Container (Nuxt Style)**
   - **Position** : `fixed bottom-4 left-1/2 transform -translate-x-1/2`
   - **Largeur** : `w-[90vw] max-w-6xl`
   - **Style** : `rounded-xl shadow-2xl backdrop-blur-sm bg-opacity-95`
   - **Hauteur** : `h-[32rem] max-h-[80vh]`

2. **Sidebar Navigation (Shadcn Sidebar)**
   - **Largeur** : `min-w-64 max-w-80`
   - **Header** : Indicateur de connexion (point vert) + titre
   - **Groups** : "Core Plugins" et "Module Plugins" séparés
   - **Footer** : Boutons Minimize et Close

3. **Zone de Contenu Principal**
   - **Header** : Icône + nom plugin + description + contrôles
   - **Content** : Rendu dynamique du composant plugin actif
   - **Scroll** : Overflow auto pour contenu long

**Structure du Panneau Étendu :**
```tsx
interface ExpandedPanelLayout {
  // Container principal (Nuxt card style)
  cardContainer: {
    position: 'bottom-center';
    style: 'nuxt-devtools-card';
    dimensions: {
      width: '90vw max 6xl';
      height: '32rem max 80vh';
    };
    appearance: {
      rounded: 'xl';
      shadow: '2xl';
      backdrop: 'blur-sm';
      transparency: '95%';
    };
  };
  
  // Sidebar avec navigation
  sidebar: {
    component: 'shadcn-sidebar';
    variant: 'inset';
    width: 'min-64 max-80';
    sections: [
      'Core Plugins',
      'Module Plugins',
      'Available Plugins'
    ];
  };
  
  // Zone de contenu
  mainContent: {
    header: PluginHeader;
    content: DynamicPluginComponent;
    overflow: 'auto';
  };
}
```

#### 2.3.3 Comportements et Transitions

**États d'Affichage :**
- **`none`** : Bouton flottant d'activation (coins arrondis avec icône 🛠️)
- **`normal`** : Barre horizontale au bas (Laravel Debugbar style)
- **`expanded`** : Card centrée en bas (Nuxt DevTools style)

**Transitions UX :**
- **Click sur plugin (mode réduit)** : Toggle activation/désactivation
- **Click expand** : Transition fluide vers mode card centré
- **Click minimize** : Retour au mode barre horizontale
- **Hotkeys** : Ctrl+Shift+D pour toggle, Escape pour fermer

**Design System :**
- **Mode Réduit** : Inspiration Laravel Debugbar (horizontal tabs, status indicators)
- **Mode Étendu** : Inspiration Nuxt DevTools (floating card, modern design)
- **Cohérence** : Utilisation de shadcn UI components et design tokens
- **Accessibilité** : Support tooltips, keyboard navigation, focus management

Comportement UX clé:
- Production (`NODE_ENV !== 'development'`): Provider retourne `null` (non monté).
- Mode `none`: bouton flottant pour afficher DevTools.
- Mode `normal`: barre latérale (position configurable) avec plugins épinglés.
- Mode `expanded`: panneau central détaillé + sidebar navigation.
- Persistance: localStorage (clé modulable) sérialise position, settings, pinnedPlugins.

Tests UI minimaux (smoke):
1. Provider en dev rend un bouton quand state initial = none.
2. Passage en expanded affiche un container principal et au moins une section Core.
3. Pinned plugin apparaît dans la barre reduced.
4. Event `devtools:expand-plugin` force la sélection.

3. Structure de Répertoires (Baseline)
Copier
project-root/
  package.json
  tsconfig.json
  README.md
  /src
    /core                       # uniquement les plugins core toujours présents
      /[plugin-name]
        /server/*              # fichier et dosier pour le code cote server regrouper par class
        /shared
          contract/*           # fichier definit par scope definissant les contract orpc
        /client
          /components/*       # composant pour le client
          /route.ts           # fichier referencent les differente route et sous route du plugin qui definira la structure dans le sidebar en expanded 
          /hooks/*          # fichiers pouur les custom hook du client
          /[other-directory]  # addictional directory if needed with a react like directory structure
      registry.ts        #fichier regourpant tout les core plugin avec leur description et toute les metadata par plugin
    /modules
      /[plugin-name]
        /server/*              # fichier et dosier pour le code cote server regrouper par class
        /shared
          contract/*           # fichier definit par scope definissant les contract orpc
        /client
          /components/*       # composant pour le client
          /route.ts           # fichier referencent les differente route et sous route du plugin qui definira la structure dans le sidebar en expanded 
          /hooks/*          # fichiers pouur les custom hook du client
          /[other-directory]  # addictional directory if needed with a react like directory structure
        plugin.ts         #fichier exportant le plugin avec les matadata etc
    /runtime
      /devtool
        useDevtool.ts  #fichier hook permettant d'accéder au client ORPC typé via useDevTool<PluginContract>().orpc.[functionToCall]
      /plugins
        usePlugins.ts             #fichier exportant un hook pour être appelé en haut du devTool components pour use the plugins il doit retourner tout le client side des plugin
        getRouterFromPlugins.ts   #fichier exportant une fonction pour être appelé dans le api handler qui doit retourner un orpc server avec le route et le code server
    /utils
      logger.ts
      errors.ts
      env.ts
    /server
      context.ts          (ctx partagé, auth, db, etc.)
    /cli
      scaffoldModule.ts   (génération future)
    /tests
      /unit
      /integration
        router.core.test.ts
        router.modules.test.ts
    main.ts
4. Interfaces & Types (Contract)
4.1 Types Plugin
Copier
// runtime/plugins/pluginTypes.ts
import type { ORPCRouter } from '../../config/orpc';

export interface ModulePlugin {
  kind: 'module';
  name: string;             // ex: 'todo'
  version: string;
  enabled?: boolean;        // défaut: true
  namespace?: string;       // défaut: mod.<name>.
  router?: ORPCRouter;
  exports?: {
    components?: Record<string, () => Promise<any>>;
    hooks?: Record<string, () => Promise<any>>;
  };
  dependencies?: string[];  // noms d'autres plugins
  meta?: Record<string, any>;
}

export interface ResolvedRegistry {
  components: Record<string, () => Promise<any>>;
  hooks: Record<string, () => Promise<any>>;
  plugins: ModulePlugin[];
}

export interface UsePluginsOptions {
  strictDependencies?: boolean; // défaut true
  overrideOnConflict?: boolean; // défaut false
  prefixStrategy?: 'namespace' | 'flat'; // défaut 'namespace'
}
4.2 Router Abstrait
Copier
// config/orpc.ts
export type Procedure = (...args: any[]) => Promise<any>;

export interface ORPCRouter {
  procedures: Record<string, Procedure>;
  merge: (prefix: string, router: ORPCRouter) => ORPCRouter;
  procedure: (name: string, impl: Procedure) => ORPCRouter;
}
5. Fonctions Publiques Principales
usePlugins(pluginList: ModulePlugin[], options?: UsePluginsOptions): ResolvedRegistry

Fusionne l’inventaire UI/hooks des plugins activés.
Valide dépendances si strictDependencies.
getRouterFromPlugins(pluginList: ModulePlugin[]): ORPCRouter

Construit un router global:
merge('', coreRouter)
pour chaque plugin actif avec router: merge(namespace, plugin.router)
callProcedure(router, fullyQualifiedName, ...args)

6. Conventions & Nommage
Élément	Règle
Namespace core	core.<domaine>.
Namespace module	mod.<nom>. (modifiable via plugin.namespace)
Procedures internes	Pas de slash, segmentation par points
Fichiers router partiels	un fichier par ressource (ex: session.ts)
Activation plugin	enabled !== false
Hook export key	PascalCase ou camelCase cohérent (ex: useTodos)
Component export key	PascalCase (ex: TodoList)
7. Exemple Core (Bundle)
Copier
// core/bundle/server/index.ts
import { createRouter } from '../../../config/orpc';

export const bundleCoreRouter = createRouter()
  .procedure('version', async () => ({ commit: 'abc123', buildTime: Date.now() }))
  .procedure('listAssets', async () => ([ 'app.js', 'vendor.js' ]));
8. Agrégation Core Globale
Copier
// core/server/index.ts
import { createRouter } from '../../config/orpc';
import { bundleCoreRouter } from '../bundle/server';
import { routesCoreRouter } from '../routes/server';
import { cliCoreRouter } from '../cli/server';
import { logsCoreRouter } from '../logs/server';

export const coreRouter = createRouter()
  .merge('core.bundle.', bundleCoreRouter)
  .merge('core.routes.', routesCoreRouter)
  .merge('core.cli.', cliCoreRouter)
  .merge('core.logs.', logsCoreRouter);
9. Exemple Module Plugins (Auth + Todo)
Copier
// modules/auth/server/session.ts
import { createRouter } from '../../../config/orpc';

export const authSessionRouter = createRouter()
  .procedure('get', async () => ({ userId: 'u1', roles: ['admin'] }))
  .procedure('invalidate', async () => ({ ok: true }));
Copier
// modules/auth/server/users.ts
import { createRouter } from '../../../config/orpc';

export const authUsersRouter = createRouter()
  .procedure('list', async () => [{ id: 'u1' }, { id: 'u2' }])
  .procedure('detail', async (_ctx: any, id: string) => ({ id }));
Copier
// modules/auth/server/index.ts
import { createRouter } from '../../../config/orpc';
import { authSessionRouter } from './session';
import { authUsersRouter } from './users';

export const authModuleRouter = createRouter()
  .merge('session.', authSessionRouter)
  .merge('users.', authUsersRouter);
Copier
// modules/auth/plugin.ts
import type { ModulePlugin } from '../../runtime/plugins/pluginTypes';
import { authModuleRouter } from './server';

export const authPlugin: ModulePlugin = {
  kind: 'module',
  name: 'auth',
  version: '1.0.0',
  router: authModuleRouter,
  exports: {
    hooks: { useSession: () => import('./hooks/useSession') },
    components: { AuthProvider: () => import('./components/AuthProvider') },
  },
  meta: { category: 'security' },
};
Copier
// modules/todo/server/todos.ts
import { createRouter } from '../../../config/orpc';

export const todosRouter = createRouter()
  .procedure('list', async () => [
    { id: 't1', title: 'Acheter du lait' },
    { id: 't2', title: 'Coder plugin' },
  ])
  .procedure('add', async (_ctx: any, title: string) => ({ id: 't3', title }));
Copier
// modules/todo/server/index.ts
import { createRouter } from '../../config/orpc';
import { todosRouter } from './todos';

export const todoModuleRouter = createRouter()
  .merge('todos.', todosRouter);
Copier
// modules/todo/plugin.ts
import type { ModulePlugin } from '../../runtime/plugins/pluginTypes';
import { todoModuleRouter } from './server';

export const todoPlugin: ModulePlugin = {
  kind: 'module',
  name: 'todo',
  version: '1.0.0',
  router: todoModuleRouter,
  exports: {
    components: {
      TodoList: () => import('./components/TodoList'),
    },
    hooks: {
      useTodos: () => import('./hooks/useTodos'),
    },
  },
  meta: { category: 'productivity' },
};
10. Implémentation des Utilitaires
10.1 usePlugins
Copier
// runtime/plugins/usePlugins.ts
import type {
  ModulePlugin,
  ResolvedRegistry,
  UsePluginsOptions,
} from './pluginTypes';

function namespaceFor(p: ModulePlugin) {
  return p.namespace ?? `mod.${p.name}.`;
}

export function usePlugins(
  plugins: ModulePlugin[],
  options: UsePluginsOptions = {}
): ResolvedRegistry {
  const {
    strictDependencies = true,
    overrideOnConflict = false,
    prefixStrategy = 'namespace',
  } = options;

  const enabled = plugins.filter(p => p.enabled !== false);

  if (strictDependencies) {
    const names = new Set(enabled.map(p => p.name));
    enabled.forEach(p =>
      (p.dependencies ?? []).forEach(dep => {
        if (!names.has(dep)) {
          throw new Error(`Dépendance manquante: ${p.name} -> ${dep}`);
        }
      })
    );
  }

  const components: Record<string, any> = {};
  const hooks: Record<string, any> = {};

  function addAll(
    target: Record<string, any>,
    source: Record<string, any> | undefined,
    prefix: string
  ) {
    if (!source) return;
    Object.entries(source).forEach(([k, loader]) => {
      const finalKey =
        prefixStrategy === 'namespace' ? `${prefix}${k}` : k;
      if (!overrideOnConflict && finalKey in target) {
        throw new Error(`Conflit clé: ${finalKey}`);
      }
      target[finalKey] = loader;
    });
  }

  enabled.forEach(p => {
    const ns = namespaceFor(p);
    addAll(components, p.exports?.components, ns);
    addAll(hooks, p.exports?.hooks, ns);
  });

  return { components, hooks, plugins: enabled };
}
10.2 getRouterFromPlugins
Copier
// runtime/plugins/getRouterFromPlugins.ts
import { createRouter } from '../../config/orpc';
import { coreRouter } from '../../core';
import type { ModulePlugin } from './pluginTypes';

export function getRouterFromPlugins(plugins: ModulePlugin[]) {
  const router = createRouter().merge('', coreRouter);
  plugins
    .filter(p => p.enabled !== false && p.router)
    .forEach(p => {
      const ns = p.namespace ?? `mod.${p.name}.`;
      router.merge(ns, p.router!);
    });
  return router;
}
11. Exemple Main
Copier
// main.ts
import { getRouterFromPlugins } from './runtime/plugins/getRouterFromPlugins';
import { usePlugins } from './runtime/plugins/usePlugins';
import { todoPlugin } from './modules/todo/plugin';
import { authPlugin } from './modules/auth/plugin';

async function start() {
  const plugins = [authPlugin, todoPlugin];
  const registry = usePlugins(plugins);

  console.log('Components:', Object.keys(registry.components));
  console.log('Hooks:', Object.keys(registry.hooks));

  const router = getRouterFromPlugins(plugins);

  // Demonstration: In actual usage, these calls would be made via useDevTool hook in components
  console.log('Router configured with namespaces:', Object.keys(router.procedures));
  console.log('Auth session available at: mod.auth.session.get');
  console.log('Todos available at: mod.todo.todos.list');
  
  // Example of how useDevTool would be used in components:
  // const { orpc } = useDevTool<AuthContract>();
  // const session = await orpc.session.get();
}

start().catch(e => {
  console.error(e);
  process.exit(1);
});
12. Flux de Données
Démarrage: on charge config (env, etc.)
On déclare une liste statique ou dynamique de plugins.
usePlugins construit un registre UI (lazy imports).
getRouterFromPlugins construit l’API unifiée.
Un adaptateur HTTP (non inclus ici) mappe les requêtes entrantes vers callProcedure(router, name, ...args).
13. Non-Fonctionnel
Critère	Détail
Simplicité	Code minimal, pas de dépendances lourdes
Extensibilité	Ajout facile de middleware ou validation
Lazy loading UI	Imports dynamiques pour components/hooks
Isolation	Aucun plugin ne modifie le core
Résilience	Erreurs de dépendances détectées tôt
14. Tests – Cas Minimum
Test	Description
core.bundle.version	useDevTool<BundleContract>().orpc.version() retourne un objet version
plugin.auth.session.get	useDevTool<AuthContract>().orpc.session.get() retourne un objet user
plugin.auth.users.list	useDevTool<AuthContract>().orpc.users.list() retourne un tableau non vide
plugin.todo.activation	Router contient mod.todo.todos.list
plugin.todo.disabled	Si enabled=false, route absente
conflits.namespace	Deux plugins même key => erreur
dépendance manquante	strictDependencies=true -> erreur
prefixStrategy flat	Clés non préfixées correctes
Exemple test:

```typescript
// tests/integration/router.core.test.ts
import { getRouterFromPlugins } from '../../src/runtime/plugins/getRouterFromPlugins';

test('core router setup', async () => {
  const router = getRouterFromPlugins([]);
  expect(router.procedures['core.bundle.version']).toBeDefined();
});

// tests/integration/useDevTool.test.ts  
import { useDevTool } from '../../src/runtime/devtool/useDevTool';
import type { BundleContract } from '../../src/core/bundle/shared/contract';

test('useDevTool provides typed client', async () => {
  const { orpc } = useDevTool<BundleContract>();
  const version = await orpc.version();
  expect(version.commit).toBeDefined();
});
```
15. CLI (Optionnel Futur)
Commande: devtool module:create <name>

Actions:

Créer dossier modules/<name>/
Générer squelette server/index.ts, plugin.ts
Ajouter un test
(Option) Mettre à jour un fichier modules/index.ts agrégateur
16. Middleware & Validation (Extension)
Pattern possible:

Copier
type Middleware = (proc: Procedure) => Procedure;

function withLogging(proc: Procedure): Procedure {
  return async (...args) => {
    const start = Date.now();
    try {
      const res = await proc(...args);
      console.log('OK', { time: Date.now() - start });
      return res;
    } catch (e) {
      console.error('ERR', e);
      throw e;
    }
  };
}
Option validation (ex: Zod) en décorant procedure.

17. Stratégie de Versionnement
Core: versioné via package principal.
Plugins: chaque objet peut avoir version.
Ajout futur: injection d’un service PluginRegistry pour introspection dynamique.
18. Checklist d’Implémentation (Exécution par un LLM)
Créer structure de dossiers (cf. §3).
Implémenter orpc.ts.
Implémenter routers core (bundle/routes/cli/logs) + agrégation coreRouter.
Implémenter pluginTypes.ts.
Implémenter usePlugins.ts.
Implémenter getRouterFromPlugins.ts.
Implémenter Plugin Registry (Zustand) + méthodes CRUD plugin & sélection page.
Implémenter DevToolState (Zustand) avec persistance.
Implémenter UI (Provider, Reduced bar, Expanded panel, ReducedModeDisplay/Menu, Settings modal).
Créer modules exemple (auth, todo, tanstackQuery).
Créer tests integration (core + module) + smoke tests UI.
Ajouter script main.ts démonstration.
Vérifier: node dist/main.js affiche logs attendus.
(Option) Ajouter CLI scaffold.
Rédiger README synthétique.
19. Critères d’Acceptation
L’appel callProcedure(globalRouter, 'core.auth.session.get') renvoie un objet { userId, roles }.
L’ajout de todoPlugin rend accessible 'mod.todo.todos.list'.
La désactivation d’un plugin (enabled:false) retire ses routes & exports.
Conflits de composants en mode namespace impossible (noms distincts).
Tests passent (≥ 90% des cas listés §14).
Aucune dépendance externe autre que TypeScript / Node (sauf dev).
Code structuré et lisible.
Mise à jour (nouveau catalogue):
- L’appel callProcedure(globalRouter, 'core.bundle.version') retourne les métadonnées build.
- L’appel callProcedure(globalRouter, 'mod.auth.session.get') retourne la session utilisateur lorsque authPlugin est présent.
UI & Registry:
- DevToolProvider ne monte rien en production.
- En dev, changement d'état (none -> normal -> expanded) fonctionne.
- Pinned plugin apparaît dans la barre reduced.
- Event d'expansion sélectionne correctement la page ciblée.
20. Roadmap Évolutive
Étape	Description
v1	Base core + plugins + agrégation
v1.1	Validation entrée/sortie (Zod)
v1.2	Génération client TypeScript (introspection)
v1.3	Middleware global (auth, logging)
v1.4	Hot reload des plugins
v1.5	Persistance plugin registry (DB)
v2	Permissions granulaires par procedure
v2.1	Observabilité (traces, metrics)
21. Modèle de Prompt à Donner à un Autre LLM
Copier-coller:

Copier
Tu es chargé d’implémenter un DevTool selon la spécification suivante. Respecte strictement:
- Structure de répertoires
- Interfaces (ModulePlugin, ORPCRouter, etc.)
- Fonctions publiques: usePlugins, getRouterFromPlugins, callProcedure
- Namespacing: core.* et mod.<nom>.*

Livrables:
1. Code TypeScript complet
2. Tests minimalistes (au moins core + module exemple)
3. Script main démonstration
4. Aucun framework externe (pas d’Express, etc.)

Référence Spécification:
[Coller ici tout le document de spécification fourni]

Quand tu as fini, fournis:
- Liste fichiers + extraits clés
- Commandes pour build & run
- Résultats attendus d’exécution
22. Résumé Ultra-Synthétique
Core + Plugins:

Core: router global stable (core.*)
Plugins: objets déclaratifs (router + exports)
usePlugins: fusion UI/hooks
getRouterFromPlugins: agrège core + modules dans un router RPC unifié
useDevTool<PluginContract>(): accès typé aux procédures via .orpc.[functionToCall]()
Si tu veux une version anglaise ou une version "light" README, je peux te la générer ensuite.

Souhaites-tu que je génère maintenant un README prêt à publier ou un script de scaffolding CLI ? Indique-moi la suite.