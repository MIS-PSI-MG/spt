// Optimized CheckList Structure - Complete with ALL Departments including M&E
const checkList = [
  {
    id: "01",
    departement: "DPAL",
    niveau: 6,
    title: "Site Communautaire",
    maxScore: 37,
    metadata: {
      version: "1.0",
      lastUpdated: "2024-01-01",
      category: "health_assessment",
    },
    sections: [
      {
        id: "section_01_01",
        title: "Ressources humaines",
        maxScore: 11,
        weight: 1.0,
        subsections: [
          {
            id: "subsection_01_01_01",
            title: "Le Site communautaire dispose-t-elle d'un :",
            maxScore: 11,
            questions: [
              {
                id: "rh_001",
                text: "Agent communautaire formé aux protocoles de prise en charge du paludisme",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "rh_002",
                text: "AC formé en test de diagnostic rapide du paludisme",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "rh_003",
                text: "AC formé sur la communication dans la lutte contre paludisme",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "rh_004",
                text: "Est-ce que l'AC est en possession des documents cadres",
                type: "composite",
                maxScore: 3,
                weight: 1.0,
                required: true,
                subQuestions: [
                  {
                    id: "rh_004_a",
                    text: "Ordonnogramme PEC",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                  },
                  {
                    id: "rh_004_b",
                    text: "Job Aids",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                  },
                  {
                    id: "rh_004_c",
                    text: "Affiches",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                  },
                ],
              },
              {
                id: "rh_005",
                text: "Est-ce que l'AC est doté de matériels",
                type: "composite",
                maxScore: 3,
                weight: 1.0,
                required: true,
                subQuestions: [
                  {
                    id: "rh_005_a",
                    text: "Tablette",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                  },
                  {
                    id: "rh_005_b",
                    text: "Connexion internet",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                  },
                  {
                    id: "rh_005_c",
                    text: "Crédit de communication",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                  },
                ],
              },
              {
                id: "rh_006",
                text: "Est-ce que l'AC est encadré et supervisé par le Chef CSB et/ou AC relais",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "rh_007",
                text: "Est-ce que l'AC participe à la revue mensuelle au niveau CSB",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "rh_008",
                text: "Est-ce que l'AC relais fait des supervisions des AC",
                type: "composite",
                maxScore: 2,
                weight: 1.0,
                required: true,
                subQuestions: [
                  {
                    id: "rh_008_a",
                    text: "Planning de supervision",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                  },
                  {
                    id: "rh_008_b",
                    text: "Rapport de supervision",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "section_01_02",
        title: "Prévention",
        maxScore: 26,
        weight: 1.0,
        subsections: [
          {
            id: "subsection_01_02_01",
            title: "Utilisation MII",
            maxScore: 9,
            categories: [
              {
                id: "category_01_02_01_01",
                name: "Accès et réception",
                maxScore: 3,
                questions: [
                  {
                    id: "mii_001",
                    text: "Avez-vous reçu des MII lors de la dernière distribution (campagne, routine ou urgence) ? Si oui, combien de MII?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                    validation: {
                      type: "required",
                    },
                  },
                  {
                    id: "mii_002",
                    text: "Les MII que vous avez reçues ont-elles été distribuées gratuitement ? Si non, combien avez-vous payé ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                    validation: {
                      type: "required",
                    },
                  },
                  {
                    id: "mii_003",
                    text: "Utilisez-vous régulièrement votre MII pour dormir la nuit?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                    validation: {
                      type: "required",
                    },
                  },
                ],
              },
              {
                id: "category_01_02_01_02",
                name: "Qualité et utilisation",
                maxScore: 1,
                questions: [
                  {
                    id: "mii_004",
                    text: "Votre moustiquaire est-elle actuellement en bon état (pas de trou, propre, bien suspendue) ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                    validation: {
                      type: "required",
                    },
                  },
                ],
              },
              {
                id: "category_01_02_01_03",
                name: "Sensibilisation et information",
                maxScore: 3,
                questions: [
                  {
                    id: "mii_005",
                    text: "Lors de la distribution, les agents communautaires vous ont-ils expliqué comment entretenir la MII ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                    validation: {
                      type: "required",
                    },
                  },
                  {
                    id: "mii_006",
                    text: "Avez-vous été informé par un agent communautaire sur la première utilisation des MII (ex. : aération avant usage) ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                    validation: {
                      type: "required",
                    },
                  },
                  {
                    id: "mii_007",
                    text: "Avez-vous reçu des informations sur l'entretien des MII (lavage, séchage, etc.) ? Si oui, par qui ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                    validation: {
                      type: "required",
                    },
                  },
                ],
              },
              {
                id: "category_01_02_01_04",
                name: "Observations communautaires",
                maxScore: 2,
                questions: [
                  {
                    id: "mii_008",
                    text: "Avez-vous observé des problèmes lors de la distribution ou dans l'utilisation des MII dans votre communauté ? Si oui, précisez",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                    validation: {
                      type: "required",
                    },
                  },
                  {
                    id: "mii_009",
                    text: "Les membres de votre communauté utilisent-ils correctement les MII selon vous ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                    validation: {
                      type: "required",
                    },
                  },
                ],
              },
            ],
          },
          {
            id: "subsection_01_02_02",
            title: "Application GIV",
            maxScore: 3,
            questions: [
              {
                id: "giv_001",
                text: "L'AC effectue-t-il des activités de sensibilisation au niveau de sa localité sur la nécessité de réalisation périodique du GIV",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "giv_002",
                text: "L'AS est-il en mesure d'expliquer à la communauté ce qu'est la GIV et quels sont les activités à réaliser au cours de la GIV",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "giv_003",
                text: "L'ASC est-il en mesure de convaincre sa communauté de réaliser la GIV de façon périodique",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
            ],
          },
          {
            id: "subsection_01_02_03",
            title: "Pulvérisation intra-domicilaire",
            maxScore: 14,
            categories: [
              {
                id: "category_01_02_03_01",
                name: "Agents pulvérisateurs",
                maxScore: 3,
                questions: [
                  {
                    id: "pul_001",
                    text: "Avez-vous reçu une formation ? Si oui, sur quoi ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                    validation: {
                      type: "required",
                    },
                  },
                  {
                    id: "pul_002",
                    text: "Combien de maisons pulvérisez-vous par jour en moyenne ?",
                    type: "number",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                    validation: {
                      type: "required",
                      minValue: 0,
                    },
                  },
                  {
                    id: "pul_003",
                    text: "Rencontrez-vous des difficultés spécifiques ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                    validation: {
                      type: "required",
                    },
                  },
                ],
              },
              {
                id: "category_01_02_03_02",
                name: "Ménages",
                maxScore: 11,
                questions: [
                  {
                    id: "pul_004",
                    text: "Votre maison a-t-elle été pulvérisée lors de la dernière campagne ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                  },
                  {
                    id: "pul_005",
                    text: "Si oui, êtes-vous satisfait du travail des agents pulvérisateurs ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                  },
                  {
                    id: "pul_006",
                    text: "Avez-vous été informé à l'avance de la pulvérisation ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                  },
                  {
                    id: "pul_007",
                    text: "Les agents ont-ils respecté les consignes de sécurité ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                  },
                  {
                    id: "pul_008",
                    text: "Avez-vous constaté une diminution des moustiques après la pulvérisation ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                  },
                  {
                    id: "pul_009",
                    text: "Y a-t-il eu des effets secondaires suite à la pulvérisation ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                  },
                  {
                    id: "pul_010",
                    text: "Accepteriez-vous une nouvelle pulvérisation ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                  },
                  {
                    id: "pul_011",
                    text: "Avez-vous des suggestions pour améliorer les campagnes de pulvérisation ?",
                    type: "text",
                    maxScore: 1,
                    weight: 1.0,
                    required: false,
                  },
                  {
                    id: "pul_012",
                    text: "La pulvérisation a-t-elle été faite dans toutes les pièces de votre maison ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                  },
                  {
                    id: "pul_013",
                    text: "Les agents ont-ils pris le temps de bien expliquer le processus ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                  },
                  {
                    id: "pul_014",
                    text: "Avez-vous reçu des conseils sur les précautions à prendre après la pulvérisation ?",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                    required: true,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "02",
    departement: "DPAL",
    niveau: 21,
    title: "Centre de Santé de Base",
    maxScore: 24,
    metadata: {
      version: "1.0",
      lastUpdated: "2024-01-01",
      category: "health_facility_assessment",
    },
    sections: [
      {
        id: "section_02_01",
        title: "Ressources humaines",
        maxScore: 6,
        weight: 1.0,
        subsections: [
          {
            id: "subsection_02_01_01",
            title: "Le CSB dispose-t-il d'un :",
            maxScore: 6,
            questions: [
              {
                id: "csb_rh_001",
                text: "Médecin",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_rh_002",
                text: "Infirmier",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_rh_003",
                text: "Sage-femme",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_rh_004",
                text: "Agent technique de santé",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_rh_005",
                text: "Agent communautaire",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_rh_006",
                text: "Personnel administratif",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
            ],
          },
        ],
      },
      {
        id: "section_02_02",
        title: "Infrastructure et équipements",
        maxScore: 18,
        weight: 1.0,
        subsections: [
          {
            id: "subsection_02_02_01",
            title: "Le CSB dispose-t-il de :",
            maxScore: 18,
            questions: [
              {
                id: "csb_infra_001",
                text: "Salle de consultation",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_002",
                text: "Salle d'accouchement",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_003",
                text: "Pharmacie",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_004",
                text: "Laboratoire",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_005",
                text: "Salle d'hospitalisation",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_006",
                text: "Bureau administratif",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_007",
                text: "Salle d'attente",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_008",
                text: "Toilettes fonctionnelles",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_009",
                text: "Point d'eau potable",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_010",
                text: "Électricité",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_011",
                text: "Groupe électrogène de secours",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: false,
              },
              {
                id: "csb_infra_012",
                text: "Réfrigérateur pour vaccins",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_013",
                text: "Équipements de consultation",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_014",
                text: "Balance pour adultes",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_015",
                text: "Balance pour enfants",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_016",
                text: "Toise",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_017",
                text: "Tensiomètre",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
              {
                id: "csb_infra_018",
                text: "Thermomètre",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "03",
    departement: "M&E",
    niveau: 51,
    title: "Monitoring & Evaluation",
    maxScore: 24,
    metadata: {
      version: "1.0",
      lastUpdated: "2024-01-01",
      category: "monitoring_evaluation",
    },
    sections: [
      {
        id: "section_03_01",
        title: "Ressources humaines",
        maxScore: 6,
        weight: 1.0,
        subsections: [
          {
            id: "subsection_03_01_01",
            title:
              "La formation sanitaire dispose-t-elle d'une personne chargée de :",
            maxScore: 6,
            questions: [
              {
                id: "me_rh_001",
                text: "L'agrégation des données dans un rapport",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_rh_002",
                text: "La collecte des données",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_rh_003",
                text: "La révision des données rapportées et du contrôle de la qualité des données",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_rh_004",
                text: "L'analyse des données (graphiques et tableaux)",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_rh_005",
                text: "L'archivage des outils de collecte et des rapports",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_rh_006",
                text: "La transmission des rapports",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_rh_007",
                text: "La vérification des données communautaires",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
            ],
          },
        ],
      },
      {
        id: "section_03_02",
        title: "Disponibilité des outils de gestion",
        maxScore: 6,
        weight: 1.0,
        subsections: [
          {
            id: "subsection_03_02_01",
            title: "La FS dispose-t-elle au moment de la visite:",
            maxScore: 6,
            questions: [
              {
                id: "me_tools_001",
                text: "Tous les outils de collecte",
                type: "composite",
                maxScore: 2,
                weight: 1.0,
                required: true,
                subQuestions: [
                  {
                    id: "me_tools_001_a",
                    text: "Registre CE",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                  },
                  {
                    id: "me_tools_001_b",
                    text: "Fiche de stock standard en intrants de santé",
                    type: "boolean",
                    maxScore: 0.5,
                    weight: 1.0,
                  },
                  {
                    id: "me_tools_001_c",
                    text: "Registre CPN",
                    type: "boolean",
                    maxScore: 0.5,
                    weight: 1.0,
                  },
                ],
              },
              {
                id: "me_tools_002",
                text: "Archivage des rapports mensuels d'activité CSB des 3 derniers mois",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_tools_003",
                text: "Archivage des rapports mensuels d'activité Communautaire des 3 derniers mois",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_tools_004",
                text: "Accusé/cahier de réception des outils de collecte et de rapportage de données",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
            ],
          },
        ],
      },
      {
        id: "section_03_03",
        title: "Rupture des Outils de Collecte et de Rapportage",
        maxScore: 6,
        weight: 1.0,
        subsections: [
          {
            id: "subsection_03_03_01",
            title:
              "La FS a-t-elle connue une rupture des registres pendant les périodes objets de la mission spotcheck",
            maxScore: 6,
            questions: [
              {
                id: "me_rupture_001",
                text: "Registre CE",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_rupture_002",
                text: "Registre CPN",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_rupture_003",
                text: "Registre CPoN",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_rupture_004",
                text: "Registre SNE",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_rupture_005",
                text: "Registre de vaccination",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_rupture_006",
                text: "Fiche de pointage enfant",
                type: "composite",
                maxScore: 3,
                weight: 1.0,
                required: true,
                subQuestions: [
                  {
                    id: "me_rupture_006_a",
                    text: "Registre PF",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                  },
                  {
                    id: "me_rupture_006_b",
                    text: "RUMER",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                  },
                  {
                    id: "me_rupture_006_c",
                    text: "Livre de banque et livre de caisse FANOME et Fonds d'équité",
                    type: "boolean",
                    maxScore: 1,
                    weight: 1.0,
                  },
                ],
              },
              {
                id: "me_rupture_007",
                text: "Fiche de stock standard en intrants de santé",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
              {
                id: "me_rupture_008",
                text: "Calendriers de la semaine épidémiologique",
                type: "boolean",
                maxScore: 1,
                weight: 1.0,
                required: true,
                validation: {
                  type: "required",
                },
              },
            ],
          },
        ],
      },
      {
        id: "section_03_04",
        title: "Revue de l'exactitude des données rapportées par la FS",
        maxScore: 6,
        weight: 1.0,
        subsections: [
          {
            id: "subsection_03_04_01",
            title: "Liste de contrôle de l'Exactitude des Données",
            maxScore: 6,
            instruction:
              "Sélectionner au hasard des indicateurs à partir du formulaire de la base de données CSB",
            questions: [
              {
                id: "me_data_001",
                text: "Nombre cas de fièvre toutes causes",
                type: "data_validation_matrix",
                maxScore: 3,
                weight: 1.0,
                required: true,
                validation: {
                  type: "matrix_validation",
                  months: 3,
                  elements: [
                    {
                      id: "rma_count",
                      name: "Nombre dans l'outils de rapportage (RMA)",
                      type: "number",
                      required: true,
                    },
                    {
                      id: "recount",
                      name: "Nombre recompté dans les outils de collecte de données",
                      type: "number",
                      required: true,
                    },
                    {
                      id: "ratio",
                      name: "Taux de rapportage : Rapport ou Base de données (2)/Recompte (3)",
                      type: "calculated_number",
                      formula: "rma_count / recount",
                      required: true,
                    },
                    {
                      id: "concordance",
                      name: "Y a-t-il concordance entre colonne (2) et colonne (3)",
                      type: "boolean",
                      maxScore: 1,
                      required: true,
                    },
                  ],
                },
                monthlyData: [
                  {
                    id: "me_data_001_m1",
                    month: "Mois 1",
                    parentId: "me_data_001",
                  },
                  {
                    id: "me_data_001_m2",
                    month: "Mois 2",
                    parentId: "me_data_001",
                  },
                  {
                    id: "me_data_001_m3",
                    month: "Mois 3",
                    parentId: "me_data_001",
                  },
                ],
              },
              {
                id: "me_data_002",
                text: "Nombre total de cas de fièvre testé par RDT",
                type: "data_validation_matrix",
                maxScore: 3,
                weight: 1.0,
                required: true,
                validation: {
                  type: "matrix_validation",
                  months: 3,
                  elements: [
                    {
                      id: "rma_count",
                      name: "Nombre dans l'outils de rapportage (RMA)",
                      type: "number",
                      required: true,
                    },
                    {
                      id: "recount",
                      name: "Nombre recompté dans les outils de collecte de données",
                      type: "number",
                      required: true,
                    },
                    {
                      id: "ratio",
                      name: "Taux de rapportage : Rapport ou Base de données (2)/Recompte (3)",
                      type: "calculated_number",
                      formula: "rma_count / recount",
                      required: true,
                    },
                    {
                      id: "concordance",
                      name: "Y a-t-il concordance entre colonne (2) et colonne (3)",
                      type: "boolean",
                      maxScore: 1,
                      required: true,
                    },
                  ],
                },
                monthlyData: [
                  {
                    id: "me_data_002_m1",
                    month: "Mois 1",
                    parentId: "me_data_002",
                  },
                  {
                    id: "me_data_002_m2",
                    month: "Mois 2",
                    parentId: "me_data_002",
                  },
                  {
                    id: "me_data_002_m3",
                    month: "Mois 3",
                    parentId: "me_data_002",
                  },
                ],
              },
              {
                id: "me_data_003",
                text: "Nombre total de RDT+",
                type: "data_validation_matrix",
                maxScore: 3,
                weight: 1.0,
                required: true,
                validation: {
                  type: "matrix_validation",
                  months: 3,
                  elements: [
                    {
                      id: "rma_count",
                      name: "Nombre dans l'outils de rapportage (RMA)",
                      type: "number",
                      required: true,
                    },
                    {
                      id: "recount",
                      name: "Nombre recompté dans les outils de collecte de données",
                      type: "number",
                      required: true,
                    },
                    {
                      id: "ratio",
                      name: "Taux de rapportage : Rapport ou Base de données (2)/Recompte (3)",
                      type: "calculated_number",
                      formula: "rma_count / recount",
                      required: true,
                    },
                    {
                      id: "concordance",
                      name: "Y a-t-il concordance entre colonne (2) et colonne (3)",
                      type: "boolean",
                      maxScore: 1,
                      required: true,
                    },
                  ],
                },
                monthlyData: [
                  {
                    id: "me_data_003_m1",
                    month: "Mois 1",
                    parentId: "me_data_003",
                  },
                  {
                    id: "me_data_003_m2",
                    month: "Mois 2",
                    parentId: "me_data_003",
                  },
                  {
                    id: "me_data_003_m3",
                    month: "Mois 3",
                    parentId: "me_data_003",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// Enhanced Score Calculator with M&E matrix support
export const ScoreCalculator = {
  // Calculate score for a single question with validation
  calculateQuestionScore: (question, responses, strict = false) => {
    const response = responses[question.id];

    // Handle missing responses
    if (response === undefined || response === null) {
      if (strict && question.required) {
        throw new Error(`Required question ${question.id} is missing response`);
      }
      return 0;
    }

    // Handle different question types
    switch (question.type) {
      case "boolean":
        return response === true ? question.maxScore * question.weight : 0;

      case "composite":
        return question.subQuestions.reduce((total, subQ) => {
          const subResponse = response[subQ.id];
          const subScore =
            subResponse === true ? subQ.maxScore * subQ.weight : 0;
          return total + subScore;
        }, 0);

      case "data_validation_matrix":
        return this.calculateMatrixScore(question, response);

      case "number":
        return typeof response === "number"
          ? question.maxScore * question.weight
          : 0;

      case "text":
        return typeof response === "string" && response.trim().length > 0
          ? question.maxScore * question.weight
          : 0;

      default:
        return 0;
    }
  },

  // Calculate score for M&E data validation matrix
  calculateMatrixScore: (question, responses) => {
    if (!question.monthlyData || !Array.isArray(question.monthlyData)) {
      return 0;
    }

    let totalScore = 0;
    const scorePerMonth = question.maxScore / question.monthlyData.length;

    question.monthlyData.forEach((monthData) => {
      const monthResponse = responses[monthData.id];
      if (monthResponse && monthResponse.concordance === true) {
        totalScore += scorePerMonth;
      }
    });

    return totalScore;
  },

  // Calculate score for a category or subsection
  calculateCategoryScore: (category, responses, strict = false) => {
    let totalScore = 0;

    if (category.questions) {
      totalScore += category.questions.reduce((sum, question) => {
        return sum + this.calculateQuestionScore(question, responses, strict);
      }, 0);
    }

    return Math.min(totalScore, category.maxScore); // Cap at maxScore
  },

  // Calculate score for a section with nested structure support
  calculateSectionScore: (section, responses, strict = false) => {
    let totalScore = 0;

    // Direct questions
    if (section.questions) {
      totalScore += section.questions.reduce((sum, question) => {
        return sum + this.calculateQuestionScore(question, responses, strict);
      }, 0);
    }

    // Subsections
    if (section.subsections) {
      totalScore += section.subsections.reduce((sum, subsection) => {
        return sum + this.calculateSectionScore(subsection, responses, strict);
      }, 0);
    }

    // Categories
    if (section.categories) {
      totalScore += section.categories.reduce((sum, category) => {
        return sum + this.calculateCategoryScore(category, responses, strict);
      }, 0);
    }

    return Math.min(totalScore, section.maxScore); // Cap at maxScore
  },

  // Calculate total score for entire assessment
  calculateTotalScore: (assessment, responses, strict = false) => {
    const totalScore = assessment.sections.reduce((total, section) => {
      return total + this.calculateSectionScore(section, responses, strict);
    }, 0);

    return Math.min(totalScore, assessment.maxScore); // Cap at maxScore
  },

  // Calculate percentage score with precision
  calculatePercentageScore: (
    assessment,
    responses,
    strict = false,
    precision = 2,
  ) => {
    const totalScore = this.calculateTotalScore(assessment, responses, strict);
    const percentage = (totalScore / assessment.maxScore) * 100;
    return (
      Math.round(percentage * Math.pow(10, precision)) / Math.pow(10, precision)
    );
  },

  // Get detailed score breakdown
  getScoreBreakdown: (assessment, responses, strict = false) => {
    const breakdown = {
      total: this.calculateTotalScore(assessment, responses, strict),
      maxTotal: assessment.maxScore,
      percentage: this.calculatePercentageScore(assessment, responses, strict),
      sections: [],
    };

    assessment.sections.forEach((section) => {
      const sectionScore = this.calculateSectionScore(
        section,
        responses,
        strict,
      );
      breakdown.sections.push({
        id: section.id,
        title: section.title,
        score: sectionScore,
        maxScore: section.maxScore,
        percentage:
          Math.round((sectionScore / section.maxScore) * 100 * 100) / 100,
      });
    });

    return breakdown;
  },
};

// Enhanced Question Parser with M&E matrix support
export const QuestionParser = {
  // Extract all questions with their complete paths
  extractAllQuestions: (assessment) => {
    const questions = [];

    const extractFromContainer = (container, path = []) => {
      const currentPath = [...path, container.id];

      // Handle direct questions
      if (container.questions) {
        container.questions.forEach((question) => {
          questions.push({
            ...question,
            path: currentPath,
            containerTitle: container.title || container.name,
            fullPath: currentPath.join(" > "),
          });

          // Handle composite questions (subQuestions)
          if (question.type === "composite" && question.subQuestions) {
            question.subQuestions.forEach((subQ) => {
              questions.push({
                ...subQ,
                parentId: question.id,
                path: [...currentPath, question.id],
                containerTitle: question.text,
                fullPath: [...currentPath, question.id].join(" > "),
                isSubQuestion: true,
              });
            });
          }

          // Handle M&E matrix questions (monthlyData)
          if (
            question.type === "data_validation_matrix" &&
            question.monthlyData
          ) {
            question.monthlyData.forEach((monthData) => {
              questions.push({
                ...monthData,
                parentId: question.id,
                path: [...currentPath, question.id],
                containerTitle: question.text,
                fullPath: [...currentPath, question.id, monthData.month].join(
                  " > ",
                ),
                isMatrixData: true,
                validation: question.validation,
              });
            });
          }
        });
      }

      // Handle nested structures
      ["subsections", "categories"].forEach((key) => {
        if (container[key]) {
          container[key].forEach((item) => {
            extractFromContainer(item, currentPath);
          });
        }
      });
    };

    assessment.sections.forEach((section) => {
      extractFromContainer(section);
    });

    return questions;
  },

  // Get question by ID with path information
  getQuestionById: (assessment, questionId) => {
    const questions = this.extractAllQuestions(assessment);
    return questions.find((q) => q.id === questionId);
  },

  // Get all required questions
  getRequiredQuestions: (assessment) => {
    const questions = this.extractAllQuestions(assessment);
    return questions.filter((q) => q.required);
  },

  // Get questions by section
  getQuestionsBySection: (assessment, sectionId) => {
    const questions = this.extractAllQuestions(assessment);
    return questions.filter((q) => q.path.includes(sectionId));
  },

  // Validate response completeness
  validateResponses: (assessment, responses) => {
    const required = this.getRequiredQuestions(assessment);
    const missing = required.filter((q) => !responses.hasOwnProperty(q.id));

    return {
      isValid: missing.length === 0,
      missingRequired: missing.map((q) => ({
        id: q.id,
        text: q.text,
        path: q.fullPath,
      })),
      totalRequired: required.length,
      completedRequired: required.length - missing.length,
    };
  },
};

export default checkList;
