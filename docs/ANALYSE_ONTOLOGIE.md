# Analyse du fichier fourni

Namespace : `http://stackunity.org/education#`.

2951 triplets ; 187 classes OWL ; 186 individus nommés ; 82 propriétés objet ; 52 propriétés de données.

Le fichier original est conservé sans modification. Inventaire des déclarations, sans raisonneur OWL.

## Points à valider avec le groupe

- `Stage rdfs:subClassOf Organisme` : un stage devient un organisme par héritage. Proposition à discuter : séparer Stage comme concept autonome et conserver `accueilliPar` vers Organisme.
- `Formation rdfs:subClassOf Diplome` : une formation et un diplôme représentent habituellement deux concepts différents. La relation `prepareDiplome` existe déjà.
- `Competence rdfs:subClassOf Domaine` : vérifier si vous souhaitez réellement faire de chaque compétence un domaine, plutôt que relier les deux.
- `nom` est défini sans domaine : son usage commun sur plusieurs familles est possible.
- Les informations manquantes ne constituent pas à elles seules une incohérence OWL (monde ouvert). Les champs requis d’un formulaire sont des règles applicatives à définir.
- Ne pas ajouter `email` sur Organisme sans revoir le modèle : le domaine actuel de `email` est Personne ; un raisonneur pourrait inférer qu’un organisme utilisant cette propriété est une personne.
- Cette analyse structurelle ne certifie pas la cohérence logique : lancer HermiT dans Protégé pour examiner restrictions, disjonctions et inférences.

## Personne

16 sous-classes transitives.

| Classe | Parent déclaré |
| --- | --- |
| Administrateur | Personne |
| AncienApprenant | Apprenant |
| Apprenant | Personne |
| ChargeDeCours | Enseignant |
| Enseignant | Personne |
| Etudiant | Apprenant |
| Infirmier | PersonnelMedical |
| Medecin | PersonnelMedical |
| Personne | Racine |
| PersonnelMedical | Personne |
| Professeur | Enseignant |
| Psychologue | PersonnelMedical |
| ResponsableClub | Personne |
| Stagiaire | Apprenant |
| Tuteur | Personne |
| TuteurEntreprise | Personne |
| Vacataire | Enseignant |

22 individus correspondants : Ahmed, Amira, Anis, Bilel, DrAmel, DrSonia, DrYoussef, Firas, Hatem, Ines, InfirmierRami, Karim, KineYassine, Leila, Mehdi, Nour, PsychologueMariem, Rim, Salma, Sami, Walid, Yasmine.

### Propriétés liées (héritage et relations entrantes inclus)

| Propriété | Nature | Domaine | Portée |
| --- | --- | --- | --- |
| aMembre | Objet | Club | Apprenant |
| animePar | Objet | Seance | Enseignant |
| appartientADepartement | Objet | Enseignant | Departement |
| assureParPersonnel | Objet | ServiceMedical | PersonnelMedical |
| beneficieDeBourse | Objet | Apprenant | Bourse |
| beneficieDuService | Objet | Apprenant | ServiceMedical |
| certificatPour | Objet | CertificatMedical | Apprenant |
| consultePar | Objet | SoutienPsychologique | Psychologue |
| dateNaissance | Donnée | Personne | date |
| delivreCertificat | Objet | PersonnelMedical | CertificatMedical |
| dirigeDepartement | Objet | Enseignant | Departement |
| dirigePar | Objet | Club | ResponsableClub |
| effectueStage | Objet | Apprenant | Stage |
| email | Donnée | Personne | string |
| encadreAcademique | Objet | Stage | Enseignant |
| encadrePar | Objet | Club | Enseignant |
| enseigne | Objet | Enseignant | Formation |
| enseigneMatiere | Objet | Enseignant | Matiere |
| estEffectuePar | Objet | Stage | Apprenant |
| estMembreDe | Objet | Apprenant | Club |
| estOuvertA | Objet | ServiceMedical | Personne |
| inscriptionDe | Objet | Inscription | Apprenant |
| inscritA | Objet | Apprenant | Formation |
| moyenneGenerale | Donnée | Apprenant | decimal |
| niveauDeLangue | Objet | Apprenant | NiveauLangue |
| niveauMaitrise | Donnée | Personne | integer |
| obtientCertification | Objet | Apprenant | Certification |
| obtientDiplome | Objet | Apprenant | Diplome |
| parleLangue | Objet | Personne | Langue |
| participeA | Objet | Apprenant | Seance |
| passeEvaluation | Objet | Apprenant | Evaluation |
| possedeCompetence | Objet | Personne | Competence |
| recommandeParcours | Objet | ParcoursApprentissage | Apprenant |
| specialiteMedicale | Donnée | PersonnelMedical | string |
| suitFormationAlternance | Objet | Apprenant | FormationEnAlternance |
| suitParcours | Objet | Apprenant | ParcoursApprentissage |
| superviseParTuteur | Objet | Stage | TuteurEntreprise |
| telephone | Donnée | Personne | string |
| tutore | Objet | Tuteur | Apprenant |

Ajouter aussi `nom` (xsd:string, sans domaine) et `rdfs:label` pour l’affichage.

## Organisme

16 sous-classes transitives.

| Classe | Parent déclaré |
| --- | --- |
| ConventionBilaterale | StageConvention |
| ConventionCadre | StageConvention |
| ConventionTripartite | StageConvention |
| Entreprise | Organisme |
| Laboratoire | Organisme |
| Organisme | Racine |
| Stage | Organisme |
| StageConvention | Stage |
| StageDoctorat | StageRecherche |
| StageEntreprise | Stage |
| StageInitiation | StageEntreprise |
| StageLaboratoire | StageRecherche |
| StageMasterRecherche | StageRecherche |
| StageObservation | StageEntreprise |
| StagePFE | StageEntreprise |
| StageRecherche | Stage |
| Universite | Organisme |

15 individus correspondants : ConventionBilateraleIA, ConventionCadreUniversite, ConventionStackUnity, LaboratoireIA, StackUnityTunisie, StageDoctoratIA, StageEteAnalyse, StageInitiationData, StageLabIA, StageMasterOntologies, StageObservationLycee, StagePFEMobile, StagePFEWeb, TechSolutions, UniversiteDeTunis.

### Propriétés liées (héritage et relations entrantes inclus)

| Propriété | Nature | Domaine | Portée |
| --- | --- | --- | --- |
| accueilliPar | Objet | Stage | Organisme |
| delivreCertificationStage | Objet | Stage | Certification |
| delivrePar | Objet | Diplome | Organisme |
| developpeCompetenceStage | Objet | Stage | Competence |
| dureeSemaines | Donnée | Stage | integer |
| effectueStage | Objet | Apprenant | Stage |
| encadreAcademique | Objet | Stage | Enseignant |
| estEffectuePar | Objet | Stage | Apprenant |
| estRemunere | Donnée | Stage | boolean |
| estSitueDans | Objet | Espace | Organisme |
| evalueParRapport | Objet | Stage | RapportDeStage |
| financePar | Objet | Bourse | Organisme |
| gratification | Donnée | Stage | decimal |
| heberge | Objet | Club | Organisme |
| numeroConvention | Donnée | Stage | string |
| partieDe | Objet | Departement | Organisme |
| secteurActivite | Donnée | Organisme | string |
| serviceRattacheA | Objet | ServiceMedical | Organisme |
| stageDansDomaine | Objet | Stage | Domaine |
| stageNecessiteCertificat | Objet | Stage | CertificatMedical |
| sujet | Donnée | Stage | string |
| superviseParTuteur | Objet | Stage | TuteurEntreprise |
| valideFormation | Objet | Stage | Formation |
| ville | Donnée | Organisme | string |

Ajouter aussi `nom` (xsd:string, sans domaine) et `rdfs:label` pour l’affichage.

## Inventaire complet des classes

| Classe | Parent(s) |
| --- | --- |
| AbonnementTransport | ServiceTransport |
| AccompagnementEmploi | ServiceOrientationEmploi |
| Administrateur | Personne |
| Amphitheatre | Espace |
| AncienApprenant | Apprenant |
| AnneeUniversitaire | PeriodeAcademique |
| ApplicationMobile | OutilNumerique |
| Apprenant | Personne |
| Atelier | Formation |
| AtelierGestionStress | SoutienPsychologique |
| AttestationParticipation | Certification |
| Basketball | ClubSport |
| Bootcamp | Formation |
| Bourse | Racine |
| BourseMerite | Bourse |
| BourseMobilite | Bourse |
| BourseSociale | Bourse |
| Cafeteria | ServiceRestauration |
| CampagneDepistage | PreventionSante |
| CampagneSante | Evenement |
| CertificatAbsence | CertificatMedical |
| CertificatAptitudeSport | CertificatMedical |
| CertificatAptitudeStage | CertificatMedical |
| CertificatMedical | ServiceMedical |
| Certification | Domaine |
| CertificationAcademique | Certification |
| CertificationProfessionnelle | Certification |
| ChargeDeCours | Enseignant |
| Chorale | ClubMusique |
| Club | Racine |
| ClubEnvironnement | ClubHumanitaire |
| ClubHumanitaire | Club |
| ClubIntelligenceArtificielle | ClubTechnologie |
| ClubMusique | Club |
| ClubProgrammation | ClubTechnologie |
| ClubRobotique | ClubTechnologie |
| ClubSecourisme | ClubHumanitaire |
| ClubSolidarite | ClubHumanitaire |
| ClubSport | Club, n10a17118754f4a97b8b63b821e3aed48b1 |
| ClubTechnologie | Club |
| ClubTheatre | Club |
| Competence | Domaine |
| CompetenceArtistique | Competence |
| CompetenceSportive | Competence |
| CompetenceTechnique | Competence |
| CompetenceTransversale | Competence |
| Concert | Evenement |
| ConsultationDentaire | ConsultationMedicale |
| ConsultationGenerale | ConsultationMedicale |
| ConsultationMedicale | ServiceMedical |
| ConsultationOphtalmologique | ConsultationMedicale |
| ConventionBilaterale | StageConvention |
| ConventionCadre | StageConvention |
| ConventionTripartite | StageConvention |
| Cours | Formation |
| CovoiturageEtudiant | ServiceTransport |
| Departement | Espace |
| DepartementGestion | Departement |
| DepartementInformatique | Departement |
| DepartementLangues | Departement |
| Diplome | Domaine |
| DiplomeIngenieur | Diplome |
| Document | RessourcePedagogique |
| Domaine | Racine |
| DomaineArtsCulture | Domaine |
| DomaineSport | Domaine |
| DomaineTechnologie | Domaine |
| EducationSante | PreventionSante |
| Enseignant | Personne |
| Entreprise | Organisme |
| EntretienPsychologique | SoutienPsychologique |
| Espace | Racine |
| Etudiant | Apprenant |
| Evaluation | Matiere |
| Evenement | Club |
| Examen | Evaluation |
| Exercice | RessourcePedagogique |
| Football | ClubSport |
| Formation | Diplome |
| FormationEnAlternance | Formation |
| ForumEmploi | ServiceOrientationEmploi |
| GroupeDeParole | SoutienPsychologique |
| GroupeMusiqueModerne | ClubMusique |
| HebergementUrgence | ServiceHebergement |
| Infirmerie | Espace |
| Infirmier | PersonnelMedical |
| Inscription | Racine |
| InscriptionAdministrative | Inscription |
| InscriptionClub | Inscription |
| InscriptionPedagogique | Inscription |
| Kinesitherapie | SanteSportive |
| Laboratoire | Organisme |
| Langue | Formation |
| LangueDesSignes | Langue |
| LangueEtrangere | Langue |
| LangueNationale | Langue |
| Licence | Diplome |
| Livre | RessourcePedagogique |
| LogementPartage | ServiceHebergement |
| LogicielDeveloppement | OutilNumerique |
| Master | Diplome |
| Masterclass | Formation |
| Matiere | Racine |
| MatiereLitteraire | Matiere |
| MatiereScientifique | Matiere |
| MatiereTechnique | Matiere |
| Medecin | PersonnelMedical |
| Module | Formation |
| Natation | ClubSport |
| NavetteUniversitaire | ServiceTransport |
| Niveau | Diplome |
| NiveauAcademique | Niveau |
| NiveauCompetence | Niveau |
| NiveauLangue | Niveau |
| Orchestre | ClubMusique |
| Organisme | Racine |
| OrientationAcademique | ServiceOrientationEmploi |
| OutilNumerique | Matiere |
| PanierSolidaire | ServiceRestauration |
| ParcoursApprentissage | Domaine |
| ParcoursContinu | ParcoursApprentissage |
| ParcoursInitial | ParcoursApprentissage |
| ParcoursPersonnalise | ParcoursApprentissage |
| PeriodeAcademique | Diplome |
| Personne | Racine |
| PersonnelMedical | Personne |
| PlateformeELearning | OutilNumerique |
| Podcast | RessourcePedagogique |
| PosteDeSecours | PremiersSecoursMedicaux |
| PremiersSecoursMedicaux | ServiceMedical |
| PremiersSoins | PremiersSecoursMedicaux |
| PreventionSante | ServiceMedical |
| Professeur | Enseignant |
| Programme | Formation |
| Projet | Evaluation |
| Psychologue | PersonnelMedical |
| Quiz | Evaluation |
| RapportDeStage | Evaluation |
| ResidenceUniversitaire | ServiceHebergement |
| ResponsableClub | Personne |
| RessourcePedagogique | Matiere |
| RestaurantUniversitaire | ServiceRestauration |
| SalleDeCours | Espace |
| SalleInformatique | Espace |
| SanteSportive | ServiceMedical |
| Seance | Matiere |
| SeanceDeCours | Seance |
| SeanceDeTD | Seance |
| SeanceDeTP | Seance |
| Semestre | PeriodeAcademique |
| ServiceHebergement | ServiceVieEtudiante |
| ServiceMedical | Racine |
| ServiceOrientationEmploi | ServiceVieEtudiante |
| ServiceRestauration | ServiceVieEtudiante |
| ServiceTransport | ServiceVieEtudiante |
| ServiceVieEtudiante | Racine |
| SessionExamens | PeriodeAcademique |
| Soutenance | Evaluation |
| SoutienPsychologique | ServiceMedical, n10a17118754f4a97b8b63b821e3aed48b2 |
| Spectacle | Evenement |
| Stage | Organisme |
| StageConvention | Stage |
| StageDoctorat | StageRecherche |
| StageEntreprise | Stage |
| StageInitiation | StageEntreprise |
| StageLaboratoire | StageRecherche |
| StageMasterRecherche | StageRecherche |
| StageObservation | StageEntreprise |
| StagePFE | StageEntreprise |
| StageRecherche | Stage |
| Stagiaire | Apprenant |
| SuiviSportif | SanteSportive |
| TheatreComedie | ClubTheatre |
| TheatreDrame | ClubTheatre |
| TheatreImprovisation | ClubTheatre |
| Tournoi | Evenement |
| TransportMedical | PremiersSecoursMedicaux |
| TravailPratique | Evaluation |
| Tuteur | Personne |
| TuteurEntreprise | Personne |
| Universite | Organisme |
| Vacataire | Enseignant |
| Vaccination | PreventionSante |
| Video | RessourcePedagogique |
| VisiteAptitudeSport | SanteSportive, n10a17118754f4a97b8b63b821e3aed48b3 |
| Webformation | Formation |
| Webinaire | RessourcePedagogique |