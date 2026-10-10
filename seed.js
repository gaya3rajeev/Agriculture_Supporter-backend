const fs = require("fs");
const vm = require("vm");
const pool = require("./db");

const src = fs.readFileSync("./frontend_data.js", "utf8");
const D = vm.runInNewContext(
  src + "\n;({DB_ANIMAL_CATEGORIES,DB_ANIMALS,DB_CROP_CATEGORIES,DB_CROPS})",
  {}
);

const RAIN = {
  rice: [1000, 2500, "High"], wheat: [400, 1000, "Moderate"], maize: [500, 800, "Moderate"],
  groundnut: [500, 1000, "Moderate"], coconut: [1300, 2500, "Moderate"], tea: [1500, 3000, "High"],
  banana: [1200, 2500, "High"], turmeric: [1000, 2000, "Moderate"],
};

const EXTRA_CAT = { slug: "cash-crops", name: "Cash Crops", icon: "💰", colorA: "#F0CD94", colorB: "#E3A857", blurb: "Crops grown mainly for sale, like cotton and sugarcane." };
const EXTRA_CROPS = [
  { categorySlug: "spices", slug: "black-pepper", name: "Black Pepper", icon: "⚫", growth: "Climbing vine needing shade and support", climate: "Warm / humid", soil: "Laterite / loam", fertilizers: "Organic manure plus NPK", irrigation: "Irrigate in dry months", pests: "Quick wilt, pollu beetle", harvesting: "Pick when berries turn red", season: "Perennial", r: [1500, 3000, "Moderate"] },
  { categorySlug: "plantation", slug: "coffee-arabica", name: "Coffee Arabica", icon: "☕", growth: "Shade grown on highlands", climate: "Cool / humid", soil: "Acidic well-drained", fertilizers: "Organic manure plus NPK", irrigation: "Blossom showers, irrigate in dry spell", pests: "White stem borer, leaf rust", harvesting: "Pick ripe red cherries", season: "Perennial", r: [1500, 2500, "Moderate"] },
  { categorySlug: "plantation", slug: "rubber", name: "Rubber", icon: "🌳", growth: "Hot humid, no waterlogging", climate: "Hot / humid", soil: "Deep laterite / loam", fertilizers: "NPK twice a year", irrigation: "Mostly rainfed", pests: "Abnormal leaf fall", harvesting: "Tapping from year 6-7", season: "Perennial", r: [2000, 3000, "Moderate"] },
  { categorySlug: "cash-crops", slug: "cotton", name: "Cotton", icon: "☁️", growth: "Long warm season", climate: "Warm / semi-arid", soil: "Black soil", fertilizers: "NPK 80:40:40 kg/ha", irrigation: "Irrigate at flowering and boll formation", pests: "Bollworm, whitefly", harvesting: "Pick bolls in several rounds", season: "Kharif", r: [500, 1000, "Moderate"] },
  { categorySlug: "cash-crops", slug: "sugarcane", name: "Sugarcane", icon: "🎋", growth: "Warm weather, high water need", climate: "Warm / humid", soil: "Deep loam", fertilizers: "NPK 250:100:120 kg/ha", irrigation: "Frequent irrigation", pests: "Shoot borer, red rot", harvesting: "Harvest at 10-12 months", season: "Annual / perennial", r: [1500, 2500, "High"] },
  { categorySlug: "oilseeds", slug: "soybean", name: "Soybean", icon: "🫛", growth: "Warm weather, well-drained soil", climate: "Warm", soil: "Well-drained loam / black", fertilizers: "Phosphorus, seed inoculation", irrigation: "Irrigate at pod filling", pests: "Girdle beetle, rust", harvesting: "Harvest when pods turn brown", season: "Kharif", r: [600, 1000, "Moderate"] },
  { categorySlug: "vegetables", slug: "potato", name: "Potato", icon: "🥔", growth: "Cool weather for tuber growth", climate: "Cool", soil: "Sandy loam", fertilizers: "NPK 120:80:100 kg/ha", irrigation: "Light frequent irrigation", pests: "Late blight, aphids", harvesting: "Harvest when vines dry", season: "Rabi", r: [500, 750, "Moderate"] },
];
const EXTRA_ANIMALS = [
  { categorySlug: "goat", slug: "malabari-goat", name: "Malabari Goat", icon: "🐐", climate: "Warm humid, adapted to Kerala", water: "Low", care: "Deworm regularly", feeding: "Leaves, grass and concentrate", diseases: "PPR, worm infestation", housing: "Raised platform shed", breeding: "Breeds twice in 2 years", management: "Separate kids after 3 months" },
];

const CROP_SUIT = [
  [1,"rice","Highly Suitable","Waterlogged lowland and high rainfall favour rice"],
  [1,"coconut","Suitable","Humid climate supports coconut"],
  [1,"banana","Suitable","Warm climate and fertile soils support banana"],
  [1,"black-pepper","Moderately Suitable","Suitable climate but site drainage matters"],
  [3,"coconut","Highly Suitable","Coastal sandy soil and humidity favour coconut"],
  [4,"groundnut","Suitable","Semi-arid conditions support groundnut"],
  [4,"soybean","Suitable","Warm climate and soils suit soybean"],
  [5,"tea","Highly Suitable","Cool humid highland conditions favour tea"],
  [5,"coffee-arabica","Highly Suitable","Highland climate suitable for coffee"],
  [6,"coffee-arabica","Highly Suitable","Wayanad highland environment supports coffee"],
  [6,"black-pepper","Suitable","Humid climate supports pepper"],
  [7,"rice","Highly Suitable","Kuttanad conditions strongly favour rice"],
  [7,"coconut","Suitable","Coconut suitable on uplands and bunds"],
  [8,"rice","Highly Suitable","Saline-tolerant Pokkali rice suits these lands"],
  [10,"wheat","Highly Suitable","Cool rabi season and alluvial soils favour wheat"],
  [10,"rice","Suitable","Irrigated alluvial areas support rice"],
  [11,"soybean","Highly Suitable","Black soils and semi-arid climate favour soybean"],
  [11,"cotton","Suitable","Black soil supports cotton"],
  [13,"rice","Highly Suitable","Alluvial plains with high water favour rice"],
  [13,"potato","Suitable","Cool winters support potato"],
  [14,"wheat","Highly Suitable","Canal irrigation supports rabi wheat"],
  [14,"cotton","Suitable","Hot dry season with irrigation suits cotton"],
];
const LIVE_SUIT = [
  [1,"jersey-cow","Highly Suitable","Humid region with established dairy potential"],
  [1,"malabari-goat","Highly Suitable","Malabari goat is well adapted to Kerala"],
  [1,"duck","Suitable","Waterlogged lowlands support duck rearing"],
  [5,"malabari-goat","Suitable","Goat farming adaptable to highland conditions"],
  [6,"malabari-goat","Suitable","Suitable small-livestock option"],
  [7,"duck","Highly Suitable","Wetlands traditionally support duck farming"],
  [7,"rohu-fish","Suitable","Abundant water supports freshwater fish"],
  [10,"murrah-buffalo","Highly Suitable","Punjab is a major buffalo dairy region"],
  [10,"jersey-cow","Highly Suitable","Dairy supported by fodder and irrigation"],
  [11,"jersey-cow","Suitable","Cattle can be kept with managed feed and water"],
  [13,"rohu-fish","Suitable","Freshwater aquaculture where water resources permit"],
];

(async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "TRUNCATE recommendation, location_crop_suitability, location_livestock_suitability, crop, crop_category, livestock, livestock_category RESTART IDENTITY CASCADE"
    );

    const cropCatId = {};
    for (const c of [...D.DB_CROP_CATEGORIES, EXTRA_CAT]) {
      const r = await client.query(
        "INSERT INTO crop_category (category_name, description, slug, icon, color_a, color_b, blurb) VALUES ($1,$2,$3,$4,$5,$6,$2) RETURNING crop_category_id",
        [c.name, c.blurb, c.slug, c.icon, c.colorA, c.colorB]
      );
      cropCatId[c.slug] = r.rows[0].crop_category_id;
    }

    const liveCatId = {};
    for (const c of D.DB_ANIMAL_CATEGORIES) {
      const r = await client.query(
        "INSERT INTO livestock_category (category_name, description, slug, icon, color_a, color_b, blurb) VALUES ($1,$2,$3,$4,$5,$6,$2) RETURNING livestock_category_id",
        [c.name, c.blurb, c.slug, c.icon, c.colorA, c.colorB]
      );
      liveCatId[c.slug] = r.rows[0].livestock_category_id;
    }

    const cropId = {};
    for (const c of [...D.DB_CROPS, ...EXTRA_CROPS]) {
      const rain = c.r || RAIN[c.slug] || [null, null, null];
      const r = await client.query(
        `INSERT INTO crop (crop_category_id, crop_name, growth_conditions, climate, soil, min_rainfall_mm, max_rainfall_mm,
          water_requirement, fertilizer, irrigation, pest_management, harvesting, season, slug, icon)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING crop_id`,
        [cropCatId[c.categorySlug], c.name, c.growth, c.climate, c.soil, rain[0], rain[1], rain[2],
         c.fertilizers, c.irrigation, c.pests, c.harvesting, c.season, c.slug, c.icon]
      );
      cropId[c.slug] = r.rows[0].crop_id;
    }

    const liveId = {};
    for (const a of [...D.DB_ANIMALS, ...EXTRA_ANIMALS]) {
      const r = await client.query(
        `INSERT INTO livestock (livestock_category_id, animal_name, climate_requirement, water_requirement,
          feeding, housing, diseases, care, breeding, management, slug, icon)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING livestock_id`,
        [liveCatId[a.categorySlug], a.name, a.climate || null, a.water || null,
         a.feeding, a.housing, a.diseases, a.care, a.breeding, a.management, a.slug, a.icon]
      );
      liveId[a.slug] = r.rows[0].livestock_id;
    }

    for (const [loc, slug, s, why] of CROP_SUIT) {
      await client.query(
        "INSERT INTO location_crop_suitability (location_id, crop_id, suitability, reason) VALUES ($1,$2,$3,$4)",
        [loc, cropId[slug], s, why]
      );
    }
    for (const [loc, slug, s, why] of LIVE_SUIT) {
      await client.query(
        "INSERT INTO location_livestock_suitability (location_id, livestock_id, suitability, reason) VALUES ($1,$2,$3,$4)",
        [loc, liveId[slug], s, why]
      );
    }

    await client.query("COMMIT");
    console.log("Done! crops:", Object.keys(cropId).length, "animals:", Object.keys(liveId).length);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Seed failed, nothing was changed:", e.message);
  } finally {
    client.release();
    await pool.end();
  }
})();