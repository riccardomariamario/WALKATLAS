/* WALKATLAS v1.35 — Personaggi storici (prototipo editoriale).
   Contratto produzione: sql/0009_historical_people.sql
   I placeRef usano slug del catalogo. Nessuna relazione inventata.
   Luoghi assenti dal catalogo restano in `candidates`, non vengono creati al volo. */
(function (root) {
  const REL_LABEL = Object.freeze({
    BIRTH: 'Nascita',
    LIVED: 'Visse qui',
    WORKED: 'Lavorò qui',
    STUDIED: 'Studiò qui',
    CREATED: 'Realizzò un’opera',
    VISITED: 'Visitò',
    EVENT: 'Evento della vita',
    DEATH: 'Morte',
    BURIAL: 'Sepoltura',
    WORK_PRESERVED: 'Opera conservata',
    DEDICATED: 'Luogo dedicato',
    OTHER_VERIFIED: 'Relazione documentata'
  });

  const HERITAGE_TYPES = Object.freeze(['WORK_PRESERVED', 'DEDICATED']);

  const people = Object.freeze([
    {
      id: 'person-leonardo',
      slug: 'leonardo-da-vinci',
      name: 'Leonardo da Vinci',
      birthYear: 1452,
      deathYear: 1519,
      dates: '1452–1519',
      era: 'rinascimento',
      eraLabel: 'Rinascimento',
      categories: ['Arte', 'Scienza', 'Ingegneria'],
      collections: ['rinascimento', 'grandi-artisti', 'scienziati'],
      shortBio: 'Seguire Leonardo in Italia significa passare dalla bottega fiorentina alla corte milanese, fino alle opere che oggi si visitano in museo. Non è un viaggio di un giorno: è una geografia della sua vita e della sua eredità.',
      wikidataId: 'Q762',
      portrait: {
        url: 'walkatlas-v1-foto/personaggi/leonardo-da-vinci.png',
        source: 'Wikimedia Commons',
        author: 'attribuito a Francesco Melzi',
        license: 'Public domain',
        attribution: 'Ritratto attribuito a Francesco Melzi, dominio pubblico, Wikimedia Commons',
        page: 'https://commons.wikimedia.org/wiki/File:Francesco_Melzi_-_Portrait_of_Leonardo.png'
      },
      documentedJourney: false,
      status: 'published',
      places: [
        { placeRef: 'castello-sforzesco', type: 'WORKED', title: 'Corte degli Sforza', period: '1482–1499', order: 2, certainty: 'documented', verification: 'verified', description: 'A Milano Leonardo visse e lavorò a lungo per Ludovico il Moro. Il Castello Sforzesco è il cuore visibile di quella corte.', sourceName: 'Castello Sforzesco — Comune di Milano', sourceUrl: 'https://www.milanocastello.it/' },
        { placeRef: 'cenacolo-vinciano', type: 'CREATED', title: 'L’Ultima Cena', period: '1495–1498', order: 3, certainty: 'documented', verification: 'verified', description: 'Leonardo dipinse il Cenacolo nel refettorio di Santa Maria delle Grazie, oggi visitabile come Cenacolo Vinciano. Qui presenza fisica e opera coincidono.', sourceName: 'Ministero della Cultura — Cenacolo Vinciano', sourceUrl: 'https://cenacolovinciano.cultura.gov.it/' },
        { placeRef: 'palazzo-vecchio', type: 'WORKED', title: 'Battaglia di Anghiari', period: '1503–1506 circa', order: 4, certainty: 'documented', verification: 'verified', description: 'Di ritorno a Firenze, Leonardo fu incaricato di un grande affresco in Palazzo Vecchio. L’opera è perduta; il palazzo resta il luogo della commissione.', sourceName: 'Musei Civici Fiorentini — Palazzo Vecchio', sourceUrl: 'https://cultura.comune.fi.it/palazzo-vecchio' },
        { placeRef: 'galleria-degli-uffizi', type: 'WORK_PRESERVED', title: 'Dipinti conservati', period: 'oggi', order: 6, certainty: 'documented', verification: 'verified', description: 'Gli Uffizi conservano opere di Leonardo. Non è un luogo della sua vita quotidiana: è dove oggi si incontrano i dipinti.', sourceName: 'Gallerie degli Uffizi', sourceUrl: 'https://www.uffizi.it/' },
        { placeRef: 'gallerie-accademia-venezia', type: 'WORK_PRESERVED', title: 'Uomo vitruviano', period: 'oggi', order: 7, certainty: 'documented', verification: 'verified', description: 'Le Gallerie dell’Accademia conservano l’Uomo vitruviano. Leonardo soggiornò a Venezia nel 1500; il foglio è un’eredità conservata, non la prova di un atelier nel museo.', sourceName: 'Gallerie dell’Accademia', sourceUrl: 'https://www.gallerieaccademia.it/' },
        { placeRef: 'pinacoteca-di-brera', type: 'WORK_PRESERVED', title: 'Opere leonardesche', period: 'oggi', order: 8, certainty: 'documented', verification: 'reviewed', description: 'Brera conserva dipinti della cerchia e del lascito visivo di Leonardo. È un luogo di eredità, non di soggiorno documentato.', sourceName: 'Pinacoteca di Brera', sourceUrl: 'https://pinacotecabrera.org/' }
      ],
      candidates: [
        { name: 'Museo Leonardiano / Casa natale', city: 'Vinci', lat: 43.787, lon: 10.925, type: 'BIRTH', note: 'Luogo di nascita (1452). Assente dal catalogo attuale.', sourceName: 'Museo Leonardiano di Vinci', sourceUrl: 'https://www.museoleonardiano.it/' }
      ]
    },
    {
      id: 'person-michelangelo',
      slug: 'michelangelo-buonarroti',
      name: 'Michelangelo Buonarroti',
      birthYear: 1475,
      deathYear: 1564,
      dates: '1475–1564',
      era: 'rinascimento',
      eraLabel: 'Rinascimento',
      categories: ['Arte', 'Architettura'],
      collections: ['rinascimento', 'grandi-artisti'],
      shortBio: 'Michelangelo si legge tra Firenze e Roma: il David, le sculture del Bargello, la sepoltura in Santa Croce. Cappella Sistina e San Pietro restano candidati: non sono ancora schede del catalogo.',
      wikidataId: 'Q5592',
      portrait: {
        url: 'walkatlas-v1-foto/personaggi/michelangelo-buonarroti.jpg',
        source: 'Wikimedia Commons',
        author: 'Daniele da Volterra (attribuito)',
        license: 'Public domain',
        attribution: 'Ritratto attribuito a Daniele da Volterra, dominio pubblico, Wikimedia Commons',
        page: 'https://commons.wikimedia.org/wiki/File:Michelangelo-Buonarroti1.jpg'
      },
      documentedJourney: false,
      status: 'published',
      places: [
        { placeRef: 'museo-nazionale-del-bargello', type: 'WORK_PRESERVED', title: 'Sculture giovanili', period: 'oggi', order: 1, certainty: 'documented', verification: 'verified', description: 'Il Bargello conserva sculture di Michelangelo, fra cui il Bacco. È il luogo in cui oggi si vedono, non la bottega in cui nacquero.', sourceName: 'Musei del Bargello', sourceUrl: 'https://www.bargellomusei.beniculturali.it/' },
        { placeRef: 'galleria-dell-accademia', type: 'WORK_PRESERVED', title: 'Il David', period: '1501–1504 / oggi', order: 2, certainty: 'documented', verification: 'verified', description: 'Il David fu scolpito per Firenze e si visita all’Accademia. Il museo conserva l’opera; la piazza della Signoria ne tiene una copia.', sourceName: 'Galleria dell’Accademia di Firenze', sourceUrl: 'https://www.galleriaaccademiafirenze.it/' },
        { placeRef: 'palazzo-vecchio', type: 'WORKED', title: 'Piazza della Signoria', period: '1504', order: 3, certainty: 'documented', verification: 'verified', description: 'Il David fu collocato davanti a Palazzo Vecchio, cuore politico di Firenze. Il palazzo resta il contesto civico dell’opera.', sourceName: 'Musei Civici Fiorentini', sourceUrl: 'https://cultura.comune.fi.it/palazzo-vecchio' },
        { placeRef: 'basilica-di-santa-croce', type: 'BURIAL', title: 'Tomba in Santa Croce', period: '1564', order: 6, certainty: 'documented', verification: 'verified', description: 'Michelangelo è sepolto in Santa Croce. La basilica è il luogo della sepoltura, non un cantiere delle sue sculture maggiori.', sourceName: 'Opera di Santa Croce', sourceUrl: 'https://www.santacroceopera.it/' }
      ],
      candidates: [
        { name: 'Musei Vaticani — Cappella Sistina', city: 'Città del Vaticano', lat: 41.9029, lon: 12.4545, type: 'CREATED', note: 'Volta (1508–1512) e Giudizio Universale (1536–1541), eseguiti in loco. Assenti come scheda autonoma.', sourceName: 'Musei Vaticani', sourceUrl: 'https://www.museivaticani.va/' },
        { name: 'Basilica di San Pietro', city: 'Città del Vaticano', lat: 41.9022, lon: 12.4539, type: 'CREATED', note: 'Pietà (1498–1499) e, dal 1546, architettura della basilica. Assente dal catalogo.', sourceName: 'Basilica di San Pietro', sourceUrl: 'https://www.vatican.va/' }
      ]
    },
    {
      id: 'person-dante',
      slug: 'dante-alighieri',
      name: 'Dante Alighieri',
      birthYear: 1265,
      deathYear: 1321,
      dates: '1265–1321',
      era: 'medioevo',
      eraLabel: 'Medioevo',
      categories: ['Letteratura', 'Politica'],
      collections: ['scrittori', 'medioevo'],
      shortBio: 'Dante si legge tra la Firenze dei priori e la Ravenna dell’esilio. Santa Croce conserva il cenotafio; la tomba è a Ravenna. Due città per una vita spezzata dalla politica.',
      wikidataId: 'Q1067',
      portrait: {
        url: 'walkatlas-v1-foto/personaggi/dante-alighieri.jpg',
        source: 'Wikimedia Commons',
        author: 'Domenico di Michelino',
        license: 'Public domain',
        attribution: 'Domenico di Michelino, Dante e il suo poema, Duomo di Firenze, dominio pubblico',
        page: 'https://commons.wikimedia.org/wiki/File:Dante_Domenico_di_Michelino_Duomo_Florence.jpg'
      },
      documentedJourney: false,
      status: 'published',
      places: [
        { placeRef: 'cattedrale-di-santa-maria-del-fiore', type: 'STUDIED', title: 'Battesimo a San Giovanni', period: '1265 / Firenze', order: 1, certainty: 'documented', verification: 'verified', description: 'Dante fu battezzato nel Battistero di San Giovanni, accanto alla cattedrale. Il complesso monumentale è il cuore della Firenze in cui nacque.', sourceName: 'Opera di Santa Maria del Fiore', sourceUrl: 'https://duomo.firenze.it/' },
        { placeRef: 'palazzo-vecchio', type: 'WORKED', title: 'Priore della Repubblica', period: '1300', order: 2, certainty: 'documented', verification: 'verified', description: 'Nel 1300 Dante fu priore. Palazzo Vecchio, avviato nel 1299 come Palazzo dei Priori, è il palazzo del governo a cui appartenne quel mandato.', sourceName: 'Comune di Firenze — Palazzo Vecchio', sourceUrl: 'https://cultura.comune.fi.it/palazzo-vecchio' },
        { placeRef: 'basilica-di-santa-croce', type: 'DEDICATED', title: 'Cenotafio', period: '1829', order: 3, certainty: 'documented', verification: 'verified', description: 'Santa Croce ospita il cenotafio ottocentesco di Dante. Non è la tomba: le spoglie restano a Ravenna.', sourceName: 'Opera di Santa Croce', sourceUrl: 'https://www.santacroceopera.it/' },
        { placeRef: 'san-vitale-galla-placidia', type: 'LIVED', title: 'Ultimi anni a Ravenna', period: '1318–1321 circa', order: 4, certainty: 'documented', verification: 'verified', description: 'Dante trascorse gli ultimi anni a Ravenna, ospite dei Da Polenta. San Vitale è il grande segno visibile della città in cui visse e morì, non la sua casa.', sourceName: 'Ravenna Turismo / MiC', sourceUrl: 'https://www.ravennamosaici.it/' }
      ],
      candidates: [
        { name: 'Tomba di Dante', city: 'Ravenna', lat: 44.416, lon: 12.200, type: 'BURIAL', note: 'Sepoltura effettiva (1321), accanto a San Francesco. Assente come scheda autonoma.', sourceName: 'Comune di Ravenna — Tomba di Dante', sourceUrl: 'https://www.comune.ra.it/' }
      ]
    },
    {
      id: 'person-giotto',
      slug: 'giotto',
      name: 'Giotto',
      birthYear: 1267,
      deathYear: 1337,
      dates: 'c. 1267–1337',
      era: 'medioevo',
      eraLabel: 'Medioevo',
      categories: ['Arte', 'Architettura'],
      collections: ['grandi-artisti', 'medioevo'],
      shortBio: 'Giotto si visita a Padova, Firenze e Assisi: la cappella degli Scrovegni, il campanile del Duomo, Santa Croce e la basilica di San Francesco. Una geografia del Trecento, non un itinerario giornaliero.',
      wikidataId: 'Q7814',
      portrait: {
        url: 'walkatlas-v1-foto/personaggi/giotto.jpg',
        source: 'Wikimedia Commons',
        author: 'Cinque maestri del rinascimento fiorentino (XVI sec.), ritratto di Giotto',
        license: 'Public domain',
        attribution: 'Ritratto di Giotto dai Cinque maestri del rinascimento fiorentino, dominio pubblico, Wikimedia Commons',
        page: 'https://commons.wikimedia.org/wiki/File:Five_Famous_Men_of_the_Florentine_Renaissance,_Giotto_(cropped).jpg'
      },
      documentedJourney: false,
      status: 'published',
      places: [
        { placeRef: 'cappella-degli-scrovegni', type: 'CREATED', title: 'Ciclo degli Scrovegni', period: 'c. 1303–1305', order: 1, certainty: 'documented', verification: 'verified', description: 'Giotto affrescò la cappella per Enrico Scrovegni. È il luogo in cui l’opera fu eseguita e si visita ancora oggi.', sourceName: 'Cappella degli Scrovegni — Comune di Padova', sourceUrl: 'https://www.cappelladegliscrovegni.it/' },
        { placeRef: 'cattedrale-di-santa-maria-del-fiore', type: 'CREATED', title: 'Campanile di Giotto', period: 'dal 1334', order: 2, certainty: 'documented', verification: 'verified', description: 'Giotto fu capomaestro dell’Opera del Duomo e avviò il campanile che porta il suo nome. Morì prima del completamento.', sourceName: 'Opera di Santa Maria del Fiore', sourceUrl: 'https://duomo.firenze.it/' },
        { placeRef: 'basilica-di-santa-croce', type: 'CREATED', title: 'Cappelle Bardi e Peruzzi', period: 'c. 1320', order: 3, certainty: 'documented', verification: 'verified', description: 'In Santa Croce Giotto affrescò cappelle gentilizie. Si visitano nella basilica in cui lavorò, non in un museo successivo.', sourceName: 'Opera di Santa Croce', sourceUrl: 'https://www.santacroceopera.it/' },
        { placeRef: 'basilica-san-francesco-assisi', type: 'CREATED', title: 'Storie di San Francesco', period: 'fine XIII sec.', order: 4, certainty: 'probable', verification: 'reviewed', description: 'La tradizione attribuisce a Giotto (e bottega) gli affreschi della basilica superiore. L’attribuzione è dibattuta: Walkatlas la presenta come attribuzione consolidata, non come fatto incontestabile.', sourceName: 'Sacro Convento di Assisi', sourceUrl: 'https://www.sanfrancescoassisi.org/' }
      ],
      candidates: []
    },
    {
      id: 'person-raffaello',
      slug: 'raffaello-sanzio',
      name: 'Raffaello Sanzio',
      birthYear: 1483,
      deathYear: 1520,
      dates: '1483–1520',
      era: 'rinascimento',
      eraLabel: 'Rinascimento',
      categories: ['Arte', 'Architettura'],
      collections: ['rinascimento', 'grandi-artisti'],
      shortBio: 'Da Urbino a Firenze e Milano, Raffaello lascia una geografia di palazzi e musei. Le Stanze vaticane restano un candidato: il catalogo non ha ancora la scheda dei Musei Vaticani.',
      wikidataId: 'Q5597',
      portrait: {
        url: 'walkatlas-v1-foto/personaggi/raffaello-sanzio.jpg',
        source: 'Wikimedia Commons',
        author: 'Raffaello (autoritratto)',
        license: 'Public domain',
        attribution: 'Autoritratto di Raffaello, Galleria degli Uffizi, dominio pubblico',
        page: 'https://commons.wikimedia.org/wiki/File:Raffaello_Sanzio.jpg'
      },
      documentedJourney: false,
      status: 'published',
      places: [
        { placeRef: 'palazzo-ducale-urbino', type: 'BIRTH', title: 'Urbino, palazzo ducale', period: '1483', order: 1, certainty: 'documented', verification: 'verified', description: 'Raffaello nacque a Urbino, nella città del palazzo ducale federiciano. Il palazzo è il contesto visibile della sua formazione.', sourceName: 'Galleria Nazionale delle Marche', sourceUrl: 'https://www.gallerianazionalemarche.it/' },
        { placeRef: 'galleria-degli-uffizi', type: 'WORK_PRESERVED', title: 'Madonne e autoritratto', period: 'oggi', order: 3, certainty: 'documented', verification: 'verified', description: 'Gli Uffizi conservano capolavori di Raffaello. È un luogo di eredità museale, non la sua bottega romana.', sourceName: 'Gallerie degli Uffizi', sourceUrl: 'https://www.uffizi.it/' },
        { placeRef: 'galleria-borghese', type: 'WORK_PRESERVED', title: 'Deposizione e ritratti', period: 'oggi', order: 4, certainty: 'documented', verification: 'verified', description: 'Villa Borghese conserva dipinti di Raffaello. Collezione seicentesca: il palazzo non esisteva quando l’artista visse.', sourceName: 'Galleria Borghese', sourceUrl: 'https://www.galleriaborghese.beniculturali.it/' },
        { placeRef: 'pinacoteca-di-brera', type: 'WORK_PRESERVED', title: 'Sposalizio della Vergine', period: 'oggi', order: 5, certainty: 'documented', verification: 'verified', description: 'Lo Sposalizio della Vergine si visita a Brera. Dipinto per Città di Castello, oggi è un’opera conservata a Milano.', sourceName: 'Pinacoteca di Brera', sourceUrl: 'https://pinacotecabrera.org/' }
      ],
      candidates: [
        { name: 'Musei Vaticani — Stanze di Raffaello', city: 'Città del Vaticano', lat: 41.903, lon: 12.4544, type: 'CREATED', note: 'Stanze dipinte per Giulio II e Leone X (1508–1520), negli ambienti in cui Raffaello lavorò. Assenti come scheda autonoma.', sourceName: 'Musei Vaticani', sourceUrl: 'https://www.museivaticani.va/' }
      ]
    },
    {
      id: 'person-galileo',
      slug: 'galileo-galilei',
      name: 'Galileo Galilei',
      birthYear: 1564,
      deathYear: 1642,
      dates: '1564–1642',
      era: 'rinascimento',
      eraLabel: 'Età moderna',
      categories: ['Scienza'],
      collections: ['scienziati'],
      shortBio: 'Galileo si racconta tra Pisa, Firenze e la tomba in Santa Croce. Il Museo Galileo conserva gli strumenti; la caduta dalla Torre è una leggenda e Walkatlas non la presenta come fatto.',
      wikidataId: 'Q307',
      portrait: {
        url: 'walkatlas-v1-foto/personaggi/galileo-galilei.jpg',
        source: 'Wikimedia Commons',
        author: 'Justus Sustermans, 1636',
        license: 'Public domain',
        attribution: 'Justus Sustermans, ritratto di Galileo, 1636, dominio pubblico',
        page: 'https://commons.wikimedia.org/wiki/File:Justus_Sustermans_-_Portrait_of_Galileo_Galilei,_1636.jpg'
      },
      documentedJourney: false,
      status: 'published',
      places: [
        { placeRef: 'piazza-dei-miracoli', type: 'BIRTH', title: 'Pisa, città natale', period: '1564', order: 1, certainty: 'documented', verification: 'verified', description: 'Galileo nacque a Pisa. Il Duomo e il Battistero sono il cuore monumentale della città in cui fu battezzato. La caduta degli oggetti dalla Torre non è un esperimento documentato.', sourceName: 'Opera della Primaziale Pisana', sourceUrl: 'https://www.opapisa.it/' },
        { placeRef: 'palazzo-pitti-giardino-boboli', type: 'WORKED', title: 'Corte medicea', period: '1610–1633', order: 2, certainty: 'documented', verification: 'verified', description: 'Galileo fu matematico e filosofo del granduca. Palazzo Pitti è la residenza visibile di quella corte, non la sua abitazione privata.', sourceName: 'Uffizi / Palazzo Pitti', sourceUrl: 'https://www.uffizi.it/palazzo-pitti' },
        { placeRef: 'museo-galileo', type: 'DEDICATED', title: 'Strumenti e memoria', period: 'oggi', order: 3, certainty: 'documented', verification: 'verified', description: 'Il Museo Galileo conserva strumenti originali e collezioni medicee. È un luogo dedicato, sorto dopo la sua morte.', sourceName: 'Museo Galileo', sourceUrl: 'https://www.museogalileo.it/' },
        { placeRef: 'basilica-di-santa-croce', type: 'BURIAL', title: 'Tomba in Santa Croce', period: '1737 (traslazione)', order: 4, certainty: 'documented', verification: 'verified', description: 'Galileo è sepolto in Santa Croce. Il monumento funebre visibile oggi è settecentesco.', sourceName: 'Opera di Santa Croce', sourceUrl: 'https://www.santacroceopera.it/' }
      ],
      candidates: [
        { name: 'Villa Il Gioiello', city: 'Arcetri (Firenze)', lat: 43.757, lon: 11.256, type: 'DEATH', note: 'Qui Galileo trascorse gli ultimi anni e morì nel 1642.', sourceName: 'Università di Firenze — Villa Il Gioiello', sourceUrl: 'https://www.unifi.it/' },
        { name: 'Università di Padova', city: 'Padova', lat: 45.407, lon: 11.877, type: 'WORKED', note: 'Cattedra di matematica 1592–1610. Assente come scheda autonoma.', sourceName: 'Università di Padova', sourceUrl: 'https://www.unipd.it/' }
      ]
    },
    {
      id: 'person-caravaggio',
      slug: 'caravaggio',
      name: 'Caravaggio',
      birthYear: 1571,
      deathYear: 1610,
      dates: '1571–1610',
      era: 'rinascimento',
      eraLabel: 'Età moderna',
      categories: ['Arte'],
      collections: ['grandi-artisti'],
      shortBio: 'Caravaggio si incontra oggi nei musei di Roma, Firenze, Milano e Napoli. Le cappelle romane in cui dipinse dal vero restano candidate: il catalogo non le ha ancora come schede autonome.',
      wikidataId: 'Q42207',
      portrait: {
        url: 'walkatlas-v1-foto/personaggi/caravaggio.jpg',
        source: 'Wikimedia Commons',
        author: 'Ottavio Leoni, c. 1621',
        license: 'Public domain',
        attribution: 'Ottavio Leoni, ritratto di Caravaggio, Biblioteca Marucelliana, dominio pubblico, Wikimedia Commons',
        page: 'https://commons.wikimedia.org/wiki/File:Portrait_Caravaggio.jpg'
      },
      documentedJourney: false,
      status: 'published',
      places: [
        { placeRef: 'galleria-borghese', type: 'WORK_PRESERVED', title: 'Collezione Borghese', period: 'oggi', order: 1, certainty: 'documented', verification: 'verified', description: 'Villa Borghese conserva un nucleo straordinario di tele di Caravaggio. È dove si vedono oggi, non la stanza in cui nacquero.', sourceName: 'Galleria Borghese', sourceUrl: 'https://www.galleriaborghese.beniculturali.it/' },
        { placeRef: 'musei-capitolini', type: 'WORK_PRESERVED', title: 'Buona ventura e San Giovanni', period: 'oggi', order: 2, certainty: 'documented', verification: 'verified', description: 'I Musei Capitolini conservano dipinti di Caravaggio. Luogo di eredità museale nel Campidoglio, non un suo domicilio.', sourceName: 'Musei Capitolini', sourceUrl: 'https://www.museicapitolini.org/' },
        { placeRef: 'galleria-degli-uffizi', type: 'WORK_PRESERVED', title: 'Medusa e Bacco', period: 'oggi', order: 3, certainty: 'documented', verification: 'verified', description: 'Gli Uffizi conservano capolavori giovanili di Caravaggio. Firenze qui è un museo, non un capitolo della sua biografia romana.', sourceName: 'Gallerie degli Uffizi', sourceUrl: 'https://www.uffizi.it/' },
        { placeRef: 'pinacoteca-di-brera', type: 'WORK_PRESERVED', title: 'Cena in Emmaus', period: 'oggi', order: 4, certainty: 'documented', verification: 'verified', description: 'La Cena in Emmaus si visita a Brera. È un’opera conservata a Milano, non la prova di un soggiorno milanese.', sourceName: 'Pinacoteca di Brera', sourceUrl: 'https://pinacotecabrera.org/' },
        { placeRef: 'museo-di-capodimonte', type: 'WORK_PRESERVED', title: 'Flagellazione', period: 'oggi', order: 5, certainty: 'documented', verification: 'verified', description: 'Capodimonte conserva la Flagellazione dipinta per Napoli. Caravaggio visse a Napoli; il palazzo borbonico che oggi ospita il quadro è posteriore.', sourceName: 'Museo di Capodimonte', sourceUrl: 'https://capodimonte.cultura.gov.it/' }
      ],
      candidates: [
        { name: 'San Luigi dei Francesi — Cappella Contarelli', city: 'Roma', lat: 41.8996, lon: 12.4748, type: 'CREATED', note: 'Ciclo di San Matteo, eseguito in loco. Assente come scheda autonoma.', sourceName: 'Pio Sodalizio dei Piceni / San Luigi dei Francesi', sourceUrl: 'https://www.saintlouis-rome.net/' },
        { name: 'Santa Maria del Popolo — Cappella Cerasi', city: 'Roma', lat: 41.9116, lon: 12.4764, type: 'CREATED', note: 'Conversione di San Paolo e Crocifissione di San Pietro, in situ. Assente dal catalogo.', sourceName: 'Basilica di Santa Maria del Popolo', sourceUrl: 'https://www.santamariadelpopolo.it/' },
        { name: 'Pio Monte della Misericordia', city: 'Napoli', lat: 40.8513, lon: 14.2603, type: 'CREATED', note: 'Sette opere di Misericordia, eseguita per l’istituzione e ancora in loco.', sourceName: 'Pio Monte della Misericordia', sourceUrl: 'https://www.piomontedellamisericordia.it/' }
      ]
    },
    {
      id: 'person-federico-ii',
      slug: 'federico-ii',
      name: 'Federico II di Svevia',
      birthYear: 1194,
      deathYear: 1250,
      dates: '1194–1250',
      era: 'medioevo',
      eraLabel: 'Medioevo',
      categories: ['Politica', 'Architettura'],
      collections: ['medioevo'],
      shortBio: 'Federico II si visita nel Mezzogiorno svevo: Palermo, Melfi, Castel del Monte. Non è un percorso da fare in giornata: è la geografia di un impero mediterraneo.',
      wikidataId: 'Q130165',
      portrait: {
        url: 'walkatlas-v1-foto/personaggi/federico-ii.jpg',
        source: 'Wikimedia Commons',
        author: 'De arte venandi cum avibus, XIII sec.',
        license: 'Public domain',
        attribution: 'Federico II dal manoscritto De arte venandi cum avibus, dominio pubblico',
        page: 'https://commons.wikimedia.org/wiki/File:Frederick_II_and_eagle.jpg'
      },
      documentedJourney: false,
      status: 'published',
      places: [
        { placeRef: 'palazzo-dei-normanni', type: 'LIVED', title: 'Corte di Palermo', period: 'dal 1198', order: 1, certainty: 'documented', verification: 'verified', description: 'Federico crebbe e tenne corte a Palermo, nel palazzo dei re normanni. È il luogo visibile della sua formazione siciliana.', sourceName: 'Assemblea Regionale Siciliana — Palazzo dei Normanni', sourceUrl: 'https://www.federicosecondo.org/' },
        { placeRef: 'castello-di-melfi', type: 'WORKED', title: 'Costituzioni di Melfi', period: '1231', order: 2, certainty: 'documented', verification: 'verified', description: 'A Melfi Federico promulgò il Liber Augustalis. Il castello è il palazzo in cui si tenne quella legislazione.', sourceName: 'Museo Archeologico Nazionale del Melfese', sourceUrl: 'https://musei.beniculturali.it/' },
        { placeRef: 'castel-del-monte', type: 'CREATED', title: 'Castel del Monte', period: 'c. 1240', order: 3, certainty: 'documented', verification: 'verified', description: 'Castel del Monte fu voluto da Federico II. Non è dimostrato che vi abbia abitato a lungo: è un’architettura di committenza, non un diario di soggiorni.', sourceName: 'Castel del Monte — MiC', sourceUrl: 'https://casteldelmonte.cultura.gov.it/' }
      ],
      candidates: [
        { name: 'Castel Fiorentino', city: 'Torremaggiore / San Severo', lat: 41.772, lon: 15.332, type: 'DEATH', note: 'Qui Federico II morì il 13 dicembre 1250. Ruderi, non ancora in catalogo.', sourceName: 'Treccani — Federico II di Svevia', sourceUrl: 'https://www.treccani.it/enciclopedia/federico-ii-di-svevia-imperatore-e-re-di-sicilia_(Dizionario-Biografico)/' }
      ]
    },
    {
      id: 'person-bernini',
      slug: 'gian-lorenzo-bernini',
      name: 'Gian Lorenzo Bernini',
      birthYear: 1598,
      deathYear: 1680,
      dates: '1598–1680',
      era: 'contemporanea',
      eraLabel: 'Barocco',
      categories: ['Arte', 'Architettura'],
      collections: ['grandi-artisti', 'architetti'],
      shortBio: 'Bernini è la Roma barocca che si visita ancora: Piazza Navona e le sculture di Villa Borghese. San Pietro e Sant’Andrea al Quirinale sono candidati, non schede del catalogo. Non gli si attribuisce la Fontana di Trevi.',
      wikidataId: 'Q160631',
      portrait: {
        url: 'walkatlas-v1-foto/personaggi/gian-lorenzo-bernini.jpg',
        source: 'Wikimedia Commons',
        author: 'Gian Lorenzo Bernini, autoritratto 1623',
        license: 'Public domain',
        attribution: 'Autoritratto di Bernini, 1623, Galleria Borghese, dominio pubblico',
        page: 'https://commons.wikimedia.org/wiki/File:Gian_Lorenzo_Bernini,_self-portrait,_c1623.jpg'
      },
      documentedJourney: false,
      status: 'published',
      places: [
        { placeRef: 'galleria-borghese', type: 'CREATED', title: 'Apollo e Dafne, Ratto di Proserpina', period: '1618–1625 circa', order: 1, certainty: 'documented', verification: 'verified', description: 'Bernini scolpì per Scipione Borghese gruppi che si visitano ancora a Villa Borghese, negli ambienti della collezione che li commissionò.', sourceName: 'Galleria Borghese', sourceUrl: 'https://www.galleriaborghese.beniculturali.it/' },
        { placeRef: 'piazza-navona', type: 'CREATED', title: 'Fontana dei Quattro Fiumi', period: '1648–1651', order: 2, certainty: 'documented', verification: 'verified', description: 'La fontana al centro di Piazza Navona è di Bernini. Il luogo coincide con l’opera: si visita nello spazio urbano per cui fu fatta.', sourceName: 'Sovrintendenza Capitolina', sourceUrl: 'https://www.sovraintendenzaroma.it/' },
        { placeRef: 'museo-nazionale-di-castel-santangelo', type: 'CREATED', title: 'Angeli di Ponte Sant’Angelo', period: '1667–1669', order: 3, certainty: 'documented', verification: 'reviewed', description: 'Bernini disegnò i dieci angeli del ponte che conduce a Castel Sant’Angelo (due autografi, gli altri della bottega). Il museo è il mausoleo al termine di quel ponte, non la scultura stessa.', sourceName: 'Museo Nazionale di Castel Sant’Angelo — MiC', sourceUrl: 'https://castelsantangelo.cultura.gov.it/' }
      ],
      candidates: [
        { name: 'Basilica di San Pietro — baldacchino e colonnato', city: 'Città del Vaticano', lat: 41.9022, lon: 12.4539, type: 'CREATED', note: 'Baldacchino (1624–1633) e colonnato (1656–1667). Assente dal catalogo.', sourceName: 'Basilica di San Pietro', sourceUrl: 'https://www.vatican.va/' },
        { name: 'Sant’Andrea al Quirinale', city: 'Roma', lat: 41.9006, lon: 12.4894, type: 'CREATED', note: 'Chiesa gesuita progettata da Bernini (1658–1670). Assente dal catalogo.', sourceName: 'Turismo Roma — Sant’Andrea al Quirinale', sourceUrl: 'https://www.turismoroma.it/it/luoghi/santandrea-al-quirinale' }
      ]
    }
  ]);

  function bySlug(slug) {
    return people.find(p => p.slug === slug || p.id === slug) || null;
  }

  function resolveRelPlace(rel, lookup) {
    if (!rel || !lookup) return null;
    return lookup(rel.placeRef) || null;
  }

  function linkedPlaces(person, lookup) {
    if (!person) return [];
    const out = [];
    (person.places || []).forEach(rel => {
      const place = resolveRelPlace(rel, lookup);
      if (place) out.push({ place, rel });
    });
    return out.sort((a, b) => (a.rel.order || 0) - (b.rel.order || 0));
  }

  function relationFor(person, placeId, lookup) {
    if (!person) return null;
    const hit = linkedPlaces(person, lookup).find(x => String(x.place.id) === String(placeId) || x.place.slug === placeId);
    return hit ? hit.rel : null;
  }

  function isLinked(person, place, lookup) {
    return Boolean(relationFor(person, place && (place.id || place), lookup));
  }

  function relLabel(type) {
    return REL_LABEL[type] || type;
  }

  function isHeritage(type) {
    return HERITAGE_TYPES.indexOf(type) >= 0;
  }

  function regionSpread(links) {
    const cities = [...new Set(links.map(x => x.place.city).filter(Boolean))];
    const regions = [...new Set(links.map(x => x.place.region).filter(Boolean))];
    return { count: links.length, cities, regions };
  }

  function spreadLine(links) {
    const spread = regionSpread(links);
    const nReg = spread.regions.length;
    const nCity = spread.cities.length;
    const geo = nReg > 1 ? `${nReg} regioni` : (nCity > 1 ? `${nCity} città` : (spread.cities[0] || 'Italia'));
    return `${spread.count} luogh${spread.count === 1 ? 'o' : 'i'} in ${geo} · percorso diffuso`;
  }

  root.WalkatlasPeople = {
    version: 'v1.35-prototype',
    people,
    bySlug,
    linkedPlaces,
    relationFor,
    isLinked,
    relLabel,
    isHeritage,
    regionSpread,
    spreadLine,
    REL_LABEL,
    HERITAGE_TYPES
  };
})(window);
