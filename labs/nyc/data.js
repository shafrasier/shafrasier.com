// ─────────────────────────────────────────────────────────────────────────
// MAP / NYC — curated dataset (lab prototype, v2).
// Categories are one-word, matching the MAP's house style, and their colors are
// the PROPOSED "places" family — chosen to avoid every existing MAP category
// color (greens, teal, reds, golds, burgundy, purples, blues). Studios keep the
// INDUSTRY slate they already wear in the graph.
// ─────────────────────────────────────────────────────────────────────────

const CATEGORIES = {
  Venues:    { color: "#b85c38" }, // rust — proposed PLACES/VENUES
  Studios:   { color: "#5a7a9a" }, // slate — existing INDUSTRY color
  Streets:   { color: "#c08552" }, // copper — proposed PLACES/STREETS
  Homes:     { color: "#7a4a26" }, // umber — proposed PLACES/HOMES
  Landmarks: { color: "#75685a" }, // stone — proposed PLACES/LANDMARKS
};

const SITES = [
  // ── Greenwich Village ──
  { name: "Café Wha?", cat: "Venues", lat: 40.730093, lng: -74.000570, from: 1959, to: null,
    addr: "115 MacDougal St", hood: "Greenwich Village",
    blurb: "The basement room where a just-arrived Bob Dylan played his first New York sets in 1961 — and where Jimi Hendrix held a 1966 residency as Jimmy James.",
    note: "/map/MUSIC/SCENES/Greenwich-Village-folk-scene" },
  { name: "The Gaslight Cafe", cat: "Venues", lat: 40.730180, lng: -74.000510, from: 1958, to: 1971,
    addr: "116 MacDougal St", hood: "Greenwich Village",
    blurb: "Basket-house centerpiece of the folk revival; Dylan's 1962 Gaslight tapes caught the scene mid-transformation.",
    note: "/map/MUSIC/SCENES/Greenwich-Village-folk-scene" },
  { name: "Gerde's Folk City", cat: "Venues", lat: 40.729680, lng: -73.995640, from: 1960, to: 1987,
    addr: "11 W 4th St", hood: "Greenwich Village",
    blurb: "Dylan's first paid New York gig — April 1961, opening for John Lee Hooker. The room where the folk revival professionalized.",
    note: "/map/MUSIC/SCENES/Greenwich-Village-folk-scene" },
  { name: "Village Vanguard", cat: "Venues", lat: 40.736000, lng: -74.001660, from: 1935, to: null,
    addr: "178 7th Ave S", hood: "Greenwich Village",
    blurb: "The longest-running jazz room on earth; Coltrane, Bill Evans, and Sonny Rollins all cut canonical live records in its wedge-shaped basement." },
  { name: "The Bitter End", cat: "Venues", lat: 40.727680, lng: -73.999440, from: 1961, to: null,
    addr: "147 Bleecker St", hood: "Greenwich Village",
    blurb: "Folk and singer-songwriter proving ground from the revival through the '70s troubadours." },
  { name: "Café Society", cat: "Venues", lat: 40.732800, lng: -74.002600, from: 1938, to: 1948,
    addr: "1 Sheridan Sq", hood: "Greenwich Village",
    blurb: "New York's first deliberately integrated nightclub — where Billie Holiday first sang “Strange Fruit” in 1939." },
  { name: "Electric Lady Studios", cat: "Studios", lat: 40.732600, lng: -73.998600, from: 1970, to: null,
    addr: "52 W 8th St", hood: "Greenwich Village",
    blurb: "The studio Hendrix built and barely lived to use; Stevie Wonder's '70s runs and Patti Smith's Horses followed." },

  // ── Downtown: Bowery, SoHo, Tribeca ──
  { name: "CBGB", cat: "Venues", lat: 40.724700, lng: -73.991900, from: 1973, to: 2006,
    addr: "315 Bowery", hood: "East Village",
    blurb: "Country, bluegrass, and blues by name; Ramones, Television, Patti Smith, Blondie, and Talking Heads in fact." },
  { name: "Max's Kansas City", cat: "Venues", lat: 40.736600, lng: -73.988600, from: 1965, to: 1981,
    addr: "213 Park Ave S", hood: "Union Square",
    blurb: "Warhol's back room and proto-punk's front room — the Velvet Underground's last stand with Lou Reed, summer 1970." },
  { name: "Fillmore East", cat: "Venues", lat: 40.727900, lng: -73.988200, from: 1968, to: 1971,
    addr: "105 2nd Ave", hood: "East Village",
    blurb: "Bill Graham's East Coast church of the live double-LP — the Allman Brothers recorded rock's definitive live album here in 1971." },
  { name: "The Loft (David Mancuso's)", cat: "Venues", lat: 40.726800, lng: -73.996200, from: 1970, to: 1974,
    addr: "647 Broadway", hood: "NoHo",
    blurb: "Invitation-only rent parties with the best sound system in the city — the seed of disco and of every DJ culture after it." },
  { name: "Paradise Garage", cat: "Venues", lat: 40.728300, lng: -74.005900, from: 1977, to: 1987,
    addr: "84 King St", hood: "SoHo",
    blurb: "Larry Levan's room: the sound system as an instrument, the DJ as author — “garage” house carries its name." },
  { name: "Mudd Club", cat: "Venues", lat: 40.717600, lng: -74.003100, from: 1978, to: 1983,
    addr: "77 White St", hood: "Tribeca",
    blurb: "No wave and art-punk's clubhouse — downtown's deliberately scuzzy answer to uptown disco glamour." },

  // ── Midtown: Tin Pan Alley → Brill → 52nd St ──
  { name: "Tin Pan Alley", cat: "Streets", lat: 40.745800, lng: -73.989700, from: 1885, to: 1929,
    addr: "W 28th St between 5th & Broadway", hood: "NoMad",
    blurb: "The block of publishers' offices where American popular song became an industry — pluggers hammering pianos out every window.",
    note: "/map/MUSIC/GENRES/POP/Tin-Pan-Alley" },
  { name: "Brill Building", cat: "Studios", lat: 40.761600, lng: -73.984200, from: 1931, to: null,
    addr: "1619 Broadway", hood: "Midtown",
    blurb: "Songwriting's vertical factory: Leiber & Stoller, Pomus & Shuman, Bacharach & David stacked floor over floor.",
    note: "/map/MUSIC/GENRES/POP/Brill-Building" },
  { name: "1650 Broadway (Aldon Music)", cat: "Studios", lat: 40.762200, lng: -73.983900, from: 1958, to: 1966,
    addr: "1650 Broadway", hood: "Midtown",
    blurb: "Don Kirshner's Aldon Music — Goffin & King and Mann & Weil writing the teen-pop canon a block from the Brill itself.",
    note: "/map/MUSIC/GENRES/POP/Brill-Building" },
  { name: "52nd Street — “Swing Street”", cat: "Streets", lat: 40.760900, lng: -73.977700, from: 1933, to: 1955,
    addr: "W 52nd St between 5th & 6th", hood: "Midtown",
    blurb: "One brownstone block of clubs — Onyx, Three Deuces, Famous Door — where swing went small-group and bebop went public." },
  { name: "Birdland", cat: "Venues", lat: 40.762700, lng: -73.983500, from: 1949, to: 1965,
    addr: "1678 Broadway", hood: "Midtown",
    blurb: "Named for Charlie Parker, eulogized by Shearing's “Lullaby of Birdland” — bebop's flagship room." },
  { name: "Studio 54", cat: "Venues", lat: 40.764900, lng: -73.983600, from: 1977, to: 1980,
    addr: "254 W 54th St", hood: "Midtown",
    blurb: "Disco's velvet-rope cathedral — thirty-three months that fixed the image of nightlife as spectacle." },
  { name: "Atlantic Records", cat: "Studios", lat: 40.765900, lng: -73.981900, from: 1947, to: 1959,
    addr: "234 W 56th St", hood: "Midtown",
    blurb: "The office that became a studio after dark — desks stacked against the wall for Ray Charles and Big Joe Turner sessions." },
  { name: "Columbia 30th Street Studio", cat: "Studios", lat: 40.742500, lng: -73.979800, from: 1948, to: 1981,
    addr: "207 E 30th St", hood: "Kips Bay",
    blurb: "“The Church” — a deconsecrated sanctuary with the most loved room sound in record-making; Kind of Blue was cut here in 1959." },
  { name: "Columbia Studio A", cat: "Studios", lat: 40.763800, lng: -73.982400, from: 1955, to: 1970,
    addr: "799 7th Ave", hood: "Midtown",
    blurb: "Where Dylan plugged in on tape — the “Like a Rolling Stone” sessions, June 1965." },
  { name: "The Power Station", cat: "Studios", lat: 40.766300, lng: -73.989500, from: 1977, to: null,
    addr: "441 W 53rd St", hood: "Hell's Kitchen",
    blurb: "Chic's home base — Rodgers & Edwards' grooves, then Bowie's Let's Dance, in a converted Con Ed substation." },
  { name: "The Hit Factory", cat: "Studios", lat: 40.766000, lng: -73.987900, from: 1975, to: 2005,
    addr: "421 W 54th St", hood: "Hell's Kitchen",
    blurb: "Lennon and Ono's Double Fantasy sessions ran here in 1980 — his last recordings." },

  // ── Harlem & Uptown ──
  { name: "Apollo Theater", cat: "Venues", lat: 40.810000, lng: -73.950000, from: 1934, to: null,
    addr: "253 W 125th St", hood: "Harlem",
    blurb: "Amateur Night made careers from Ella Fitzgerald (1934) onward; James Brown's 1962 live LP made the room itself famous." },
  { name: "Minton's Playhouse", cat: "Venues", lat: 40.804600, lng: -73.952200, from: 1938, to: 1974,
    addr: "210 W 118th St", hood: "Harlem",
    blurb: "Bebop's laboratory — Monk in the house band, Parker and Gillespie rewriting harmony at the after-hours cutting sessions." },
  { name: "Savoy Ballroom", cat: "Venues", lat: 40.817500, lng: -73.937800, from: 1926, to: 1958,
    addr: "596 Lenox Ave", hood: "Harlem",
    blurb: "The block-long, integrated “Home of Happy Feet” — birthplace of the Lindy Hop; Chick Webb's band beat Benny Goodman's here in 1937." },
  { name: "Cotton Club", cat: "Venues", lat: 40.819000, lng: -73.936800, from: 1923, to: 1936,
    addr: "644 Lenox Ave", hood: "Harlem",
    blurb: "Ellington's 1927–31 residency broadcast Harlem to America — from a club whose audience was whites-only by policy." },
  { name: "Audubon Ballroom", cat: "Venues", lat: 40.840000, lng: -73.940100, from: 1912, to: 1980,
    addr: "3940 Broadway", hood: "Washington Heights",
    blurb: "Uptown's grand dance hall for big bands and Latin orchestras — and the site of Malcolm X's assassination in 1965." },

  // ── The Bronx ──
  { name: "1520 Sedgwick Ave", cat: "Landmarks", lat: 40.844700, lng: -73.927800, from: 1973, to: null,
    addr: "1520 Sedgwick Ave", hood: "The South Bronx",
    blurb: "August 11, 1973: DJ Kool Herc's back-to-school party in the rec room — the date hip-hop gives itself as a birthday." },
  { name: "Disco Fever", cat: "Venues", lat: 40.835500, lng: -73.918200, from: 1976, to: 1986,
    addr: "167th St & Jerome Ave (approx.)", hood: "The South Bronx",
    blurb: "The first club to put rap DJs and MCs on the marquee — hip-hop's first professional home." },

  // ── Brooklyn & Queens ──
  { name: "Marcy Houses", cat: "Homes", lat: 40.697600, lng: -73.947800, from: 1969, to: null,
    addr: "Marcy Ave, Bed-Stuy", hood: "Bedford-Stuyvesant",
    blurb: "The towers Jay-Z wrote into hip-hop's geography — Brooklyn's answer to the Bronx origin story." },
  { name: "226 St. James Place", cat: "Homes", lat: 40.689200, lng: -73.963800, from: 1972, to: 1997,
    addr: "226 St. James Pl", hood: "Clinton Hill",
    blurb: "The Notorious B.I.G.'s block — Ready to Die's whole sound-world is this stretch of Brooklyn." },
  { name: "Hollis Ave & 205th St", cat: "Streets", lat: 40.713200, lng: -73.762000, from: 1980, to: 1990,
    addr: "Hollis Ave around 205th St", hood: "Hollis",
    blurb: "Run-DMC's home turf — where hip-hop put on a black hat and Adidas and conquered the suburbs from the suburbs." },
  { name: "Addisleigh Park", cat: "Homes", lat: 40.696000, lng: -73.764000, from: 1935, to: 1965,
    addr: "St. Albans, Queens", hood: "St. Albans",
    blurb: "The jazz aristocracy's enclave — Count Basie, Ella Fitzgerald, Lena Horne, and later James Brown all kept houses here." },

  // ── Chelsea / misc landmarks ──
  { name: "Hotel Chelsea", cat: "Landmarks", lat: 40.744400, lng: -73.996700, from: 1884, to: null,
    addr: "222 W 23rd St", hood: "Chelsea",
    blurb: "Dylan wrote in room 211, Cohen memorialized room 424, Patti Smith and Mapplethorpe shared its smallest room — the song-filled flophouse of record." },
  { name: "Danceteria", cat: "Venues", lat: 40.741200, lng: -73.991700, from: 1979, to: 1986,
    addr: "30 W 21st St", hood: "Flatiron",
    blurb: "Four floors of post-punk, video lounges, and dance floors — Madonna's first stage, 1982." },
  { name: "Webster Hall", cat: "Venues", lat: 40.731700, lng: -73.989000, from: 1886, to: null,
    addr: "125 E 11th St", hood: "East Village",
    blurb: "From anarchists' balls to RCA's 1950s live-recording hall to the rave era — the city's longest-serving big room." },
];

// One story per neighborhood, keyed to the polygon names in neighborhoods.geojson
// (official NTA boundaries, merged where the cultural neighborhood spans several).
// Each will eventually link to its PLACES/NEIGHBORHOODS note; none exist yet.
const NEIGHBORHOOD_STORIES = {
  "Greenwich Village": {
    story: "Bohemia's home office: the folk revival's coffeehouse grid in the '50s and '60s, MacDougal Street above all, then Electric Lady and the singer-songwriters.",
    note: "/map/MUSIC/SCENES/Greenwich-Village-folk-scene" },
  "East Village": {
    story: "Skid-row real estate met art-school ambition: the Fillmore East's rock church, then CBGB's three-chord republic on the Bowery, then no wave's deliberate ruins.",
    note: null },
  "Lower East Side": {
    story: "The tenement district whose Yiddish theaters and song publishers fed Tin Pan Alley its first generation of writers — the Gershwins and Irving Berlin grew up on these blocks.",
    note: null },
  "SoHo": {
    story: "Lofts emptied by deindustrialization became the dance underground's private rooms: Mancuso's Loft on Broadway, then Levan's Paradise Garage on King Street.",
    note: null },
  "Chelsea": {
    story: "The Hotel Chelsea's century of songwriters anchors the neighborhood; Danceteria gave downtown's post-punk crowd four floors to collide on.",
    note: null },
  "Harlem": {
    story: "The capital of Black America's nightlife century: rent parties and stride piano, the Cotton Club and the Savoy in the '20s and '30s, bebop hatching at Minton's in the '40s, the Apollo running through all of it.",
    note: null },
  "Washington Heights": {
    story: "Uptown's grand ballroom district — the Audubon hosted big bands and Latin orchestras for decades — and later the cradle of merengue and bachata in New York.",
    note: null },
  "The South Bronx": {
    story: "Out of the fires of the '70s: block parties, sound systems, breakbeats — hip-hop assembling itself from turntables and park jams between Sedgwick Avenue and Jerome.",
    note: null },
  "Bedford-Stuyvesant": {
    story: "Brooklyn's '90s renaissance ran through Bed-Stuy: Jay-Z's Marcy mythology, Biggie's corner-eye reportage from the Clinton Hill border, a borough taking the crown from the Bronx.",
    note: null },
  "Clinton Hill": {
    story: "Biggie's actual block — 226 St. James Place — sits here, on the quiet brownstone side of the Bed-Stuy line that Ready to Die turned into a sound-world.",
    note: null },
  "Hollis": {
    story: "Run-DMC, LL Cool J, and Ja Rule all came up within a few blocks of Hollis Avenue — the neighborhood that gave hip-hop its suburban-Queens swagger.",
    note: null },
  "St. Albans": {
    story: "Addisleigh Park's jazz aristocracy — Basie, Ella, Lena Horne, James Brown — made this the rare neighborhood where the canon literally lived next door to itself.",
    note: null },
};

// Era chips for the time scrubber. `note` links to the closest MAP note where one
// exists; null reads as "note coming".
const ERAS = [
  { name: "Tin Pan Alley",      from: 1885, to: 1929, note: "/map/MUSIC/GENRES/POP/Tin-Pan-Alley" },
  { name: "Harlem nights",      from: 1923, to: 1943, note: null },
  { name: "Swing St & bebop",   from: 1933, to: 1955, note: null },
  { name: "Folk Village",       from: 1947, to: 1965, note: "/map/MUSIC/SCENES/Greenwich-Village-folk-scene" },
  { name: "The Brill decade",   from: 1958, to: 1966, note: "/map/MUSIC/GENRES/POP/Brill-Building" },
  { name: "Downtown rock",      from: 1965, to: 1975, note: null },
  { name: "Dance underground",  from: 1970, to: 1987, note: null },
  { name: "Punk Bowery",        from: 1973, to: 1982, note: null },
  { name: "Hip-hop's boroughs", from: 1973, to: 1995, note: null },
];
