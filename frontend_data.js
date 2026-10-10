/* =========================================================================
   data.js — DATA ACCESS LAYER
   -------------------------------------------------------------------------
   Everything in this file is written as if it already talks to a real
   MySQL backend: every exported function is `async` and returns data in
   the exact shape a REST endpoint would. Right now the data comes from
   the in-memory objects below (which mirror the tables in
   /backend/schema.sql). To connect a real backend, replace the body of
   each function with a `fetch()` call — the call sites in the rest of
   the app never need to change. Search this file for "BACKEND HOOK" to
   see exactly where each swap goes.
   ========================================================================= */

const AG_API_BASE = "/api"; // e.g. http://localhost:5000/api once a backend exists

/* ---------------------------------------------------------------------
   MOCK "DATABASE" — mirrors backend/schema.sql tables
   --------------------------------------------------------------------- */

const DB_ANIMAL_CATEGORIES = [
  { id: 1, slug: "poultry", name: "Poultry", icon: "🐔", colorA: "#F0CD94", colorB: "#E3A857", blurb: "Chickens, ducks & turkeys for eggs and meat." },
  { id: 2, slug: "dairy", name: "Dairy", icon: "🐄", colorA: "#D7E4D2", colorB: "#8FAE8B", blurb: "Cattle & buffalo reared for milk production." },
  { id: 3, slug: "goat", name: "Goat Farming", icon: "🐐", colorA: "#F0CD94", colorB: "#B85C38", blurb: "Meat and milk breeds suited to varied climates." },
  { id: 4, slug: "sheep", name: "Sheep Farming", icon: "🐑", colorA: "#D7E4D2", colorB: "#F0CD94", blurb: "Wool and mutton breeds for grassland farms." },
  { id: 5, slug: "piggery", name: "Piggery", icon: "🐖", colorA: "#F0CD94", colorB: "#8FAE8B", blurb: "Fast-growing swine for commercial meat units." },
  { id: 6, slug: "aquaculture", name: "Aquaculture", icon: "🐟", colorA: "#D7E4D2", colorB: "#234A30", blurb: "Fish & prawn farming in ponds and tanks." },
  { id: 7, slug: "beekeeping", name: "Beekeeping", icon: "🐝", colorA: "#F0CD94", colorB: "#E3A857", blurb: "Apiculture for honey, wax and pollination." },
  { id: 8, slug: "rabbit", name: "Rabbitry", icon: "🐇", colorA: "#D7E4D2", colorB: "#B85C38", blurb: "Low-cost, high-turnover meat & fur rearing." },
];

const DB_ANIMALS = [
  // Poultry
  { id: 101, categorySlug: "poultry", slug: "broiler-chicken", name: "Broiler Chicken", icon: "🐓",
    care: "Provide a clean, dry, well-ventilated shed with 1 sq.ft of floor space per bird. Maintain brooder temperature at 32-35°C in week 1, reducing by 3°C weekly.",
    feeding: "Starter feed (22-23% protein) for 0-3 weeks, finisher feed (18-20% protein) afterward. Provide clean water at all times; average feed conversion ratio 1.7-1.9.",
    diseases: "Watch for Newcastle disease, Coccidiosis and Infectious Bronchitis. Vaccinate on schedule and isolate sick birds immediately.",
    housing: "Deep litter or cage system with 4-5cm litter depth (rice husk/wood shavings). Ensure cross-ventilation and predator-proof fencing.",
    breeding: "Commercial broilers are typically sourced as day-old chicks from certified hatcheries rather than bred on-farm.",
    management: "Market-ready in 5-6 weeks at 1.8-2.2kg live weight. Maintain 16 hours of light for optimal feed intake." },
  { id: 102, categorySlug: "poultry", slug: "layer-hen", name: "Layer Hen", icon: "🥚",
    care: "House in well-lit sheds; layers need 14-16 hours of light daily to sustain egg production. Keep stress and noise to a minimum.",
    feeding: "Layer mash with 16-18% protein and adequate calcium (3.5-4%) for strong eggshells. Feed twice daily, roughly 110-120g/bird/day.",
    diseases: "Prone to Fowl Typhoid, Egg Drop Syndrome and internal parasites. Deworm every 3 months and follow the vaccination calendar.",
    housing: "Cage or deep-litter housing with nest boxes (1 per 4-5 hens). Ensure good ventilation to prevent ammonia build-up.",
    breeding: "Hybrid layer breeds (e.g., BV-300, Lohmann Brown) are usually purchased as pullets rather than bred locally.",
    management: "Peak lay begins around 20-22 weeks; production cycle typically runs 72-78 weeks before replacement." },
  { id: 103, categorySlug: "poultry", slug: "duck", name: "Duck (Khaki Campbell)", icon: "🦆",
    care: "Ducks are hardy but need access to water bodies or shallow tanks for natural behaviour and cooling.",
    feeding: "Duck mash or a wet-mash of broken rice, kitchen waste and greens. Provide calcium supplements during laying.",
    diseases: "Generally disease-resistant; watch for duck plague and parasitic worms in wet conditions.",
    housing: "Simple, low-cost sheds with access to a pond; 3-4 sq.ft per bird with fencing to prevent straying.",
    breeding: "Khaki Campbell and Cherry Valley are common; incubation period is about 28 days.",
    management: "Lays 250-300 eggs/year; integrates well with fish farming as an added income stream." },

  // Dairy
  { id: 104, categorySlug: "dairy", slug: "holstein-friesian-cow", name: "Holstein Friesian Cow", icon: "🐄",
    care: "Requires shade, clean bedding and daily grooming. Sensitive to heat — provide fans/sprinklers above 30°C.",
    feeding: "Balanced ration of green fodder, dry fodder and concentrate (16-18% protein) at roughly 1kg concentrate per 2.5L milk yield.",
    diseases: "Watch for mastitis, foot-and-mouth disease and milk fever; follow a strict deworming and vaccination schedule.",
    housing: "Loose housing system with 40 sq.ft per animal and a separate calving pen; good drainage is essential.",
    breeding: "Artificial insemination at 15-18 months of age; gestation period is about 280 days.",
    management: "Peak yield 20-30 litres/day under good management; dry period of 60 days before calving." },
  { id: 105, categorySlug: "dairy", slug: "murrah-buffalo", name: "Murrah Buffalo", icon: "🐃",
    care: "Tolerates heat poorly; wallowing or regular water spraying keeps body temperature in check.",
    feeding: "High-fibre green fodder plus concentrate mix; mineral mixture supports higher fat content in milk.",
    diseases: "Susceptible to Haemorrhagic Septicaemia and mastitis; annual vaccination is recommended.",
    housing: "Well-ventilated shed with a wallowing pond nearby if possible; 35-40 sq.ft per animal.",
    breeding: "First calving around 3-3.5 years; gestation period roughly 310 days.",
    management: "Yields 8-12 litres/day with 6-7% fat content, prized for ghee production." },
  { id: 106, categorySlug: "dairy", slug: "jersey-cow", name: "Jersey Cow", icon: "🐄",
    care: "Compact, heat-tolerant breed; good for smallholder farms with limited grazing land.",
    feeding: "Efficient converter of fodder to milk; needs slightly less concentrate than Holstein Friesian per litre produced.",
    diseases: "Generally hardy; monitor for ketosis around calving and routine parasite control.",
    housing: "Requires less space than larger breeds — around 30 sq.ft per animal with shade.",
    breeding: "Reaches sexual maturity earlier than larger breeds, around 14-15 months.",
    management: "Yields 12-18 litres/day at 4.5-5% fat — excellent for butter and cheese." },

  // Goat
  { id: 107, categorySlug: "goat", slug: "boer-goat", name: "Boer Goat", icon: "🐐",
    care: "Hardy meat breed; needs dry, draft-free shelter and regular hoof trimming.",
    feeding: "Browses well on shrubs and tree leaves; supplement with a concentrate mix during late pregnancy.",
    diseases: "Watch for PPR (Peste des Petits Ruminants) and internal parasites; deworm every 3 months.",
    housing: "Raised slatted-floor housing keeps animals dry and reduces parasite load; 10-12 sq.ft per goat.",
    breeding: "Reaches breeding age at 8-10 months; often twins, with a 150-day gestation.",
    management: "Fast growth rate makes it a preferred meat breed, market-ready in 6-8 months." },
  { id: 108, categorySlug: "goat", slug: "sirohi-goat", name: "Sirohi Goat", icon: "🐐",
    care: "Well adapted to semi-arid Indian conditions; tolerant of heat and low-quality forage.",
    feeding: "Thrives on mixed grazing and tree fodder; minimal concentrate needed.",
    diseases: "Generally hardy; routine vaccination against PPR and enterotoxaemia is advised.",
    housing: "Simple thatched shelters are sufficient; ensure good drainage in the pen.",
    breeding: "Known for good twinning rate; kidding interval of about 8-10 months.",
    management: "Dual-purpose breed valued for both milk and meat in western India." },

  // Sheep
  { id: 109, categorySlug: "sheep", slug: "merino-sheep", name: "Merino Sheep", icon: "🐑",
    care: "Needs dry grazing land; shearing required 1-2 times a year for wool quality.",
    feeding: "Grazes on natural pastures; supplement with mineral blocks for wool health.",
    diseases: "Monitor for foot rot in wet seasons and internal parasites; regular deworming needed.",
    housing: "Open shed with dry flooring; avoid damp bedding which affects fleece.",
    breeding: "Seasonal breeders; gestation period around 150 days.",
    management: "Renowned for fine wool; shearing yield 3-5kg per sheep annually." },
  { id: 110, categorySlug: "sheep", slug: "deccani-sheep", name: "Deccani Sheep", icon: "🐑",
    care: "Well suited to dry, rain-fed regions of the Deccan plateau; low input requirement.",
    feeding: "Grazes on crop stubble and scrubland; minimal supplementary feeding needed.",
    diseases: "Hardy against local diseases; PPR vaccination still recommended.",
    housing: "Basic open enclosures; movable pens support rotational grazing.",
    breeding: "Non-seasonal breeder, allowing flexible lambing schedules.",
    management: "Mainly reared for mutton and coarse wool in Maharashtra and Karnataka." },

  // Piggery
  { id: 111, categorySlug: "piggery", slug: "large-white-yorkshire", name: "Large White Yorkshire", icon: "🐖",
    care: "Needs shade and mud/water access to regulate body temperature; sensitive to direct sun.",
    feeding: "High-energy feed with 16-18% protein; kitchen waste can supplement but should not be the sole diet.",
    diseases: "Watch for swine fever and parasitic infections; strict biosecurity at the farm gate.",
    housing: "Concrete-floored pens with drainage; 8-10 sq.ft per adult pig.",
    breeding: "Sows can farrow twice a year with litters of 8-12 piglets; gestation ~114 days.",
    management: "Popular commercial breed due to fast growth and large litter size." },

  // Aquaculture
  { id: 112, categorySlug: "aquaculture", slug: "rohu-fish", name: "Rohu (Carp)", icon: "🐟",
    care: "Maintain pond depth of 1.5-2m with good oxygenation; monitor water pH (7-8.5) regularly.",
    feeding: "Omnivorous; feed with rice bran, oil cake and formulated pellets at 3-5% body weight daily.",
    diseases: "Watch for fin rot and Argulus infestation; maintain water quality to prevent stress-related disease.",
    housing: "Earthen ponds with proper embankments; stock at 8,000-10,000 fingerlings per hectare.",
    breeding: "Induced breeding using hypophysation in hatcheries; natural breeding needs flowing water.",
    management: "Harvest in 10-12 months at 1-1.5kg; a staple of Indian freshwater aquaculture." },
  { id: 113, categorySlug: "aquaculture", slug: "tiger-prawn", name: "Tiger Prawn", icon: "🦐",
    care: "Requires brackish water with salinity 10-25 ppt and constant aeration.",
    feeding: "Formulated prawn feed with 35-40% protein, fed 4-5 times daily in shallow trays.",
    diseases: "White spot syndrome is the major risk; maintain strict water exchange and quarantine new stock.",
    housing: "Lined ponds with paddle-wheel aerators; stocking density 15-20 PL/sq.m.",
    breeding: "Hatchery-produced post-larvae (PL) are stocked rather than bred on-farm.",
    management: "Harvest in 4-5 months; a major export-oriented aquaculture crop." },

  // Beekeeping
  { id: 114, categorySlug: "beekeeping", slug: "apis-mellifera", name: "European Honeybee", icon: "🐝",
    care: "Place hives away from pesticide-sprayed fields; ensure a nearby water source.",
    feeding: "Bees forage naturally on flowering crops; sugar syrup feeding supports colonies in dearth periods.",
    diseases: "Watch for Nosema disease and wax moth infestation; keep hives clean and well-ventilated.",
    housing: "Langstroth-type wooden hive boxes, ideally spaced 3m apart and shaded from direct sun.",
    breeding: "Queen bees are reared separately or purchased to requeen weakening colonies.",
    management: "Yields 20-25kg honey per hive per year and boosts pollination of nearby crops." },

  // Rabbitry
  { id: 115, categorySlug: "rabbit", slug: "new-zealand-white", name: "New Zealand White Rabbit", icon: "🐇",
    care: "Keep hutches clean, dry and well-ventilated; rabbits are sensitive to heat above 30°C.",
    feeding: "Pelleted feed with 16-18% protein plus fresh greens; always provide clean water.",
    diseases: "Watch for coccidiosis and respiratory infections; keep bedding dry to reduce risk.",
    housing: "Raised wire-mesh cages (2x2x1.5 ft) prevent contact with droppings and parasites.",
    breeding: "Matures at 5-6 months; gestation is about 30 days with litters of 6-8 kits.",
    management: "Fast growth and high feed efficiency make it popular for meat and fur." },
];

const DB_CROP_CATEGORIES = [
  { id: 1, slug: "cereals", name: "Cereals", icon: "🌾", colorA: "#F0CD94", colorB: "#E3A857", blurb: "Staple grain crops like rice, wheat & maize." },
  { id: 2, slug: "pulses", name: "Pulses", icon: "🌱", colorA: "#D7E4D2", colorB: "#8FAE8B", blurb: "Protein-rich legumes such as lentils & gram." },
  { id: 3, slug: "vegetables", name: "Vegetables", icon: "🥕", colorA: "#F0CD94", colorB: "#B85C38", blurb: "Fast-cycle crops for local & market sale." },
  { id: 4, slug: "fruits", name: "Fruits", icon: "🍎", colorA: "#D7E4D2", colorB: "#F0CD94", blurb: "Orchard and perennial fruit crops." },
  { id: 5, slug: "spices", name: "Spices", icon: "🌶️", colorA: "#F0CD94", colorB: "#8FAE8B", blurb: "High-value aromatic and pungent crops." },
  { id: 6, slug: "plantation", name: "Plantation Crops", icon: "🌴", colorA: "#D7E4D2", colorB: "#234A30", blurb: "Long-duration crops like tea, coffee & coconut." },
  { id: 7, slug: "organic", name: "Organic Farming", icon: "🍃", colorA: "#F0CD94", colorB: "#E3A857", blurb: "Chemical-free cultivation practices." },
  { id: 8, slug: "oilseeds", name: "Oilseeds", icon: "🌻", colorA: "#D7E4D2", colorB: "#B85C38", blurb: "Crops grown primarily for edible oil." },
];

const DB_CROPS = [
  // Cereals
  { id: 201, categorySlug: "cereals", slug: "rice", name: "Rice (Paddy)", icon: "🌾",
    growth: "Grows best as a transplanted crop in flooded fields (puddled soil), reaching maturity in 110-150 days depending on variety.",
    climate: "Warm, humid climate with temperatures of 20-37°C and annual rainfall above 1000mm, or assured irrigation.",
    soil: "Clayey or clay-loam soils with good water retention; pH 5.5-6.5 is ideal.",
    fertilizers: "NPK at roughly 100:50:50 kg/ha, applied in split doses at transplanting, tillering and panicle stages.",
    irrigation: "Continuous shallow flooding (2-5cm) through most of the vegetative stage; drain before harvest.",
    pests: "Stem borer, brown planthopper and blast disease are major threats; use resistant varieties and IPM.",
    harvesting: "Harvest when 80% of grains turn golden yellow; sun-dry before storage.",
    season: "Kharif (June-Nov) is the main season; Rabi/summer rice possible with irrigation." },
  { id: 202, categorySlug: "cereals", slug: "wheat", name: "Wheat", icon: "🌿",
    growth: "A rabi cereal that grows through a cool vegetative phase and matures in 110-130 days.",
    climate: "Cool climate for growth (10-15°C) with a warmer, dry period (21-26°C) for ripening.",
    soil: "Well-drained loamy soil with pH 6-7.5; sensitive to waterlogging.",
    fertilizers: "NPK at 120:60:40 kg/ha; nitrogen split between sowing, first irrigation and flowering.",
    irrigation: "4-6 irrigations at critical stages: crown root initiation, tillering, flowering and grain filling.",
    pests: "Aphids, termites and rust diseases are common; timely sowing reduces rust incidence.",
    harvesting: "Harvest when grains are hard and straw turns golden, usually March-April.",
    season: "Rabi season, sown October-December." },
  { id: 203, categorySlug: "cereals", slug: "maize", name: "Maize (Corn)", icon: "🌽",
    growth: "A fast-growing C4 crop maturing in 90-120 days, grown in all three cropping seasons.",
    climate: "Warm season crop, ideal temperature 21-27°C; sensitive to frost.",
    soil: "Well-drained sandy loam to loam soil with pH 5.5-7.5.",
    fertilizers: "NPK at 120:60:40 kg/ha with nitrogen applied in 2-3 split doses.",
    irrigation: "Critical stages are knee-high, tasseling and grain filling; avoid water stress at flowering.",
    pests: "Fall armyworm and stem borer are key pests; shoot fly at early stages.",
    harvesting: "Harvest when husk dries and kernels harden, generally 20-25% grain moisture.",
    season: "Grown in Kharif, Rabi and spring seasons depending on region." },

  // Pulses
  { id: 204, categorySlug: "pulses", slug: "chickpea", name: "Chickpea (Gram)", icon: "🌰",
    growth: "A hardy rabi pulse maturing in 90-120 days with a deep root system for drought tolerance.",
    climate: "Cool, dry climate; frost during flowering can damage yield.",
    soil: "Well-drained loam to clay-loam soil with pH 6-7.5.",
    fertilizers: "Low nitrogen requirement (20 kg/ha) due to nitrogen fixation; phosphorus at 40-60 kg/ha helps nodulation.",
    irrigation: "Mostly rainfed; one irrigation at pod formation improves yield significantly.",
    pests: "Pod borer (Helicoverpa) is the main pest; wilt disease can affect poorly drained fields.",
    harvesting: "Harvest when plants turn yellow-brown and pods rattle when shaken.",
    season: "Rabi season, sown October-November." },
  { id: 205, categorySlug: "pulses", slug: "green-gram", name: "Green Gram (Moong)", icon: "🫘",
    growth: "A short-duration pulse (60-75 days) suited to intercropping and catch-cropping.",
    climate: "Warm climate, 25-35°C; sensitive to waterlogging and frost.",
    soil: "Well-drained sandy loam soil with pH 6.2-7.2.",
    fertilizers: "Low nitrogen (15-20 kg/ha) with phosphorus (40 kg/ha) at sowing.",
    irrigation: "Generally rainfed; light irrigation at flowering and pod stage improves yield.",
    pests: "Yellow mosaic virus (spread by whitefly) is a major concern; use tolerant varieties.",
    harvesting: "Pick pods as they mature since they don't ripen uniformly; 2-3 pickings typical.",
    season: "Grown in Kharif, summer and as a catch crop between rice seasons." },

  // Vegetables
  { id: 206, categorySlug: "vegetables", slug: "tomato", name: "Tomato", icon: "🍅",
    growth: "Transplanted crop reaching first harvest in 60-70 days after transplanting.",
    climate: "Warm climate (20-27°C); flowers may drop above 35°C or below 10°C.",
    soil: "Well-drained sandy loam to loam soil rich in organic matter, pH 6-7.",
    fertilizers: "FYM 20-25 t/ha plus NPK 100:50:50 kg/ha with staggered nitrogen top-dressing.",
    irrigation: "Drip irrigation preferred; irrigate every 4-6 days depending on soil type.",
    pests: "Fruit borer, whitefly (leaf curl virus vector) and early blight are common issues.",
    harvesting: "Harvest at the breaker to light-red stage for market transport; multiple pickings.",
    season: "Grown year-round with appropriate variety selection; peak in Rabi." },
  { id: 207, categorySlug: "vegetables", slug: "onion", name: "Onion", icon: "🧅",
    growth: "Bulb crop taking 100-150 days from transplanting to maturity depending on variety.",
    climate: "Cool climate for vegetative growth, warmer and drier weather for bulb maturation.",
    soil: "Well-drained sandy loam soil rich in organic matter, pH 6-7.5.",
    fertilizers: "NPK at 100:50:50 kg/ha along with sulphur, which improves pungency and storage life.",
    irrigation: "Frequent light irrigation; stop 2-3 weeks before harvest to aid curing.",
    pests: "Thrips and purple blotch disease are major concerns in dry weather.",
    harvesting: "Harvest when leaves yellow and fall over (neck fall); cure in shade before storage.",
    season: "Kharif, late Kharif and Rabi sowings are all practiced across India." },

  // Fruits
  { id: 208, categorySlug: "fruits", slug: "mango", name: "Mango", icon: "🥭",
    growth: "A perennial tree crop that starts bearing commercially from year 4-5, with full bearing by year 8-10.",
    climate: "Tropical to sub-tropical climate; needs a distinct dry period before flowering.",
    soil: "Deep, well-drained loamy soil with pH 5.5-7.5.",
    fertilizers: "Farmyard manure plus NPK applied after harvest and before flowering, dosage scaled with tree age.",
    irrigation: "Young trees need regular watering; mature trees need irrigation mainly during fruit development.",
    pests: "Mango hopper, fruit fly and powdery mildew during flowering are key concerns.",
    harvesting: "Harvest at the mature-green stage for transport, ripened off-tree; hand-pick with a short stalk.",
    season: "Flowering in winter, harvest mainly April-June depending on region." },
  { id: 209, categorySlug: "fruits", slug: "banana", name: "Banana", icon: "🍌",
    growth: "Herbaceous perennial reaching harvest 10-12 months after planting suckers/tissue-culture plantlets.",
    climate: "Warm, humid climate (26-30°C); sensitive to strong winds and frost.",
    soil: "Deep, well-drained fertile loam rich in organic matter, pH 6.5-7.5.",
    fertilizers: "Heavy feeder — needs high potassium along with nitrogen and phosphorus, applied in monthly splits.",
    irrigation: "Drip irrigation recommended; requires frequent watering, especially during bunch development.",
    pests: "Sigatoka leaf spot and banana weevil borer are major threats; Panama wilt in susceptible varieties.",
    harvesting: "Harvest bunches at 75-80% maturity (rounded fingers) and ripen off-plant.",
    season: "Planted year-round in irrigated areas; harvest continuous once established." },

  // Spices
  { id: 210, categorySlug: "spices", slug: "chilli", name: "Chilli", icon: "🌶️",
    growth: "Transplanted crop with first harvest 75-90 days after transplanting; multiple pickings over the season.",
    climate: "Warm climate (20-30°C); excess rain during flowering reduces fruit set.",
    soil: "Well-drained sandy loam to loam soil rich in organic matter, pH 6-7.",
    fertilizers: "NPK at 100:50:50 kg/ha with nitrogen in split doses to sustain repeated harvests.",
    irrigation: "Drip or furrow irrigation every 7-10 days; avoid waterlogging.",
    pests: "Thrips, mites and fruit borer are common; leaf curl virus spread by whitefly/mites is a major risk.",
    harvesting: "Pick green chillies as needed or let mature red for dry chilli; harvest every 10-15 days.",
    season: "Grown in Kharif and Rabi depending on region and irrigation availability." },
  { id: 211, categorySlug: "spices", slug: "turmeric", name: "Turmeric", icon: "🫚",
    growth: "Rhizome crop with an 8-9 month duration from planting to harvest.",
    climate: "Warm, humid climate (20-30°C) with well-distributed rainfall.",
    soil: "Well-drained loamy soil rich in organic matter, pH 5-7.5.",
    fertilizers: "Heavy organic matter application plus NPK 60:50:120 kg/ha with high potassium for rhizome quality.",
    irrigation: "Regular irrigation at 7-10 day intervals; mulching helps retain soil moisture.",
    pests: "Rhizome rot and leaf blotch in waterlogged conditions; shoot borer during the growing season.",
    harvesting: "Harvest when leaves yellow and dry; rhizomes are boiled, dried and polished after digging.",
    season: "Planted at the onset of monsoon (May-June), harvested in Jan-March." },

  // Plantation
  { id: 212, categorySlug: "plantation", slug: "coconut", name: "Coconut", icon: "🥥",
    growth: "Long-duration perennial; starts bearing in 5-6 years, full yield by year 10-15.",
    climate: "Tropical coastal climate with high humidity and temperature 27-32°C.",
    soil: "Sandy loam to laterite soils with good drainage; tolerant of coastal saline conditions.",
    fertilizers: "Annual application of organic manure with NPK, split before and after monsoon.",
    irrigation: "Basin irrigation weekly in dry season for young palms; mature palms are more drought-tolerant.",
    pests: "Rhinoceros beetle and red palm weevil are major pests; bud rot in wet conditions.",
    harvesting: "Harvest nuts every 45-60 days once mature, identified by a change in husk colour.",
    season: "Planting at monsoon onset; harvesting is continuous through the year." },
  { id: 213, categorySlug: "plantation", slug: "tea", name: "Tea", icon: "🍵",
    growth: "Perennial shrub pruned to a low bush; first plucking begins 3-4 years after planting.",
    climate: "Cool, humid hill climate with well-distributed rainfall above 1500mm.",
    soil: "Acidic, well-drained soil (pH 4.5-5.5) rich in organic matter, typically on sloped terrain.",
    fertilizers: "Regular nitrogen-rich fertilizer application after each plucking round.",
    irrigation: "Mostly rainfed in traditional tea belts; supplementary irrigation in drier zones.",
    pests: "Tea mosquito bug and red spider mite are common; blister blight in high-humidity periods.",
    harvesting: "Pluck the tender two leaves and a bud every 7-10 days during the growing season.",
    season: "Continuous plucking cycle through the growing months, peaking after monsoon." },

  // Organic
  { id: 214, categorySlug: "organic", slug: "organic-vegetables", name: "Organic Mixed Vegetables", icon: "🥬",
    growth: "Grown using crop rotation and intercropping to build soil health without synthetic inputs.",
    climate: "Varies by vegetable; organic practice focuses more on soil and pest management than climate change.",
    soil: "Soil enriched continuously with compost, vermicompost and green manure to maintain fertility naturally.",
    fertilizers: "Only organic inputs allowed: farmyard manure, compost, vermicompost, neem cake and biofertilizers.",
    irrigation: "Drip irrigation preferred to conserve water and reduce weed growth between rows.",
    pests: "Managed through neem-based biopesticides, pheromone traps and companion planting rather than chemicals.",
    harvesting: "Harvest by hand at peak freshness; shorter shelf life needs quicker post-harvest handling.",
    season: "Rotational cropping calendar planned across Kharif, Rabi and summer for continuous supply." },

  // Oilseeds
  { id: 215, categorySlug: "oilseeds", slug: "groundnut", name: "Groundnut (Peanut)", icon: "🥜",
    growth: "A 100-130 day crop that develops pods underground after pegging (pollinated flowers burrow into soil).",
    climate: "Warm climate (25-30°C) with moderate rainfall; sensitive to waterlogging.",
    soil: "Well-drained sandy loam soil, ideal for pod development, pH 6-6.5.",
    fertilizers: "Modest nitrogen (20 kg/ha) due to nitrogen fixation; gypsum application aids pod filling.",
    irrigation: "Critical irrigation at pegging and pod development stages; avoid excess water at sowing.",
    pests: "Leaf miner and Tikka leaf spot disease are common threats.",
    harvesting: "Harvest when leaves yellow and pods show a dark inner shell colour; dry well before storage.",
    season: "Grown in both Kharif and summer/Rabi (irrigated) seasons." },
  { id: 216, categorySlug: "oilseeds", slug: "mustard", name: "Mustard", icon: "🌼",
    growth: "A rabi oilseed maturing in 110-140 days, often intercropped with wheat or chickpea.",
    climate: "Cool, dry climate; frost during flowering can reduce seed set.",
    soil: "Well-drained loamy soil, pH 6-7.5; moderately tolerant of saline soils.",
    fertilizers: "NPK at 60:40:40 kg/ha with sulphur, which notably improves oil content.",
    irrigation: "1-2 irrigations at pre-flowering and pod development stages if rainfall is insufficient.",
    pests: "Aphids and painted bug are major pests; Alternaria blight in humid conditions.",
    harvesting: "Harvest when pods turn yellow-brown, before they shatter and shed seed.",
    season: "Rabi season, sown October-November." },
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal"
];

// A small curated set of location-based recommendations (mirrors a
// `location_recommendations` table keyed by state).
const DB_LOCATION_RECOMMENDATIONS = {
  "Kerala": { climate: "Humid tropical", topCrops: ["Coconut", "Rubber", "Spices (Pepper, Cardamom)", "Rice"], topAnimals: ["Dairy (Crossbred cattle)", "Poultry", "Aquaculture (Backwater fisheries)"], tip: "Coconut-based mixed farming with intercropped spices performs well on the coastal laterite soils." },
  "Punjab": { climate: "Semi-arid, hot summers & cold winters", topCrops: ["Wheat", "Rice", "Mustard"], topAnimals: ["Dairy (Murrah Buffalo)", "Poultry"], tip: "The wheat-rice rotation dominates; consider dairy buffalo to diversify income and use crop residue." },
  "Maharashtra": { climate: "Semi-arid to tropical wet", topCrops: ["Cotton", "Sugarcane", "Onion", "Pulses"], topAnimals: ["Goat Farming", "Sheep Farming", "Dairy"], tip: "Drought-tolerant goat and sheep rearing complements rain-fed cropping in the Deccan plateau." },
  "Punjab": { climate: "Semi-arid", topCrops: ["Wheat", "Rice"], topAnimals: ["Dairy"], tip: "" },
  "Tamil Nadu": { climate: "Tropical, monsoon-dependent", topCrops: ["Rice", "Sugarcane", "Banana", "Turmeric"], topAnimals: ["Poultry", "Goat Farming", "Aquaculture"], tip: "Delta regions favour rice-based systems; uplands do well with banana and turmeric intercropping." },
  "Rajasthan": { climate: "Arid to semi-arid", topCrops: ["Mustard", "Pulses (Moong/Gram)", "Groundnut"], topAnimals: ["Sheep Farming", "Goat Farming", "Beekeeping"], tip: "Hardy sheep and goat breeds suit the arid grazing land; mustard is a reliable rabi oilseed." },
  "West Bengal": { climate: "Humid subtropical", topCrops: ["Rice", "Jute", "Vegetables"], topAnimals: ["Aquaculture", "Poultry", "Dairy"], tip: "High rainfall and river deltas make fish-rice integrated farming particularly productive." },
  "Karnataka": { climate: "Varied — coastal, plateau & dry zones", topCrops: ["Coffee", "Rice", "Maize", "Spices"], topAnimals: ["Poultry", "Dairy", "Beekeeping"], tip: "Western Ghats districts suit plantation crops; the dry Deccan interior favours millets and goat rearing." },
  "Uttar Pradesh": { climate: "Subtropical, monsoon-influenced", topCrops: ["Wheat", "Rice", "Sugarcane"], topAnimals: ["Dairy (Buffalo)", "Poultry"], tip: "The Indo-Gangetic plain supports intensive wheat-rice cropping alongside buffalo dairying." },
};

/* ---------------------------------------------------------------------
   AUTH (localStorage stands in for a users table + session store)
   BACKEND HOOK: replace the two functions below with:
     await fetch(`${AG_API_BASE}/auth/signup`, {method:'POST', body: JSON.stringify(payload)})
     await fetch(`${AG_API_BASE}/auth/login`,  {method:'POST', body: JSON.stringify(payload)})
   and keep the session token returned by the server instead of localStorage.
   --------------------------------------------------------------------- */
const AUTH_USERS_KEY = "ag_users_db";     // mimics the `users` MySQL table
const AUTH_SESSION_KEY = "ag_session";    // mimics a server session/JWT

function _readUsersTable() {
  return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || "[]");
}
function _writeUsersTable(rows) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(rows));
}

async function agSignup({ name, email, password, farmType }) {
  // BACKEND HOOK: POST to /api/auth/signup — server should hash the
  // password (bcrypt) and INSERT INTO users(...) VALUES(...).
  await _fakeLatency();
  const users = _readUsersTable();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with this email already exists.");
  }
  const newUser = { id: Date.now(), name, email, password, farmType: farmType || "General", createdAt: new Date().toISOString() };
  users.push(newUser);
  _writeUsersTable(users);
  return { id: newUser.id, name, email };
}

async function agLogin({ email, password }) {
  // BACKEND HOOK: POST to /api/auth/login — server should verify the
  // hashed password and return a signed session token / JWT.
  await _fakeLatency();
  const users = _readUsersTable();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!found) throw new Error("Invalid email or password.");
  return { id: found.id, name: found.name, email: found.email };
}

function agSetSession(user) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
}
function agGetSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)); } catch { return null; }
}
function agLogout() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  window.location.href = "auth.html";
}
/** Redirects to auth.html if there is no active session. Call at the
 *  top of every page that requires login. */
function agRequireAuth() {
  const user = agGetSession();
  if (!user) { window.location.href = "auth.html"; }
  return user;
}

function _fakeLatency() {
  return new Promise(res => setTimeout(res, 350));
}

/* ---------------------------------------------------------------------
   PUBLIC DATA API — used by every page's JS controller
   --------------------------------------------------------------------- */
async function getAnimalCategories() {
  // BACKEND HOOK: return fetch(`${AG_API_BASE}/animal-categories`).then(r=>r.json())
  await _fakeLatency();
  return DB_ANIMAL_CATEGORIES;
}
async function getAnimalCategoryBySlug(slug) {
  await _fakeLatency();
  return DB_ANIMAL_CATEGORIES.find(c => c.slug === slug) || null;
}
async function getAnimalsByCategory(categorySlug) {
  // BACKEND HOOK: fetch(`${AG_API_BASE}/animals?category=${categorySlug}`)
  await _fakeLatency();
  return DB_ANIMALS.filter(a => a.categorySlug === categorySlug);
}
async function getAnimalBySlug(slug) {
  // BACKEND HOOK: fetch(`${AG_API_BASE}/animals/${slug}`)
  await _fakeLatency();
  return DB_ANIMALS.find(a => a.slug === slug) || null;
}

async function getCropCategories() {
  await _fakeLatency();
  return DB_CROP_CATEGORIES;
}
async function getCropCategoryBySlug(slug) {
  await _fakeLatency();
  return DB_CROP_CATEGORIES.find(c => c.slug === slug) || null;
}
async function getCropsByCategory(categorySlug) {
  await _fakeLatency();
  return DB_CROPS.filter(c => c.categorySlug === categorySlug);
}
async function getCropBySlug(slug) {
  await _fakeLatency();
  return DB_CROPS.find(c => c.slug === slug) || null;
}

async function getIndianStates() {
  await _fakeLatency();
  return INDIAN_STATES;
}
async function getLocationRecommendation(state, locationText) {
  // BACKEND HOOK: fetch(`${AG_API_BASE}/recommendations?state=${state}&location=${locationText}`)
  await _fakeLatency();
  const rec = DB_LOCATION_RECOMMENDATIONS[state];
  if (!rec) return null;
  return { state, locationText, ...rec };
}
