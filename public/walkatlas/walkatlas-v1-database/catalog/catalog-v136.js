/* Estensione editoriale WALKATLAS v1.36.
 * I nuovi luoghi vengono innestati prima della creazione del repository,
 * così mappa, ricerca, filtri e schede condividono la stessa sorgente.
 */
(function (global) {
  'use strict';

  const core = global.WalkatlasCatalogCore;
  const italian = global.WalkatlasCatalogIt;
  if (!core || !italian) throw new Error('Catalogo WALKATLAS non disponibile per l’estensione v1.36.');

  const publishedAt = '2026-09-15T00:00:00.000Z';
  const sourceLastCheckedAt = '2026-09-15';
  const place = values => ({
    countryId: 'IT',
    closedWeekdays: [],
    officialUrl: null,
    ticketUrl: null,
    hasFloorPlan: false,
    status: 'published',
    publishedAt,
    isUnesco: false,
    unescoRelation: null,
    unescoPropertyName: null,
    unescoReferenceUrl: null,
    sourceLastCheckedAt,
    isTop10: false,
    top10Position: null,
    aliases: [],
    needsReview: false,
    ...values
  });

  const places = [
    place({
      id: 'd7fe698b-0180-5046-90b2-e1a9c02a88b3', legacyId: 121, slug: 'sacra-di-san-michele',
      adminAreaId: 'IT-21', localityId: 'IT:sant-ambrogio-di-torino', typeId: 'site', familyId: 'monument',
      kindId: 'architectural-monument', primaryEraId: 'medioevo', eraIds: ['medioevo'], museumCategoryId: null,
      legacyCategoryId: 'medievale', latitude: 45.0979911, longitude: 7.3430477, visitMinutes: 105,
      aliases: ['Abbazia della Sacra di San Michele', 'Sacra di San Michele Piemonte']
    }),
    place({
      id: '32ba5652-c24a-5f8c-b34f-ee819a344e08', legacyId: 122, slug: 'castello-di-fenis',
      adminAreaId: 'IT-23', localityId: 'IT:fenis', typeId: 'site', familyId: 'monument', kindId: 'castle',
      primaryEraId: 'medioevo', eraIds: ['medioevo'], museumCategoryId: null, legacyCategoryId: 'medievale',
      latitude: 45.7369535, longitude: 7.4887894, visitMinutes: 90, aliases: ['Castello di Fénis']
    }),
    place({
      id: '913db964-cd92-5a73-ba32-d7780c5ff9d2', legacyId: 123, slug: 'museo-scienza-tecnologia-leonardo-da-vinci',
      adminAreaId: 'IT-25', localityId: 'IT:milano', typeId: 'museum', familyId: 'museum', kindId: 'science-museum',
      primaryEraId: 'contemporanea', eraIds: ['contemporanea'], museumCategoryId: 'science', legacyCategoryId: 'scienza',
      latitude: 45.4617812, longitude: 9.1705869, visitMinutes: 150,
      aliases: ['Museo Nazionale Scienza e Tecnologia', 'Museo Leonardo da Vinci Milano']
    }),
    place({
      id: 'bd8c0ba4-070e-575e-ba75-bd9c636cbc99', legacyId: 124, slug: 'museo-archeologico-alto-adige',
      adminAreaId: 'IT-32', localityId: 'IT:bolzano', typeId: 'museum', familyId: 'museum', kindId: 'archaeology-museum',
      primaryEraId: 'preistoria', eraIds: ['preistoria'], museumCategoryId: 'archaeology', legacyCategoryId: 'archeologico',
      latitude: 46.4997955, longitude: 11.3495543, visitMinutes: 120,
      aliases: ['Museo di Ötzi', 'Südtiroler Archäologiemuseum']
    }),
    place({
      id: 'e946406c-6fa6-5184-921e-d90cd738c4d5', legacyId: 125, slug: 'museo-di-castelvecchio',
      adminAreaId: 'IT-34', localityId: 'IT:verona', typeId: 'museum', familyId: 'museum', kindId: 'art-museum',
      primaryEraId: 'medioevo', eraIds: ['medioevo', 'rinascimento'], museumCategoryId: 'art', legacyCategoryId: 'arte',
      latitude: 45.4399535, longitude: 10.987865, visitMinutes: 120, aliases: ['Castelvecchio Verona']
    }),
    place({
      id: '6c991be2-008c-5ee1-98fe-5cd6aa058514', legacyId: 126, slug: 'museo-archeologico-nazionale-cividale',
      adminAreaId: 'IT-36', localityId: 'IT:cividale-del-friuli', typeId: 'museum', familyId: 'museum', kindId: 'archaeology-museum',
      primaryEraId: 'medioevo', eraIds: ['romana', 'medioevo'], museumCategoryId: 'archaeology', legacyCategoryId: 'archeologico',
      latitude: 46.0934636, longitude: 13.4321687, visitMinutes: 105,
      aliases: ['MAN Cividale', 'Museo Archeologico di Cividale del Friuli']
    }),
    place({
      id: 'c1731436-7795-5bec-9224-6368bf0b2414', legacyId: 127, slug: 'galata-museo-del-mare',
      adminAreaId: 'IT-42', localityId: 'IT:genova', typeId: 'museum', familyId: 'museum', kindId: 'history-museum',
      primaryEraId: 'contemporanea', eraIds: ['contemporanea'], museumCategoryId: 'history', legacyCategoryId: 'storico',
      latitude: 44.4142119, longitude: 8.9232583, visitMinutes: 135, aliases: ['Museo del Mare Genova']
    }),
    place({
      id: 'f14e2db5-4bab-55bb-a368-55434f602de2', legacyId: 128, slug: 'museo-ferrari-maranello',
      adminAreaId: 'IT-45', localityId: 'IT:maranello', typeId: 'museum', familyId: 'museum', kindId: 'history-museum',
      primaryEraId: 'contemporanea', eraIds: ['contemporanea'], museumCategoryId: 'history', legacyCategoryId: 'storico',
      latitude: 44.5298284, longitude: 10.8614995, visitMinutes: 105, aliases: ['Museo Ferrari', 'Galleria Ferrari']
    }),
    place({
      id: 'e2fa1e41-c233-5d91-94a0-4848f831db0a', legacyId: 129, slug: 'museo-etrusco-guarnacci',
      adminAreaId: 'IT-52', localityId: 'IT:volterra', typeId: 'museum', familyId: 'museum', kindId: 'archaeology-museum',
      primaryEraId: 'etrusca', eraIds: ['etrusca'], museumCategoryId: 'archaeology', legacyCategoryId: 'archeologico',
      latitude: 43.4009257, longitude: 10.8643302, visitMinutes: 120,
      aliases: ['Museo Etrusco Guarnacci Volterra', 'Museo Guarnacci']
    }),
    place({
      id: '9f61cfbc-d8e4-5c51-bd63-b53d7fe2a715', legacyId: 130, slug: 'pozzo-di-san-patrizio',
      adminAreaId: 'IT-55', localityId: 'IT:orvieto', typeId: 'site', familyId: 'monument', kindId: 'architectural-monument',
      primaryEraId: 'rinascimento', eraIds: ['rinascimento'], museumCategoryId: null, legacyCategoryId: 'rinascimentale',
      latitude: 42.7225369, longitude: 12.1204465, visitMinutes: 60, aliases: ['Pozzo San Patrizio Orvieto']
    }),
    place({
      id: 'cdc8c343-d52c-5596-9270-4ff1c9579229', legacyId: 131, slug: 'museo-archeologico-nazionale-marche',
      adminAreaId: 'IT-57', localityId: 'IT:ancona', typeId: 'museum', familyId: 'museum', kindId: 'archaeology-museum',
      primaryEraId: 'romana', eraIds: ['preistoria', 'bronzo', 'ferro', 'romana'], museumCategoryId: 'archaeology',
      legacyCategoryId: 'archeologico', latitude: 43.6234055, longitude: 13.5107468, visitMinutes: 120,
      aliases: ['MAN Marche', 'Museo Archeologico Ancona']
    }),
    place({
      id: 'b6ebee83-967f-57ca-83bf-78517e355a54', legacyId: 132, slug: 'museo-dell-ara-pacis',
      adminAreaId: 'IT-62', localityId: 'IT:roma', typeId: 'museum', familyId: 'museum', kindId: 'archaeology-museum',
      primaryEraId: 'romana', eraIds: ['romana'], museumCategoryId: 'archaeology', legacyCategoryId: 'archeologico',
      latitude: 41.9061386, longitude: 12.4754631, visitMinutes: 75, aliases: ['Ara Pacis Augustae']
    }),
    place({
      id: '3500b4b6-6a7f-5413-961f-e968efe97159', legacyId: 133, slug: 'museo-nazionale-dabruzzo',
      adminAreaId: 'IT-65', localityId: 'IT:laquila', typeId: 'museum', familyId: 'museum', kindId: 'art-museum',
      primaryEraId: 'medioevo', eraIds: ['medioevo', 'rinascimento', 'contemporanea'], museumCategoryId: 'art',
      legacyCategoryId: 'arte', latitude: 42.3503329, longitude: 13.38879, visitMinutes: 120,
      aliases: ['MUNDA', 'Museo Nazionale d’Abruzzo']
    }),
    place({
      id: '53616317-05c6-5100-acb4-b5f9bf572a1e', legacyId: 134, slug: 'museo-sannitico',
      adminAreaId: 'IT-67', localityId: 'IT:campobasso', typeId: 'museum', familyId: 'museum', kindId: 'archaeology-museum',
      primaryEraId: 'ferro', eraIds: ['ferro'], museumCategoryId: 'archaeology', legacyCategoryId: 'archeologico',
      latitude: 41.5614986, longitude: 14.6584547, visitMinutes: 90, aliases: ['Museo Sannitico Campobasso']
    }),
    place({
      id: '70f58e91-ecfe-546d-8426-c7d32c9f0f6b', legacyId: 135, slug: 'parco-archeologico-di-velia',
      adminAreaId: 'IT-72', localityId: 'IT:ascea', typeId: 'site', familyId: 'archaeological-site', kindId: 'archaeological-city',
      primaryEraId: 'greca', eraIds: ['greca', 'romana'], museumCategoryId: null, legacyCategoryId: 'greca',
      latitude: 40.1609367, longitude: 15.1566402, visitMinutes: 120,
      isUnesco: true, unescoRelation: 'component_part',
      unescoPropertyName: 'Parco Nazionale del Cilento e Vallo di Diano con i siti archeologici di Paestum e Velia e la Certosa di Padula',
      unescoReferenceUrl: 'https://whc.unesco.org/en/list/842', aliases: ['Elea', 'Area archeologica di Velia']
    }),
    place({
      id: 'e2a20c5f-08e1-5bfb-95b2-a4ad82753d19', legacyId: 136, slug: 'marta-taranto',
      adminAreaId: 'IT-75', localityId: 'IT:taranto', typeId: 'museum', familyId: 'museum', kindId: 'archaeology-museum',
      primaryEraId: 'greca', eraIds: ['greca', 'romana'], museumCategoryId: 'archaeology', legacyCategoryId: 'archeologico',
      latitude: 40.4735189, longitude: 17.2384674, visitMinutes: 135,
      aliases: ['MArTA', 'Museo Archeologico Nazionale di Taranto']
    }),
    place({
      id: 'd8f4cafe-2804-505a-9727-ae091de9e225', legacyId: 137, slug: 'tavole-palatine',
      adminAreaId: 'IT-77', localityId: 'IT:bernalda', typeId: 'site', familyId: 'archaeological-site',
      kindId: 'archaeological-area', primaryEraId: 'greca', eraIds: ['greca'], museumCategoryId: null,
      legacyCategoryId: 'greca', latitude: 40.4160625, longitude: 16.8167303, visitMinutes: 60,
      aliases: ['Tempio di Hera Tavole Palatine', 'Area archeologica Tavole Palatine']
    }),
    place({
      id: 'a0cb2048-31df-57bb-a473-5c3a4eef9bb0', legacyId: 138, slug: 'parco-archeologico-di-sibari',
      adminAreaId: 'IT-78', localityId: 'IT:cassano-all-ionio', typeId: 'site', familyId: 'archaeological-site',
      kindId: 'archaeological-park', primaryEraId: 'greca', eraIds: ['greca', 'romana'], museumCategoryId: null,
      legacyCategoryId: 'greca', latitude: 39.7179672, longitude: 16.4911298, visitMinutes: 120,
      aliases: ['Sibari archeologica', 'Sybaris']
    }),
    place({
      id: 'bef2ab73-9d01-594c-b597-2a338c17cb55', legacyId: 139, slug: 'museo-archeologico-salinas',
      adminAreaId: 'IT-82', localityId: 'IT:palermo', typeId: 'museum', familyId: 'museum', kindId: 'archaeology-museum',
      primaryEraId: 'greca', eraIds: ['greca', 'romana'], museumCategoryId: 'archaeology', legacyCategoryId: 'archeologico',
      latitude: 38.1209051, longitude: 13.3611457, visitMinutes: 120,
      aliases: ['Museo Salinas', 'Museo Archeologico Regionale Antonino Salinas']
    }),
    place({
      id: 'ab694f7c-9e05-5cf1-980a-ca26c183b705', legacyId: 140, slug: 'necropoli-di-anghelu-ruju',
      adminAreaId: 'IT-88', localityId: 'IT:alghero', typeId: 'site', familyId: 'archaeological-site', kindId: 'necropolis',
      primaryEraId: 'preistoria', eraIds: ['preistoria', 'bronzo'], museumCategoryId: null, legacyCategoryId: 'preistoria',
      latitude: 40.6325798, longitude: 8.3265363, visitMinutes: 90,
      aliases: ['Anghelu Ruju', 'Necropoli prenuragica di Anghelu Ruju']
    })
  ];

  const localities = {
    'IT:sant-ambrogio-di-torino': ['IT-21', 'Sant’Ambrogio di Torino'],
    'IT:fenis': ['IT-23', 'Fénis'],
    'IT:bolzano': ['IT-32', 'Bolzano'],
    'IT:cividale-del-friuli': ['IT-36', 'Cividale del Friuli'],
    'IT:maranello': ['IT-45', 'Maranello'],
    'IT:volterra': ['IT-52', 'Volterra'],
    'IT:ancona': ['IT-57', 'Ancona'],
    'IT:campobasso': ['IT-67', 'Campobasso'],
    'IT:ascea': ['IT-72', 'Ascea'],
    'IT:taranto': ['IT-75', 'Taranto'],
    'IT:bernalda': ['IT-77', 'Bernalda'],
    'IT:cassano-all-ionio': ['IT-78', 'Cassano all’Ionio'],
    'IT:alghero': ['IT-88', 'Alghero']
  };

  const translations = {
    'd7fe698b-0180-5046-90b2-e1a9c02a88b3': ['Sacra di San Michele', 'Abbazia fortificata arroccata all’imbocco della Val di Susa.', 'Sorta tra X e XI secolo e ampliata dai benedettini, fu costruita come luogo di culto e presidio simbolico lungo una grande via di pellegrinaggio alpina.', ['La sovrapposizione fra roccia, basamento e chiesa.', 'Lo Scalone dei Morti e il Portale dello Zodiaco.', 'Il panorama sulla Val di Susa e il rapporto con la via Francigena.'], 'X–XII sec.', '1,5–2 h'],
    '32ba5652-c24a-5f8c-b34f-ee819a344e08': ['Castello di Fénis', 'Castello medievale valdostano celebre per la doppia cinta muraria e i cortili affrescati.', 'Gli Challant trasformarono tra XIV e XV secolo una precedente fortificazione in residenza signorile, unendo difesa, prestigio dinastico e vita di corte.', ['La doppia cerchia di mura e le torri.', 'Il cortile con lo scalone semicircolare e gli affreschi.', 'Gli ambienti domestici che distinguono una residenza da una semplice fortezza.'], 'XIV–XV sec.', '1–1,5 h'],
    '913db964-cd92-5a73-ba32-d7780c5ff9d2': ['Museo Nazionale della Scienza e della Tecnologia Leonardo da Vinci', 'Il maggiore museo tecnico-scientifico italiano, tra locomotive, aeroplani, navi e laboratori.', 'Fondato nel 1953 nell’ex monastero di San Vittore, raccoglie macchine e testimonianze per spiegare l’evoluzione della scienza, dell’industria e della tecnica in Italia.', ['Le gallerie dedicate a Leonardo e ai modelli delle sue macchine.', 'Il padiglione ferroviario e il sottomarino Enrico Toti.', 'I laboratori interattivi che collegano oggetti storici e principi scientifici.'], 'XIX–XXI sec.', '2–3 h'],
    'bd8c0ba4-070e-575e-ba75-bd9c636cbc99': ['Museo Archeologico dell’Alto Adige', 'Museo dedicato alla storia più antica dell’Alto Adige e alla mummia di Ötzi.', 'Istituito per conservare e interpretare il patrimonio archeologico provinciale, ha in Ötzi e nel suo corredo una testimonianza eccezionale della vita nell’età del Rame.', ['La mummia e le condizioni speciali della cella refrigerata.', 'Il corredo di Ötzi, dall’ascia di rame all’arco.', 'Le ricostruzioni che spiegano ambiente, salute e vita quotidiana oltre cinquemila anni fa.'], 'Preistoria ed età del Rame', '1,5–2 h'],
    'e946406c-6fa6-5184-921e-d90cd738c4d5': ['Museo di Castelvecchio', 'Collezione d’arte medievale e rinascimentale nella fortezza scaligera restaurata da Carlo Scarpa.', 'Il castello fu edificato nel XIV secolo da Cangrande II della Scala; il museo moderno e l’allestimento di Scarpa furono pensati per far dialogare opere, architettura e città.', ['Il restauro di Carlo Scarpa nei dettagli di scale, supporti e aperture.', 'La statua equestre di Cangrande della Scala.', 'Il percorso fra pittura veneta, scultura e vedute sull’Adige.'], 'XIV–XVI sec.', '1,5–2 h'],
    '6c991be2-008c-5ee1-98fe-5cd6aa058514': ['Museo Archeologico Nazionale di Cividale', 'Raccolte romane e longobarde nel cuore della Cividale storica.', 'Nato nell’Ottocento per conservare i reperti di Forum Iulii, documenta soprattutto l’incontro fra eredità romana e cultura longobarda nella prima capitale del ducato friulano.', ['I corredi delle necropoli longobarde.', 'Le iscrizioni e le sculture di età romana e altomedievale.', 'Il legame fra i reperti e i monumenti longobardi della città.'], 'Età romana–Medioevo', '1,5–2 h'],
    'c1731436-7795-5bec-9224-6368bf0b2414': ['Galata Museo del Mare', 'Museo marittimo che racconta Genova, la navigazione e le migrazioni.', 'Allestito nella Darsena storica, nasce per spiegare il rapporto secolare fra Genova e il mare attraverso navi ricostruite, strumenti, commerci e storie di emigranti.', ['La ricostruzione della galea genovese.', 'Le sezioni su navigazione oceanica ed emigrazione italiana.', 'Il sottomarino Nazario Sauro ormeggiato davanti al museo.'], 'Età moderna–contemporanea', '2–3 h'],
    'f14e2db5-4bab-55bb-a368-55434f602de2': ['Museo Ferrari', 'Automobili, motori e trofei raccontano la storia sportiva e industriale di Ferrari.', 'Nato accanto agli stabilimenti di Maranello, il museo conserva vetture e documenti per narrare l’innovazione tecnica, il design e le competizioni legate alla casa fondata da Enzo Ferrari.', ['Le monoposto di Formula 1 e i trofei.', 'L’evoluzione di motori, aerodinamica e design.', 'Le mostre temporanee dedicate a modelli e protagonisti della marca.'], 'XX–XXI sec.', '1,5–2 h'],
    'e2fa1e41-c233-5d91-94a0-4848f831db0a': ['Museo Etrusco Guarnacci', 'Una delle più antiche collezioni pubbliche d’Europa dedicate alla civiltà etrusca.', 'La raccolta donata nel Settecento da Mario Guarnacci fu creata per custodire le antichità di Volterra e ricostruire identità, riti funerari e arte della città etrusca.', ['L’Ombra della sera e la sua figura allungata.', 'Le urne cinerarie in alabastro con scene mitologiche.', 'Le iscrizioni e i corredi che raccontano famiglie e società volterrane.'], 'VIII–I sec. a.C.', '1,5–2 h'],
    '9f61cfbc-d8e4-5c51-bd63-b53d7fe2a715': ['Pozzo di San Patrizio', 'Capolavoro d’ingegneria rinascimentale con due rampe elicoidali indipendenti.', 'Papa Clemente VII affidò ad Antonio da Sangallo il Giovane il pozzo dopo il Sacco di Roma, per garantire acqua a Orvieto in caso di assedio.', ['Le due scale a spirale che non si incrociano.', 'Le finestre che illuminano il cilindro centrale.', 'La profondità e il sistema di accesso concepito per animali da soma.'], 'XVI sec.', '45–60 min'],
    'cdc8c343-d52c-5596-9270-4ff1c9579229': ['Museo Archeologico Nazionale delle Marche', 'Il racconto archeologico delle Marche dalla preistoria alla romanizzazione.', 'Istituito per riunire e proteggere i ritrovamenti regionali, occupa Palazzo Ferretti e mostra come comunità picene, greche e romane abbiano abitato l’Adriatico.', ['I corredi delle necropoli picene.', 'Bronzi, ceramiche e oggetti dagli scambi adriatici.', 'Le sale romane e il dialogo con il palazzo rinascimentale.'], 'Preistoria–età romana', '1,5–2 h'],
    'b6ebee83-967f-57ca-83bf-78517e355a54': ['Museo dell’Ara Pacis', 'L’altare augusteo della pace custodito nell’architettura contemporanea di Richard Meier.', 'Il Senato romano dedicò l’Ara Pacis ad Augusto nel 13 a.C. per celebrare il ritorno del principe e la pace; il museo attuale la protegge e ne rende leggibili i rilievi.', ['Le processioni scolpite sui lati lunghi.', 'I pannelli mitologici e il fregio vegetale.', 'Il rapporto fra monumento antico, luce naturale e involucro contemporaneo.'], '13–9 a.C.', '1–1,5 h'],
    '3500b4b6-6a7f-5413-961f-e968efe97159': ['MUNDA – Museo Nazionale d’Abruzzo', 'Arte e archeologia abruzzese, dai reperti antichi ai capolavori medievali e rinascimentali.', 'Fondato per raccogliere opere e testimonianze del territorio, il museo tutela un patrimonio segnato anche dai terremoti e ne ricostruisce contesti, tecniche e devozioni.', ['Le sculture lignee medievali e le Madonne abruzzesi.', 'I dipinti provenienti da chiese e centri regionali.', 'Il mammut di Scoppito e le sezioni archeologiche.'], 'Preistoria–età moderna', '1,5–2 h'],
    '53616317-05c6-5100-acb4-b5f9bf572a1e': ['Museo Sannitico', 'Reperti del Molise antico con particolare attenzione alla civiltà sannitica.', 'Creato per conservare i ritrovamenti regionali, illustra insediamenti, santuari e necropoli dei Sanniti prima e durante il confronto con Roma.', ['Armi, ornamenti e corredi funerari sannitici.', 'I materiali votivi provenienti dai santuari.', 'Le trasformazioni del territorio con la romanizzazione.'], 'Età del Ferro–età romana', '1–1,5 h'],
    '70f58e91-ecfe-546d-8426-c7d32c9f0f6b': ['Parco archeologico di Velia', 'Resti dell’antica Elea, città greca della scuola filosofica di Parmenide.', 'Fondata da coloni focei nel VI secolo a.C., Elea fu costruita come nuova patria e porto tirrenico; mura, quartieri e santuari testimoniano la crescita della polis.', ['La Porta Rosa e il collegamento fra i quartieri.', 'L’acropoli e il teatro affacciati sul paesaggio costiero.', 'Le terme e gli edifici di età romana sovrapposti alla città greca.'], 'VI sec. a.C.–età romana', '1,5–2,5 h'],
    'e2a20c5f-08e1-5bfb-95b2-a4ad82753d19': ['MArTA – Museo Archeologico Nazionale di Taranto', 'Uno dei grandi musei della Magna Grecia, celebre per gli Ori di Taranto.', 'Nato per conservare i reperti dell’antica Taras e del territorio, ricostruisce la ricchezza della colonia spartana, i rapporti mediterranei e la successiva città romana.', ['Gli Ori di Taranto e la raffinata oreficeria ellenistica.', 'Ceramiche, sculture e corredi della città greca.', 'Il percorso dalla fondazione di Taras alla romanizzazione.'], 'VIII sec. a.C.–età romana', '2–2,5 h'],
    'd8f4cafe-2804-505a-9727-ae091de9e225': ['Tavole Palatine', 'Le colonne superstiti di un tempio dorico della colonia greca di Metaponto.', 'Il santuario, probabilmente dedicato a Hera, fu costruito nel VI secolo a.C. fuori dalle mura per segnare uno spazio sacro e il controllo della pianura metapontina.', ['Le colonne doriche conservate sui due lati lunghi.', 'Le proporzioni del tempio e le tracce della cella.', 'Il rapporto con il paesaggio agricolo dell’antica chora.'], 'VI sec. a.C.', '45–60 min'],
    'a0cb2048-31df-57bb-a473-5c3a4eef9bb0': ['Parco archeologico di Sibari', 'Area archeologica delle città sovrapposte di Sibari, Turi e Copia.', 'La potente colonia achea di Sibari nacque alla fine dell’VIII secolo a.C.; dopo la distruzione, nuove città furono costruite nello stesso luogo per controllare la fertile piana ionica.', ['La sovrapposizione stratigrafica delle tre città.', 'Strade, domus e impianti termali di età romana.', 'Il paesaggio della piana e il problema delle acque che ha conservato e minacciato il sito.'], 'VIII sec. a.C.–età romana', '1,5–2 h'],
    'bef2ab73-9d01-594c-b597-2a338c17cb55': ['Museo Archeologico Regionale Antonino Salinas', 'Grande collezione archeologica siciliana, con metope di Selinunte e reperti fenici e greci.', 'Le raccolte nate tra Settecento e Ottocento furono riunite per tutelare le antichità dell’isola e raccontare l’incontro fra popolazioni indigene, Fenici, Greci e Romani.', ['Le metope dei templi di Selinunte.', 'Le collezioni fenicio-puniche e la Pietra di Palermo.', 'Sculture, ceramiche e reperti subacquei nel chiostro dell’ex convento.'], 'Preistoria–età romana', '1,5–2,5 h'],
    'ab694f7c-9e05-5cf1-980a-ca26c183b705': ['Necropoli di Anghelu Ruju', 'Una vasta necropoli prenuragica scavata nella roccia, vicino ad Alghero.', 'Le comunità neolitiche e dell’età del Rame scavarono numerose domus de janas per sepolture collettive, creando spazi rituali che imitavano l’abitazione dei vivi.', ['Gli ingressi a pozzetto e a corridoio delle tombe.', 'Le celle, le false porte e i simboli scolpiti nella roccia.', 'Il riuso delle sepolture attraverso più fasi della preistoria sarda.'], 'IV–III millennio a.C.', '1–1,5 h']
  };

  for (const [id, [adminAreaId, label]] of Object.entries(localities)) {
    if (!core.localities.some(item => item.id === id)) core.localities.push({ id, countryId: 'IT', adminAreaId });
    italian.localities[id] = label;
  }

  const addedIds = [];
  for (const item of places) {
    if (core.places.some(existing => existing.id === item.id || (existing.countryId === item.countryId && existing.slug === item.slug))) continue;
    core.places.push(item);
    core.legacyIdMap[String(item.legacyId)] = item.id;
    const [name, shortDescription, context, visitFocus, periodLabel, visitLabel] = translations[item.id];
    italian.places[item.id] = {
      placeId: item.id,
      locale: 'it',
      name,
      shortDescription,
      context,
      visitFocus,
      periodLabel,
      visitLabel,
      hoursText: null
    };
    addedIds.push(item.id);
  }

  global.WalkatlasCatalogV136 = Object.freeze({
    version: '1.36',
    count: places.length,
    addedCount: addedIds.length,
    placeIds: Object.freeze(places.map(item => item.id))
  });
})(window);
