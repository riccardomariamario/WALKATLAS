/* WALKATLAS 1.2 — overlay B, tag, cucina, foto iconiche, serate */
(function (global) {
  'use strict';

  const B_TYPES = [
    ['tutti', 'Tutti'],
    ['spiagge', 'Spiagge'],
    ['laghi', 'Laghi'],
    ['parchi-naturali', 'Parchi naturali'],
    ['parchi-divertimento', 'Parchi divertimento'],
    ['terme', 'Terme'],
    ['giardini-storici', 'Giardini storici'],
    ['borghi', 'Borghi da passeggio'],
    ['grotte', 'Grotte / Speleologia'],
    ['vie-ferrate-arrampicata', 'Vie ferrate / Arrampicata'],
    ['sport-acquatici', 'Sport acquatici'],
    ['ciclovie-mtb', 'Ciclovie / Mountain bike'],
    ['acquapark', 'Acquapark'],
    ['parchi-a-tema', 'Parchi a tema'],
    ['zoo-bioparchi', 'Zoo / Bioparchi'],
    ['indoor-famiglie', 'Attività indoor per famiglie'],
    ['piste-gokart', 'Piste go-kart']
  ];
  const B_INTENTS = [
    ['relax', 'Relax'],
    ['avventura', 'Avventura'],
    ['divertimento', 'Divertimento']
  ];
  const MENU_ITEMS = [
    ['tutti', 'Tutti'],
    ['siti', 'Siti'],
    ['musei', 'Musei'],
    ['relax', 'Relax'],
    ['avventura', 'Avventura'],
    ['divertimento', 'Divertimento']
  ];
  const MENU_COLORS = {
    tutti: '#A9A296',
    siti: '#d9a33c',
    musei: '#5c7a6b',
    relax: '#2a7d9f',
    avventura: '#4a7c59',
    divertimento: '#c45c6a'
  };
  const UNIVERSAL_TAGS = [
    ['famiglia', 'Famiglia'],
    ['coppia', 'Coppia'],
    ['solo', 'Da solo'],
    ['amici', 'Amici'],
    ['foto', 'Foto'],
    ['animali', 'Animali']
  ];
  const B_COLORS = {
    spiagge: '#176f9b',
    laghi: '#286d73',
    'parchi-naturali': '#3f702f',
    'parchi-divertimento': '#a63f50',
    terme: '#52679a',
    'giardini-storici': '#3d6d49',
    borghi: '#65577d',
    grotte: '#594336',
    'vie-ferrate-arrampicata': '#78461f',
    'sport-acquatici': '#1b658e',
    'ciclovie-mtb': '#2e6b53',
    acquapark: '#216b88',
    'parchi-a-tema': '#754582',
    'zoo-bioparchi': '#4e7038',
    'indoor-famiglie': '#914569',
    'piste-gokart': '#b5472e',
    cucina: '#8a4b2f',
    'foto-iconiche': '#b45a2a',
    serate: '#4a3d73'
  };
  const ST = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const B_ICONS = {
    tutti: `<circle cx="12" cy="12" r="8.7" ${ST}/><path d="m12 6 1.85 4.15L18 12l-4.15 1.85L12 18l-1.85-4.15L6 12l4.15-1.85Z" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="var(--ink,#1f1b16)" stroke="none"/>`,
    spiagge: `<circle cx="17" cy="6.5" r="2.5" fill="currentColor" stroke="none"/><path d="M3 14.2c2-2.3 4-2.3 6 0s4 2.3 6 0 4-2.3 6 0M3 18.5c2-2.3 4-2.3 6 0s4 2.3 6 0 4-2.3 6 0M5 6.5h5M7.5 4v5" ${ST}/>`,
    laghi: `<path d="M12 3.6c4.1 4.6 6.2 8.25 6.2 11.15a6.2 6.2 0 1 1-12.4 0C5.8 11.85 7.9 8.2 12 3.6Z" ${ST}/><path d="M8.5 15.5c1.1 1.35 2.25 1.35 3.4 0s2.3-1.35 3.45 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
    'parchi-naturali': `<path d="M12 3.5 6.8 10h3L5.5 15.5h5V21h3v-5.5h5L14.2 10h3Z" ${ST}/><path d="M8.2 20.8h7.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
    'parchi-divertimento': `<circle cx="12" cy="9.45" r="6.45" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="9.45" r="1.3" fill="currentColor" stroke="none"/><path d="M12 3v5.1m0 2.7v5.1M5.55 9.45h5.1m2.7 0h5.1M7.45 4.9l3.6 3.6m1.9 1.9 3.6 3.6m0-9.1-3.6 3.6m-1.9 1.9L7.45 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="m9.45 15.35-3 6.1m8.1-6.1 3 6.1M5.15 21.45h13.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><g fill="currentColor" stroke="none"><rect x="10.45" y=".45" width="3.1" height="2.45" rx=".55"/><rect x="4.45" y="2.7" width="2.9" height="2.4" rx=".5"/><rect x="16.65" y="2.7" width="2.9" height="2.4" rx=".5"/><rect x="2.2" y="8.15" width="2.9" height="2.6" rx=".5"/><rect x="18.9" y="8.15" width="2.9" height="2.6" rx=".5"/><rect x="4.75" y="13.55" width="2.9" height="2.4" rx=".5"/><rect x="16.35" y="13.55" width="2.9" height="2.4" rx=".5"/></g>`,
    terme: `<path d="M7 3.2c-1.25 1.2-1.25 2.4 0 3.6s1.25 2.4 0 3.6m5-7.2c-1.25 1.2-1.25 2.4 0 3.6s1.25 2.4 0 3.6m5-7.2c-1.25 1.2-1.25 2.4 0 3.6s1.25 2.4 0 3.6" ${ST}/><path d="M3.5 13.3h17c-.35 4.75-2.55 7.2-6.25 7.2h-4.5c-3.7 0-5.9-2.45-6.25-7.2Z" ${ST}/><path d="M6 16.2c1.05-.8 2.1-.8 3.15 0s2.1.8 3.15 0 2.1-.8 3.15 0 2.1.8 3.15 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    'giardini-storici': `<circle cx="6.4" cy="7.7" r="3.25" ${ST}/><circle cx="17.6" cy="7.7" r="3.25" ${ST}/><path d="M6.4 11v4.15m11.2-4.15v4.15M4.5 15.2h3.8l-.65 3.1h-2.5Zm11.2 0h3.8l-.65 3.1h-2.5ZM9.8 21 12 11.8 14.2 21M7.2 21h9.6" ${ST}/>`,
    borghi: `<path d="M3 20.5h18M3.8 20.5v-7.8l3.7-3 3.7 3v7.8m-1.7 0V8.2L12 5.8l2.5 2.4v12.3m0 0v-6.25l3.15-2.55 3.05 2.55v6.25M12 5.8V3.3m-1.25 0h2.5" ${ST}/><path d="M6.35 15.1h2.3m2.2-4.1h2.3m3.65 5.15h1.8" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round"/>`,
    grotte: `<path d="M3.5 20.5V10.8C3.5 6 7.1 2.9 12 2.9s8.5 3.1 8.5 7.9v9.7M5.8 7.2l2.1 4.55 2.15-5.35 2.2 5.2 2.15-4.8 2.1 4.15" ${ST}/><path d="m5.6 20.5 2.5-5.15 2.1 5.15 2.6-6.2 2.7 6.2 2.05-4.4 1.85 4.4" ${ST}/>`,
    'vie-ferrate-arrampicata': `<path d="m20 2.5-2.15 3 1.45 2.7-2.35 2.9 1.2 3-2 3.15 1 4.25" ${ST}/><circle cx="10.65" cy="6.75" r="1.55" fill="currentColor" stroke="none"/><path d="m10.45 8.45-1.15 4.25 3.05 2.55m-1.75-5.1 3.65 1.15 2.4-1.35M9.4 12.5l-3.05 2.4m6 0-1.15 4.7m1.15-4.7 2.6 3.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16.65" cy="9.95" r=".8" fill="currentColor" stroke="none"/>`,
    'sport-acquatici': `<circle cx="12.2" cy="8.4" r="1.55" fill="currentColor" stroke="none"/><path d="m11.3 10 2.15 3.7M5.1 6.6l13.8 8.1M3.65 15.25c3.5 1.5 13.2 1.5 16.7 0l-2.1 3H5.75ZM3.2 21c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.1 0" ${ST}/><path d="m3.7 5.75 2.8 1.65m11 6.5 2.8 1.65" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/>`,
    'ciclovie-mtb': `<circle cx="6.4" cy="16.65" r="3.65" ${ST}/><circle cx="17.65" cy="16.65" r="3.65" ${ST}/><path d="m6.4 16.65 3.25-7h4.1l3.9 7H11Zm0 0 5.6-3.85 2.4-5.45h2.8M8.55 7.35h3M12 12.8l-2.35-3.15" ${ST}/><circle cx="12" cy="12.8" r=".9" fill="currentColor" stroke="none"/>`,
    acquapark: `<path d="M4 17V4.8h7M4 8.7h5.1M4 12.5h5.75" ${ST}/><circle cx="11.25" cy="4.4" r="1.45" fill="currentColor" stroke="none"/><path d="m10.7 6 2.45 2.15M10.9 6.6c.05 4.7 2.6 7 6.75 7h.8c1.7 0 2.6.9 2.6 2.45M3 18.55c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0M3 21.5c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0" ${ST}/>`,
    'parchi-a-tema': `<path d="M4 20.5V9.2h3V6h3.2v3.2h3.6V6H17v3.2h3v11.3ZM8.7 20.5v-4.1a3.3 3.3 0 0 1 6.6 0v4.1" ${ST}/><path d="m12 1.65.7 1.4 1.55.25-1.1 1.05.25 1.55L12 5.1l-1.4.75.25-1.55-1.1-1.05 1.55-.25Z" fill="currentColor" stroke="none"/>`,
    'zoo-bioparchi': `<circle cx="6.3" cy="8.1" r="2.15" fill="currentColor" stroke="none"/><circle cx="10.15" cy="5.6" r="2.15" fill="currentColor" stroke="none"/><circle cx="14.55" cy="5.8" r="2.15" fill="currentColor" stroke="none"/><circle cx="18.05" cy="8.55" r="2.15" fill="currentColor" stroke="none"/><path d="M7.25 16.9c0-2.85 2.05-5.25 4.75-5.25s4.75 2.4 4.75 5.25c0 2.3-1.55 3.65-3.25 2.75a3.15 3.15 0 0 0-3 0c-1.7.9-3.25-.45-3.25-2.75Z" fill="currentColor" stroke="none"/>`,
    'indoor-famiglie': `<path d="m3.35 10 8.65-6.55L20.65 10v10.5H3.35Z" ${ST}/><circle cx="9.05" cy="11.2" r="1.65" fill="currentColor" stroke="none"/><circle cx="15.1" cy="12.35" r="1.35" fill="currentColor" stroke="none"/><path d="M6.2 18.4c.25-3.25 1.2-4.85 2.85-4.85s2.6 1.6 2.85 4.85m.75 0c.2-2.45 1-3.7 2.45-3.7s2.25 1.25 2.45 3.7" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>`,
    'piste-gokart': `<circle cx="5.85" cy="17.15" r="3.45" ${ST}/><circle cx="18.15" cy="17.15" r="3.25" ${ST}/><path d="M4.15 16.65h15.7M5.4 16.65l1.85-5.35h5.15l1.9 2.05h3.35l1.55 3.3" ${ST}/><path d="M8.55 11.3V6.85h2.35v4.45" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="13.55" cy="9.85" r="2.25" ${ST}/><path d="M13.55 12.1v1.85M11.75 9.85h3.6" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/>`,
    cucina: `<path d="M4.7 3v8.3M7.4 3v8.3M10.1 3v8.3M4.7 3c0 3.15 5.4 3.15 5.4 0M4 21h16M5.5 14h13a6.5 6.5 0 0 1-13 0Z" ${ST}/>`,
    'foto-iconiche': `<path d="M3.5 8.2h3.3l1.7-2.3h7l1.7 2.3h3.3v11H3.5Z" ${ST}/><circle cx="12" cy="13.5" r="3.35" ${ST}/><circle cx="18" cy="10.5" r=".7" fill="currentColor" stroke="none"/>`,
    serate: `<path d="M15 3.7A7.6 7.6 0 1 0 20.3 14a6.3 6.3 0 0 1-5.3-10.3Z" ${ST}/><path d="m18.3 4 .45 1.2 1.25.45-1.25.45-.45 1.2-.45-1.2-1.25-.45 1.25-.45Z" fill="currentColor" stroke="none"/>`,
    siti: `<path d="M3 20.7h18M4.05 18.55h15.9M4.45 9.75h8.65m2.35 0h4.15M4.15 8.7l7.5-5.15 2.55 1.75m1.55.85 4.1 2.55" fill="none" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.35 11.1h1.95v7.15H5.35Zm3.85-.55h1.95v7.7H9.2Zm3.85 2.2H15v4.7h-1.95Zm3.85-2.25h1.95v7.75H16.9Z" fill="currentColor"/><path d="m12.9 12.1 2.25-.85m2.3 9.25 3.4-1.15" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round"/>`,
    musei: `<path d="m3.5 9.5 8.5-5.5 8.5 5.5ZM4.5 20h15M6 18.2V10m4 8.2V10m4 8.2V10m4 8.2V10" ${ST}/>`
  };
  const MENU_ICONS = {
    tutti: B_ICONS.tutti,
    siti: B_ICONS.siti,
    musei: B_ICONS.musei,
    relax: B_ICONS.spiagge,
    avventura: B_ICONS['parchi-naturali'],
    divertimento: `<circle cx="12.2" cy="4.1" r="1.7" fill="currentColor"/><circle cx="13.45" cy="2.5" r=".72" fill="currentColor"/><path d="M10.55 6.15c.7-.42 2.25-.42 2.95.05l.85 5.15H9.7Z" fill="currentColor"/><path d="M10.55 7.15C8.65 7.45 7.15 8.55 5.65 9.65L3.7 8.6M13.55 7.05c1.45-1.15 2.45-2.65 3-4.45l1.75.65" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"/><path d="m9.85 10.55-3.7 4.75c3.65 1.15 7.9 1.15 11.7 0l-4.4-4.75Z" fill="currentColor"/><path d="m10.7 15.45-1.1 4.9-1.9 1.15m5.55-6.05 3.65 3.65 2.85-.15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`
  };

  /* UUID stabili: gli stessi riferimenti possono vivere in itinerari e database. */
  const EXTRA_PLACE_IDS = Object.freeze({
    'strb-cala-goloritze': 'f8faddab-8e56-5452-a2e3-9ff79b60598d',
    'strb-spiaggia-tropea': 'ae3cb682-8682-56af-b598-8596a6657bf1',
    'strb-lago-braies': '5e036a68-9536-53d7-aeac-688f3548c7a3',
    'strb-lago-scanno': '0b1a4a07-5052-55d7-b4ca-1b52ef15caec',
    'strb-pn-abruzzo': 'd9a001c1-2f56-5132-82e4-41e4c4bfa9a3',
    'strb-pn-cinque-terre': '8f51bd98-123f-5c5d-9e02-e098e6a3441d',
    'strb-gardaland': '202518b2-013d-51e4-af47-44746dfccad3',
    'strb-mirabilandia': '80b4fd61-531f-5a91-b197-86a83f2780ba',
    'strb-hostaria-orso': '420bbeeb-9e0f-5000-8055-0c7672d1eeb8',
    'strb-bagutto': '72b23dce-10db-5dd5-8df8-a045d6505732',
    'strb-florian': 'f896524c-f3ed-54e4-9efe-edef8f619ef1',
    'strb-portalba': '4c34c5eb-253f-5705-8551-896fe90681cf',
    'strb-piazzale-michelangelo': '9629b0cb-58ac-5c16-ad7c-43305e4022a8',
    'strb-pincio': '572fbc40-9dd3-5b13-949b-338c95ab8416',
    'strb-positano-belvedere': '6c881f3a-1bd4-56dc-9061-12afcab8fcf4',
    'strb-navigli': 'dd6f3271-ebcc-5b61-9659-f53a4910d81d',
    'strb-trastevere': '51a0a29b-22ad-5eaf-b9fc-02156cd7683e',
    'strb-lungomare-napoli': 'b71729b5-0757-5447-b42a-c8ac15acd26b',
    'strb-museo-storia-naturale-milano': '5f74f86f-8354-53df-bb25-f12a7e6e7499',
    'strb-mets-san-michele': '1d90a66a-e505-5d3b-bc5e-e540203d1044',
    'strb-museo-aeronautica-vigna-di-valle': '6b8f87ba-a3a7-56a3-9d7c-c96f61a03b82',
    'strb-museo-diocesano-milano': 'd42ffb94-5871-5c9b-8aaf-0c15edceddcc',
    'strb-casa-boschi-di-stefano': 'e4358b75-1013-58ee-bbfe-ea179f9089dc',
    'strb-cascate-mulino-saturnia': '2ef2673f-6266-581e-aa2f-c1654f70e21e',
    'strb-giardino-giusti': 'eaf487e0-329d-548b-a4b3-a084483381e4',
    'strb-civita-bagnoregio': 'e4a5f021-4d55-5b27-a932-4e59c2dd479c',
    'strb-grotte-frasassi': 'a453a6ba-bd57-57c0-867b-72a83d7d244d',
    'strb-ferrata-rio-sallagoni': '6956657e-413e-5cac-b4fd-f5263403b8c5',
    'strb-rafting-val-di-sole': '22182da3-dc4f-567d-9716-c868315f5378',
    'strb-ciclovia-mincio': '66a814c5-5478-53ce-aac4-3b773b39e94b',
    'strb-aquafan': '5969b507-3dab-517f-9b52-81b4cb507390',
    'strb-italia-miniatura': '2e5b9849-7349-5d21-8cfe-7c5c76ecc186',
    'strb-bioparco-roma': 'c270ba9b-a845-5806-9329-07965792e9d6',
    'strb-zero-gravity-milano': '748f20c6-bcae-5cae-9d2b-0423e96dea18',
    'strb-south-garda-karting': '9afa4efe-3254-5fe2-a57d-127f82823191',
    'strb-pista-azzurra-jesolo': '0f30aea8-cc40-5556-8de3-b0e226dffe3a',
    'strb-7-laghi-kart': '7ae1e218-3599-5b44-9bf7-dd227ab7cd51',
    'strb-leopard-circuit-viterbo': 'd064b358-a444-527a-9eb2-66ab248610ab',
    'strb-circuito-napoli-sarno': 'a11af181-58ac-573e-9e69-3d7ed5240308'
  });

  const extraPlaces = [
    {id:'strb-cala-goloritze',slug:'cala-goloritze',name:'Cala Goloritzé',city:'Baunei',region:'Sardegna',lat:40.1083,lon:9.6886,type:'natura',strato:'B',bType:'spiagge',intents:['relax'],tags:['foto','coppia','solo'],cat:'spiagge',era:null,eraIds:[],period:'Paesaggio attuale',time:'2–3 h',desc:'Cala di calcare bianco e acqua turchese, raggiungibile a piedi. Ritmo lento, sponda e nuoto, non un lido attrezzato.',context:'Luogo di sosta sul mare, non un’attrazione da giostre.'},
    {id:'strb-spiaggia-tropea',slug:'spiaggia-di-tropea',name:'Spiaggia di Tropea',city:'Tropea',region:'Calabria',lat:38.6794,lon:15.8975,type:'natura',strato:'B',bType:'spiagge',intents:['relax'],tags:['famiglia','foto','amici'],cat:'spiagge',era:null,eraIds:[],period:'Paesaggio attuale',time:'2–4 h',desc:'Lido sotto lo scoglio di Santa Maria dell’Isola: sabbia, mare e passeggiata lenta.',context:'Relax di sponda, non parco a tema.'},
    {id:'strb-lago-braies',slug:'lago-di-braies',name:'Lago di Braies',city:'Braies',region:'Trentino-Alto Adige',lat:46.6947,lon:12.0853,type:'natura',strato:'B',bType:'laghi',intents:['relax','avventura'],tags:['foto','coppia','famiglia'],cat:'laghi',era:null,eraIds:[],period:'Paesaggio attuale',time:'1,5–3 h',desc:'Lago alpino da percorrere in riva o in barca a remi. Sponda e prato, ritmo lento; il giro completo è un’escursione.',context:'Sponda e sentiero, non giostre.'},
    {id:'strb-lago-scanno',slug:'lago-di-scanno',name:'Lago di Scanno',city:'Scanno',region:'Abruzzo',lat:41.9186,lon:13.8794,type:'natura',strato:'B',bType:'laghi',intents:['relax','avventura'],tags:['coppia','foto','animali'],cat:'laghi',era:null,eraIds:[],period:'Paesaggio attuale',time:'1–2 h',desc:'Lago a forma di cuore tra i monti: passeggiata sulla sponda, lontano dai circuiti di massa.',context:'Riva e sentieri, non parco divertimenti.'},
    {id:'strb-pn-abruzzo',slug:'parco-nazionale-dabruzzo',name:'Parco Nazionale d’Abruzzo, Lazio e Molise',city:'Pescasseroli',region:'Abruzzo',lat:41.8089,lon:13.7897,type:'natura',strato:'B',bType:'parchi-naturali',intents:['avventura'],tags:['animali','famiglia','solo'],cat:'parchi-naturali',era:null,eraIds:[],period:'Paesaggio attuale',time:'mezza giornata',desc:'Sentieri, boschi e fauna: escursioni e campeggio, non le piste battute del turismo da cartolina.',context:'Avventura di montagna e sentiero.'},
    {id:'strb-pn-cinque-terre',slug:'parco-nazionale-cinque-terre',name:'Parco Nazionale delle Cinque Terre',city:'Riomaggiore',region:'Liguria',lat:44.0994,lon:9.7375,type:'natura',strato:'B',bType:'parchi-naturali',intents:['avventura','relax'],tags:['foto','coppia','amici'],cat:'parchi-naturali',era:null,eraIds:[],period:'Paesaggio attuale',time:'3–6 h',desc:'Sentieri tra falesie e borghi. È un parco naturale da camminare, non un lungomare da ombrellone.',context:'Escursione costiera.'},
    {id:'strb-gardaland',slug:'gardaland',name:'Gardaland',city:'Castelnuovo del Garda',region:'Veneto',lat:45.4572,lon:10.7139,type:'natura',strato:'B',bType:'parchi-divertimento',intents:['divertimento'],tags:['famiglia','amici'],cat:'parchi-divertimento',era:null,eraIds:[],period:'1975–oggi',time:'giornata',desc:'Parco a tema con giostre e spettacoli. Intrattenimento organizzato, non un sentiero di montagna.',context:'Divertimento da parco a tema.'},
    {id:'strb-mirabilandia',slug:'mirabilandia',name:'Mirabilandia',city:'Ravenna',region:'Emilia-Romagna',lat:44.3374,lon:12.2686,type:'natura',strato:'B',bType:'parchi-divertimento',intents:['divertimento'],tags:['famiglia','amici'],cat:'parchi-divertimento',era:null,eraIds:[],period:'1992–oggi',time:'giornata',desc:'Parco di divertimento sulla costa adriatica: montagne russe e aree a tema.',context:'Giostre e spettacoli, non relax di sponda.'},
    {id:'strb-cascate-mulino-saturnia',slug:'cascate-del-mulino-saturnia',name:'Cascate del Mulino di Saturnia',city:'Saturnia',region:'Toscana',lat:42.64827,lon:11.51268,type:'natura',strato:'B',bType:'terme',intents:['relax'],tags:['coppia','foto','amici'],cat:'terme',era:null,eraIds:[],period:'Paesaggio termale',time:'1,5–3 h',desc:'Vasche naturali di travertino alimentate dalle acque termali del Gorello, accessibili liberamente: una sosta lenta nel paesaggio della Maremma.',context:'Benessere termale all’aperto, distinto da spiagge e laghi.'},
    {id:'strb-giardino-giusti',slug:'giardino-giusti',name:'Giardino Giusti',city:'Verona',region:'Veneto',lat:45.44318,lon:11.00643,type:'natura',strato:'B',bType:'giardini-storici',intents:['relax'],tags:['coppia','foto','solo'],cat:'giardini-storici',era:null,eraIds:[],period:'XVI secolo',time:'1–1,5 h',desc:'Giardino all’italiana cinquecentesco con cipressi, fontane, grotte, labirinto e belvedere sulla città.',context:'Passeggiata lenta in un giardino storico organizzato per terrazze.'},
    {id:'strb-civita-bagnoregio',slug:'civita-di-bagnoregio',name:'Civita di Bagnoregio',city:'Bagnoregio',region:'Lazio',lat:42.627556,lon:12.113811,type:'natura',strato:'B',bType:'borghi',intents:['relax'],tags:['coppia','foto','famiglia'],cat:'borghi',era:null,eraIds:[],period:'Borgo storico',time:'2–3 h',desc:'Borgo dei calanchi raggiungibile solo a piedi, da attraversare lentamente tra ponte, Porta Santa Maria, vicoli e affacci.',context:'Passeggiata in un borgo storico, non una singola attrazione.'},
    {id:'strb-grotte-frasassi',slug:'grotte-di-frasassi',name:'Grotte di Frasassi',city:'Genga',region:'Marche',lat:43.40067,lon:12.96492,type:'natura',strato:'B',bType:'grotte',intents:['avventura'],tags:['famiglia','foto','amici'],cat:'grotte',era:null,eraIds:[],period:'Sistema carsico',time:'1,5–3 h',desc:'Grande sistema carsico con percorso turistico e itinerari Speleo Avventura, tra sale monumentali, stalattiti e stalagmiti.',context:'Esplorazione sotterranea con percorsi di difficoltà diversa.'},
    {id:'strb-ferrata-rio-sallagoni',slug:'via-ferrata-rio-sallagoni',name:'Via Ferrata Rio Sallagoni',city:'Drena',region:'Trentino-Alto Adige',lat:45.970067,lon:10.934104,type:'natura',strato:'B',bType:'vie-ferrate-arrampicata',intents:['avventura'],tags:['amici','foto'],cat:'vie-ferrate-arrampicata',era:null,eraIds:[],period:'Percorso attrezzato',time:'2–3 h',desc:'Via ferrata nella gola del Rio Sallagoni, con staffe, cavi e ponti sospesi: richiede attrezzatura e preparazione adeguate.',context:'Arrampicata su percorso attrezzato, distinta dal semplice sentiero.'},
    {id:'strb-rafting-val-di-sole',slug:'rafting-center-val-di-sole',name:'Rafting Center Val di Sole',city:'Dimaro Folgarida',region:'Trentino-Alto Adige',lat:46.325895,lon:10.862899,type:'natura',strato:'B',bType:'sport-acquatici',intents:['avventura'],tags:['amici','famiglia'],cat:'sport-acquatici',era:null,eraIds:[],period:'Attività contemporanea',time:'2–4 h',desc:'Base sul fiume Noce per rafting, hydrospeed, kayak e canyoning in Val di Sole.',context:'Sport d’acqua guidati, con attività differenziate per esperienza.'},
    {id:'strb-ciclovia-mincio',slug:'ciclovia-del-mincio',name:'Ciclovia del Mincio',city:'Peschiera del Garda',region:'Veneto',lat:45.4385747,lon:10.7023089,type:'natura',strato:'B',bType:'ciclovie-mtb',intents:['avventura'],tags:['famiglia','amici','foto'],cat:'ciclovie-mtb',era:null,eraIds:[],period:'Percorso ciclabile',time:'3–6 h',desc:'Ciclovia lungo il Mincio tra Peschiera e Mantova; il marker indica l’accesso settentrionale al percorso.',context:'Itinerario ciclabile lineare, da modulare secondo tempo e allenamento.'},
    {id:'strb-aquafan',slug:'aquafan-riccione',name:'Aquafan',city:'Riccione',region:'Emilia-Romagna',lat:43.9859,lon:12.6481,type:'natura',strato:'B',bType:'acquapark',intents:['divertimento'],tags:['famiglia','amici'],cat:'acquapark',era:null,eraIds:[],period:'1987–oggi',time:'giornata',desc:'Parco acquatico sulle colline di Riccione con piscine, oltre tre chilometri di scivoli e aree dedicate ai bambini.',context:'Divertimento acquatico, distinto dai parchi con giostre.'},
    {id:'strb-italia-miniatura',slug:'italia-in-miniatura',name:'Italia in Miniatura',city:'Rimini',region:'Emilia-Romagna',lat:44.09141,lon:12.51606,type:'natura',strato:'B',bType:'parchi-a-tema',intents:['divertimento'],tags:['famiglia','foto'],cat:'parchi-a-tema',era:null,eraIds:[],period:'1970–oggi',time:'3–5 h',desc:'Parco di miniature con oltre trecento riproduzioni di monumenti italiani ed europei.',context:'Parco costruito attorno a un tema educativo, distinto dai parchi centrati sulle montagne russe.'},
    {id:'strb-bioparco-roma',slug:'bioparco-di-roma',name:'Bioparco di Roma',city:'Roma',region:'Lazio',lat:41.916888,lon:12.48785,type:'natura',strato:'B',bType:'zoo-bioparchi',intents:['divertimento'],tags:['famiglia','animali','foto'],cat:'zoo-bioparchi',era:null,eraIds:[],period:'1911–oggi',time:'3–5 h',desc:'Giardino zoologico storico di Villa Borghese dedicato alla conoscenza degli animali, alla conservazione e all’educazione naturalistica.',context:'Visita faunistica ed educativa per famiglie.'},
    {id:'strb-zero-gravity-milano',slug:'zero-gravity-milano',name:'Zero-Gravity Milano',city:'Milano',region:'Lombardia',lat:45.47896,lon:9.2372,type:'natura',strato:'B',bType:'indoor-famiglie',intents:['divertimento'],tags:['famiglia','amici'],cat:'indoor-famiglie',era:null,eraIds:[],period:'Attività contemporanea',time:'1–2 h',desc:'Parco indoor con trampolini, aree acrobatiche, parkour e attività per bambini, ragazzi e principianti.',context:'Attività al coperto per famiglie, indipendente dal meteo.'},
    {id:'strb-south-garda-karting',slug:'south-garda-karting',name:'South Garda Karting',city:'Lonato del Garda',region:'Lombardia',lat:45.42509,lon:10.505923,type:'natura',strato:'B',bType:'piste-gokart',intents:['divertimento'],tags:['famiglia','amici'],cat:'piste-gokart',era:null,eraIds:[],period:'1988–oggi',time:'1–2 h',desc:'Circuito CIK-FIA a Lonato del Garda, con noleggio kart per amatori e sessioni agonistiche sullo stesso tracciato.',context:'Pista da go-kart con noleggio, distinta dai parchi a tema.'},
    {id:'strb-pista-azzurra-jesolo',slug:'pista-azzurra-jesolo',name:'Pista Azzurra',city:'Lido di Jesolo',region:'Veneto',lat:45.506053,lon:12.626462,type:'natura',strato:'B',bType:'piste-gokart',intents:['divertimento'],tags:['famiglia','amici'],cat:'piste-gokart',era:null,eraIds:[],period:'Attività contemporanea',time:'45–90 min',desc:'Kartodromo di Jesolo con noleggio kart e circuito per sessioni amatoriali e gare sul litorale veneto.',context:'Pista da go-kart con noleggio, non un parco divertimenti.'},
    {id:'strb-7-laghi-kart',slug:'7-laghi-kart',name:'7 Laghi Kart',city:'Castelletto di Branduzzo',region:'Lombardia',lat:45.065,lon:9.099722,type:'natura',strato:'B',bType:'piste-gokart',intents:['divertimento'],tags:['famiglia','amici'],cat:'piste-gokart',era:null,eraIds:[],period:'Attività contemporanea',time:'45–90 min',desc:'Circuito nel pavese con noleggio kart e piste per adulti e junior, tra sessioni libere e gare.',context:'Kartodromo con noleggio, distinto dai parchi a tema.'},
    {id:'strb-leopard-circuit-viterbo',slug:'leopard-circuit-viterbo',name:'Leopard Circuit Viterbo',city:'Viterbo',region:'Lazio',lat:42.4856,lon:12.0694,type:'natura',strato:'B',bType:'piste-gokart',intents:['divertimento'],tags:['famiglia','amici'],cat:'piste-gokart',era:null,eraIds:[],period:'2008–oggi',time:'1–2 h',desc:'Circuito laziale con noleggio kart e sessioni per amatori e agonisti nel viterbese.',context:'Pista da go-kart con noleggio, non un parco divertimenti.'},
    {id:'strb-circuito-napoli-sarno',slug:'circuito-internazionale-napoli',name:'Circuito Internazionale Napoli',city:'Sarno',region:'Campania',lat:40.839167,lon:14.566389,type:'natura',strato:'B',bType:'piste-gokart',intents:['divertimento'],tags:['famiglia','amici'],cat:'piste-gokart',era:null,eraIds:[],period:'Attività contemporanea',time:'1–2 h',desc:'Kartodromo di Sarno, circuito internazionale con noleggio kart e sessioni amatoriali e agonistiche.',context:'Pista da go-kart in Campania, distinta dai parchi a tema.'},
    {id:'strb-museo-storia-naturale-milano',slug:'museo-civico-storia-naturale-milano',name:'Museo Civico di Storia Naturale di Milano',city:'Milano',region:'Lombardia',lat:45.4691907,lon:9.1994989,type:'musei',strato:'A',bType:null,intents:[],tags:['famiglia','animali'],cat:'naturalistico',era:'contemporanea',eraIds:['contemporanea'],period:'1838–oggi',time:'1,5–2,5 h',desc:'Collezioni di mineralogia, paleontologia, zoologia e storia naturale organizzate per leggere l’evoluzione della Terra e della vita.',context:'Museo naturalistico con raccolte scientifiche e diorami.',kindLabel:'Museo naturalistico'},
    {id:'strb-mets-san-michele',slug:'mets-museo-etnografico-trentino',name:'METS – Museo etnografico trentino San Michele',city:'San Michele all’Adige',region:'Trentino-Alto Adige',lat:46.19433,lon:11.13418,type:'musei',strato:'A',bType:null,intents:[],tags:['famiglia','solo'],cat:'etnografico-antropologico',era:'contemporanea',eraIds:['contemporanea'],period:'1968–oggi',time:'2–3 h',desc:'Raccolte dedicate ai saperi, agli oggetti e alle tradizioni delle comunità alpine del Trentino.',context:'Museo etnografico e antropologico del territorio.',kindLabel:'Museo etnografico e antropologico'},
    {id:'strb-museo-aeronautica-vigna-di-valle',slug:'museo-storico-aeronautica-vigna-di-valle',name:'Museo Storico dell’Aeronautica Militare di Vigna di Valle',city:'Bracciano',region:'Lazio',lat:42.085239,lon:12.217261,type:'musei',strato:'A',bType:null,intents:[],tags:['famiglia','foto'],cat:'militare',era:'contemporanea',eraIds:['contemporanea'],period:'1977–oggi',time:'2–3 h',desc:'Aeromobili, motori, cimeli e documenti raccontano lo sviluppo dell’aviazione militare italiana sul lago di Bracciano.',context:'Museo militare specializzato nella storia aeronautica.',kindLabel:'Museo militare'},
    {id:'strb-museo-diocesano-milano',slug:'museo-diocesano-carlo-maria-martini',name:'Museo Diocesano Carlo Maria Martini',city:'Milano',region:'Lombardia',lat:45.454996,lon:9.181141,type:'musei',strato:'A',bType:null,intents:[],tags:['arte','solo'],cat:'diocesano-arte-sacra',era:'contemporanea',eraIds:['contemporanea'],period:'2001–oggi',time:'1–2 h',desc:'Dipinti, sculture e arredi liturgici provenienti dalla diocesi raccontano la storia dell’arte sacra ambrosiana.',context:'Museo diocesano dedicato al patrimonio religioso e artistico.',kindLabel:'Museo diocesano e d’arte sacra'},
    {id:'strb-casa-boschi-di-stefano',slug:'casa-museo-boschi-di-stefano',name:'Casa Museo Boschi Di Stefano',city:'Milano',region:'Lombardia',lat:45.47904,lon:9.21175,type:'musei',strato:'A',bType:null,intents:[],tags:['arte','coppia'],cat:'casa-museo',era:'contemporanea',eraIds:['contemporanea'],period:'XX secolo',time:'1–1,5 h',desc:'La casa dei collezionisti Antonio Boschi e Marieda Di Stefano conserva una selezione della loro raccolta d’arte del Novecento.',context:'Casa museo biografica e collezione visitabile negli ambienti domestici.',kindLabel:'Casa museo'},
    {id:'strb-hostaria-orso',slug:'hostaria-dellorso',name:'Hostaria dell’Orso',city:'Roma',region:'Lazio',lat:41.9008,lon:12.4715,type:'cucina',strato:'A',bType:null,intents:[],tags:['coppia','foto'],cat:'cucina',era:'medioevo',eraIds:['medioevo'],period:'dal XIV sec.',time:'1,5–2 h',desc:'Locanda romana attiva da secoli. Cucina della tradizione laziale, con pasta all’uovo e ricette di osteria.',context:'Cucina storica: attività ultracentenaria e legame con la cucina romana di osteria.',recipeNote:'Pasta all’uovo e cucina di osteria romana, documentata nella locanda medievale.'},
    {id:'strb-bagutto',slug:'antica-trattoria-bagutto',name:'Antica Trattoria Bagutto',city:'Milano',region:'Lombardia',lat:45.4792,lon:9.2221,type:'cucina',strato:'A',bType:null,intents:[],tags:['famiglia','amici'],cat:'cucina',era:'medioevo',eraIds:['medioevo'],period:'dal 1284',time:'1,5–2 h',desc:'Tra le trattorie più antiche d’Italia. Cucina milanese di corte e di osteria, continua da oltre sette secoli.',context:'Cucina storica: aperta dal 1284, ricette della tradizione milanese.',recipeNote:'Cucina milanese di trattoria (risotti, brasati) in un locale attivo dal 1284.'},
    {id:'strb-florian',slug:'caffe-florian',name:'Caffè Florian',city:'Venezia',region:'Veneto',lat:45.4337,lon:12.3378,type:'cucina',strato:'A',bType:null,intents:[],tags:['coppia','foto'],cat:'cucina',era:'contemporanea',eraIds:['contemporanea'],period:'dal 1720',time:'45–90 min',desc:'Caffè storico in Piazza San Marco. Cioccolata, caffè e pasticceria veneziana in un salotto aperto da tre secoli.',context:'Cucina storica: 1720, tradizione del caffè e della pasticceria veneziana.',recipeNote:'Caffè, cioccolata e dolci veneziani nel locale fondato nel 1720.'},
    {id:'strb-portalba',slug:'antica-pizzeria-portalba',name:'Antica Pizzeria Port’Alba',city:'Napoli',region:'Campania',lat:40.8493,lon:14.2517,type:'cucina',strato:'A',bType:null,intents:[],tags:['amici','famiglia','foto'],cat:'cucina',era:'contemporanea',eraIds:['contemporanea'],period:'dal 1738',time:'1–1,5 h',desc:'Pizzeria considerata tra le prime al mondo. Pizza napoletana nel luogo in cui i venditori ambulanti si fermarono in bottega.',context:'Cucina storica: 1738, nascita documentata della pizza come esercizio stabile.',recipeNote:'Pizza napoletana, tradizione nata qui come attività continuativa dal 1738.'},
    {id:'strb-piazzale-michelangelo',slug:'piazzale-michelangelo',name:'Piazzale Michelangelo',city:'Firenze',region:'Toscana',lat:43.7629,lon:11.2650,type:'foto-iconiche',strato:'overlay',bType:null,intents:[],tags:['foto','coppia','amici'],cat:'foto-iconiche',era:null,eraIds:[],period:'Paesaggio attuale',time:'30–60 min',desc:'Terrazza sul fiume e sul centro di Firenze: il punto da cui si fa la fotografia della città, non un museo.',context:'Foto iconica: veduta consolidata di Firenze da belvedere.'},
    {id:'strb-pincio',slug:'terrazza-del-pincio',name:'Terrazza del Pincio',city:'Roma',region:'Lazio',lat:41.9116,lon:12.4790,type:'foto-iconiche',strato:'overlay',bType:null,intents:[],tags:['foto','coppia','solo'],cat:'foto-iconiche',era:null,eraIds:[],period:'Paesaggio attuale',time:'30–60 min',desc:'Belvedere su Piazza del Popolo e i tetti di Roma. Si viene per l’inquadratura, soprattutto al tramonto.',context:'Foto iconica: veduta alta sul centro di Roma.'},
    {id:'strb-positano-belvedere',slug:'belvedere-di-positano',name:'Belvedere di Positano',city:'Positano',region:'Campania',lat:40.6281,lon:14.4849,type:'foto-iconiche',strato:'overlay',bType:null,intents:[],tags:['foto','coppia'],cat:'foto-iconiche',era:null,eraIds:[],period:'Paesaggio attuale',time:'20–40 min',desc:'Punto di vista sulla costa a terrazze: cupola, spiaggia e falesia nella stessa inquadratura.',context:'Foto iconica: la cartolina della Costiera amalfitana.'},
    {id:'strb-navigli',slug:'navigli-milano',name:'Navigli',city:'Milano',region:'Lombardia',lat:45.4526,lon:9.1764,type:'serate',strato:'overlay',bType:null,intents:[],tags:['amici','coppia'],cat:'serate',era:null,eraIds:[],period:'Sera',time:'sera',desc:'Canali, locali e passeggiata tra Darsena e Naviglio Grande. Zona da sera, non da visita diurna al museo.',context:'Area per serate: movida milanese sull’acqua.'},
    {id:'strb-trastevere',slug:'trastevere',name:'Trastevere',city:'Roma',region:'Lazio',lat:41.8894,lon:12.4697,type:'serate',strato:'overlay',bType:null,intents:[],tags:['amici','coppia','foto'],cat:'serate',era:null,eraIds:[],period:'Sera',time:'sera',desc:'Vicoli, piazze e tavoli all’aperto dopo il tramonto. Si viene per la sera, non per un monumento singolo.',context:'Area per serate: quartiere romano da camminare di notte.'},
    {id:'strb-lungomare-napoli',slug:'lungomare-caracciolo',name:'Lungomare Caracciolo',city:'Napoli',region:'Campania',lat:40.8319,lon:14.2208,type:'serate',strato:'overlay',bType:null,intents:[],tags:['amici','coppia','foto'],cat:'serate',era:null,eraIds:[],period:'Sera',time:'sera',desc:'Passeggiata sul mare verso Posillipo: aperitivo, luce serale e città che si accende.',context:'Area per serate: lungomare napoletano, non un sito archeologico.'}
  ];

  extraPlaces.forEach(p => {
    p.legacyReference = p.id;
    p.id = EXTRA_PLACE_IDS[p.id];
    p.countryId = 'IT';
    p.status = 'published';
    p.photos = [];
    p.ticket = null;
    p.hasPlan = false;
    p.overlay = true;
    p.detailsLoaded = true;
    p.country = 'Italia';
    if (p.type === 'cucina') {
      p.kindLabel = 'Tradizione gastronomica';
      p.familyLabel = 'Cucina storica';
      p.minutes = 90;
    } else if (p.type === 'foto-iconiche') {
      p.kindLabel = 'Punto fotografico';
      p.familyLabel = 'Foto iconiche';
      p.minutes = 45;
    } else if (p.type === 'serate') {
      p.kindLabel = 'Quartiere della sera';
      p.familyLabel = 'Aree per serate';
      p.minutes = 120;
    } else if (p.type === 'musei') {
      p.kindLabel = p.kindLabel || 'Museo';
      p.familyLabel = 'Museo';
      p.minutes = Number.isFinite(p.minutes) ? p.minutes : 90;
      p.typeId = 'museum';
      p.familyId = 'museum';
      p.museumCategoryId = p.cat;
    } else {
      p.kindLabel = B_TYPES.find(t => t[0] === p.bType)?.[1] || 'Luogo';
      p.familyLabel = p.kindLabel;
      p.minutes = 120;
    }
  });

  const tagsBySlug = {
    colosseo: ['foto', 'famiglia', 'amici'],
    pompei: ['foto', 'famiglia'],
    'galleria-degli-uffizi': ['foto', 'coppia'],
    'cattedrale-di-santa-maria-del-fiore': ['foto', 'famiglia'],
    'duomo-di-milano': ['foto'],
    pantheon: ['foto', 'coppia'],
    'fontana-di-trevi': ['foto', 'coppia'],
    'trulli-di-alberobello': ['foto', 'famiglia'],
    'sassi-di-matera': ['foto', 'coppia'],
    paestum: ['foto', 'solo'],
    'reggia-di-caserta': ['famiglia', 'foto'],
    'piazza-dei-miracoli': ['foto', 'famiglia'],
    'su-nuraxi-di-barumini': ['solo', 'foto'],
    'parco-archeologico-ercolano': ['famiglia', 'foto'],
    'villa-deste': ['coppia', 'foto'],
    'castel-del-monte': ['solo', 'foto'],
    'acquario-di-genova': ['famiglia', 'animali'],
    'cenacolo-vinciano': ['foto', 'coppia']
  };

  const INFO_PER_TAG = {
    colosseo: {
      famiglia: 'Scale, dislivelli e tratti stretti: passeggino praticabile soprattutto nei percorsi pianeggianti del settore ovest, non sull’anello superiore.',
      foto: 'L’anello esterno e i fornici a sud-est restano i punti più chiari al mattino, prima delle file.'
    },
    'lago-di-braies': {
      famiglia: 'La sponda davanti al lago è pianeggiante e adatta ai bambini; il giro completo è più lungo e ha tratti sconnessi.'
    },
    'parco-nazionale-dabruzzo': {
      animali: 'Cani ammessi sui sentieri al guinzaglio; nelle aree faunistiche e nei centri visita restano fuori, per non disturbare gli animali selvatici.'
    },
    'bioparco-di-roma': {
      famiglia: 'Percorsi per lo più pianeggianti, con aree pic-nic e spazi per i più piccoli; conviene entrare dalla biglietteria di Villa Borghese.',
      animali: 'È uno zoo: gli animali da compagnia non entrano, a tutela delle specie ospitate.'
    },
    'piazzale-michelangelo': {
      foto: 'Veduta classica su Duomo e Arno: luce migliore all’alba o al tramonto; il terrazzo è aperto, senza biglietto.'
    }
  };

  function decorate(p) {
    if (!p) return p;
    const extra = tagsBySlug[p.slug];
    if (extra) p.tags = Array.from(new Set([...(p.tags || []), ...extra]));
    else if (!p.tags) p.tags = [];
    const info = INFO_PER_TAG[p.slug];
    if (info) p.infoPerTag = Object.assign({}, p.infoPerTag || {}, info);
    if (!p.strato) {
      if (p.type === 'cucina') p.strato = 'A';
      else if (p.type === 'natura') p.strato = 'B';
      else if (p.type === 'foto-iconiche' || p.type === 'serate') p.strato = 'overlay';
      else p.strato = 'A';
    }
    return p;
  }

  function apply(data) {
    data.forEach(decorate);
    extraPlaces.forEach(p => {
      decorate(p);
      if (!data.some(x => x.id === p.id || x.slug === p.slug)) data.push(p);
    });
    return data;
  }

  const extraReferences = new Map();
  extraPlaces.forEach(place => {
    [place.id, place.legacyReference, place.slug, `IT:${place.slug}`].forEach(reference=>extraReferences.set(String(reference),place.id));
  });
  function resolveReference(reference) {
    if(reference&&typeof reference==='object')reference=reference.id||reference.legacyReference||`${reference.countryId||''}:${reference.slug||''}`;
    const value=String(reference||'').trim();
    return extraReferences.get(value)||extraReferences.get(value.toLowerCase())||null;
  }

  global.WalkatlasStratoB = { B_TYPES, B_INTENTS, MENU_ITEMS, MENU_COLORS, MENU_ICONS, UNIVERSAL_TAGS, B_COLORS, B_ICONS, extraPlaces, apply, decorate, resolveReference };
  global.PalinsestoStratoB = global.WalkatlasStratoB;
})(window);
