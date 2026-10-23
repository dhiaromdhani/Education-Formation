# StackUnity — Espace utilisateur React + Flask + SPARQL

Base de départ pour le module **Personne / Organisme**, issue du fichier `formation .ttl` fourni. Interface française, responsive, en consultation publique. Les statistiques, listes, filtres et fiches proviennent réellement de Flask. Aucun compte utilisateur ni connexion fictive.

## Démarrer sous Windows (deux terminaux)

Installer Python 3.10+ et Node.js 20.19+ (ou 22.12+), puis extraire ce dossier.

Terminal 1, depuis `stackunity-starter` :

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

Terminal 2, depuis `stackunity-starter` :

```powershell
cd frontend
npm install
npm run dev
```

Ouvrir **http://127.0.0.1:5173**. Garder les deux terminaux ouverts. Ctrl+C arrête le serveur concerné ; relancer sa dernière commande pour redémarrer. Si 5173 est occupé, libérer ce port : CORS autorise précisément 5173. `.env.example` documente l'URL de l'API ; la valeur par défaut fonctionne sans créer de `.env`.

Linux/macOS : utiliser `python3` et `.venv/bin/python` à la place du chemin Windows.

## Ce qui fonctionne

- Tableau de bord : nombres de classes, individus, personnes et organismes.
- Annuaires des personnes et organismes, recherche par nom/email/ville/secteur.
- Filtre de classe incluant ses descendants.
- Fiches : attributs disponibles, relations sortantes et entrantes.
- États de chargement, erreurs avec nouvelle tentative et résultats vides.
- Liste des sous-classes tirée du fichier, pas de liste métier codée en dur.

Les valeurs absentes sont signalées. Le nom est la propriété `edu:nom` ; pas de propriété `prenom` inventée. Les relations affichées sont des données de consultation ; les entités des autres modules n'ont pas encore d'écran dédié.

## Architecture

React → HTTP/JSON → Flask → requêtes SPARQL via RDFLib → graphe RDF chargé depuis `backend/data/formation.ttl`.

**Protégé est un éditeur d'ontologies, pas un serveur de base de données.** Pour cette première version, le fichier est le stockage source et RDFLib charge un graphe en mémoire. Modifier la copie `.ttl` dans Protégé, sauvegarder, puis redémarrer Flask pour recharger. Ne pas attendre de synchronisation instantanée. Aucun raisonneur OWL n'est exécuté : `rdfs:subClassOf*` parcourt la hiérarchie déclarée mais n'effectue pas un raisonnement OWL complet.

Pour un futur stockage partagé avec SPARQL Update et plusieurs rédacteurs, prévoir Apache Jena Fuseki (ou un autre triplestore) derrière Flask. Cette version ne fournit ni écriture CRUD, ni authentification, ni API de requêtes SPARQL arbitraires. `Administrateur`, `Apprenant`, etc. sont des classes métier OWL et ne constituent pas des permissions applicatives. Ajouter une authentification et des contrôles d'accès avant toute gestion de comptes ou écriture.

## Organisation des fichiers

- `backend/app.py` : API Flask, sélection par SPARQL, détails RDF.
- `backend/data/formation.ttl` : copie complète et inchangée du fichier fourni.
- `frontend/src/main.jsx` : interface React fonctionnelle.
- `frontend/src/style.css` : design vert sauge, cartes et navigation responsive.
- `docs/ANALYSE_ONTOLOGIE.md` : inventaire complet et points à discuter.
- `docs/requetes.sparql` : requêtes à essayer dans un outil SPARQL.
- `backend/test_api.py` : contrôles sur le fichier et les endpoints.

Les polices Google sont facultatives : Arial prend le relais hors connexion.

## API

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/api/health` | État du graphe |
| GET | `/api/stats` | Statistiques |
| GET | `/api/schema` | Classes Personne et Organisme |
| GET | `/api/personnes?q=amira&type=Apprenant` | Recherche et filtre |
| GET | `/api/personnes/Amira` | Attributs et relations |
| GET | `/api/organismes?type=Entreprise` | Organismes filtrés |
| GET | `/api/organismes/StackUnityTunisie` | Fiche organisme |

Les routes de liste utilisent SPARQL ; la recherche textuelle et les filtres complémentaires s'appliquent en Python sur le résultat. Les détails parcourent les triplets avec l'API RDFLib. Les paramètres utilisateur ne sont pas interpolés dans des chaînes SPARQL.

## Vérifier

```powershell
cd backend
.\.venv\Scripts\python.exe -m unittest -v test_api
```

```powershell
cd frontend
npm run build
```

## Répartition proposée des cinq membres

Le fichier a **10 classes racines déclarées**, mais 187 classes au total. La répartition ci-dessous est une proposition suivant les racines, pas une répartition imposée par l'ontologie. Les volumes sont très inégaux ; rééquilibrer les fonctionnalités avec le groupe.

| Membre | Deux classes racines | Fonctionnalités possibles |
| --- | --- | --- |
| Mohamed Dhia | Personne + Organisme | Annuaires, profils, organismes |
| Membre 2 | Domaine + Matiere | Domaines, compétences, matières |
| Membre 3 | Espace + Inscription | Espaces, inscriptions, liens académiques |
| Membre 4 | Club + ServiceVieEtudiante | Clubs, événements, vie étudiante |
| Membre 5 | Bourse + ServiceMedical | Bourses et services médicaux |

Plusieurs concepts sont rangés sous des racines surprenantes dans le fichier, notamment Formation sous Diplome. Valider la hiérarchie ensemble avant de répartir définitivement les écrans. Chaque membre pourra isoler son module dans un Blueprint Flask et des composants React ; conserver le même namespace et les URI communes. Le module actuel utilise une factory `create_app` pour faciliter cette évolution. Éviter de remplacer individuellement le fichier partagé par cinq copies divergentes.
