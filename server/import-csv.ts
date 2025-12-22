import fs from 'fs';
import path from 'path';
import { db } from './db';
import { places } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface CSVPlace {
  name: string;
  overview: string;
  googleMapsUrl: string;
  address: string;
  distanceMiles: string;
  driveTime: string;
  category: string;
  subcategory: string;
  keyHighlights: string;
  insiderTips: string;
  entryFee: string;
  averageSpend: string;
  bestSeasons: string;
  bestDay: string;
  parkingAvailability: string;
  parking: string;
  evCharging: string;
  accessibilityNotes: string;
  googleRating: string;
  tripadvisorRating: string;
  overallSentiment: string;
  nearbyRestaurant1: string;
  nearbyRestaurant2: string;
  nearbyRestaurant3: string;
  averageVisitDuration: string;
  teenInterest: string;
  upcomingEvents: string;
  sourcePlatform: string;
  timeAdded: string;
  researchSources: string;
  visited: string;
  visitNotes: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

function parseRestaurant(text: string): { name: string; description: string; distance?: string } | null {
  if (!text || text.trim() === '') return null;
  
  const parts = text.split(' - ');
  if (parts.length >= 2) {
    const name = parts[0].trim();
    const rest = parts.slice(1).join(' - ');
    const distanceMatch = rest.match(/(\d+(?:\.\d+)?\s*(?:mi|mile|miles|minute|min|minutes|drive))/i);
    return {
      name,
      description: rest.replace(/,?\s*\d+(?:\.\d+)?\s*(?:mi|mile|miles|minute|min|minutes|drive)\s*(?:away|drive)?\.?/gi, '').trim(),
      distance: distanceMatch ? distanceMatch[1] : undefined
    };
  }
  return { name: text.trim(), description: '' };
}

function parseRating(text: string): string | null {
  if (!text) return null;
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : null;
}

function parseNumber(text: string): number | null {
  if (!text) return null;
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

function parseDriveTime(text: string): number | null {
  if (!text) return null;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

const imageMap: Record<string, string> = {
  'Sky Zone Trampoline Park - South Plainfield': '/images/sky_zone_trampoline__b2b43907.jpg',
  'Tree Escape Adventure Park': '/images/adventure_park_zipli_d7f77244.jpg',
  'Turtle Back Zoo': '/images/zoo_animals_family_g_bf100abc.jpg',
  'iPlay America': '/images/indoor_amusement_par_0711bcaa.jpg',
  'Ninja Kidz Action Park': '/images/ninja_obstacle_cours_54441990.jpg',
  'Holland Ridge Farms': '/images/tulip_flower_farm_sp_ec662570.jpg',
  'Jennifer Chalsty Planetarium': '/images/planetarium_dome_sta_bd7f3ca9.jpg',
  'Big Bear Gear Tubing Center': '/images/river_tubing_summer__d63d0a63.jpg',
  'Liberty Science Center': '/images/science_museum_inter_08cf7f73.jpg',
  'White Deer Plaza': '/images/lake_boardwalk_sunse_ec36093d.jpg',
  'Mercer Labs': '/images/immersive_digital_ar_3e2cf727.jpg',
  'Sesame Place Philadelphia': '/images/sesame_street_theme__6eb577be.jpg',
  'Fonty\'s Deli + Dukaan': '/images/delicatessen_cafe_co_d42dcd4c.jpg',
  'TreEscape Aerial Adventure Park': '/images/treetop_adventure_zi_6b0d9a83.jpg',
  'Darlington County Park': '/images/swimming_lake_beach__4c4a20f3.jpg',
  'Highlands Natural Pool': '/images/natural_swimming_poo_a319ea2e.jpg',
  'Please Touch Museum': '/images/children_museum_play_aadb7d82.jpg',
  'Pochuck Boardwalk': '/images/wooden_boardwalk_nat_19446e46.jpg',
  'Mountain Creek Zip Tours': '/images/mountain_zipline_adv_05df36b9.jpg',
  'Adventure Aquarium': '/images/aquarium_sharks_unde_c8aeb6d6.jpg',
  'Grounds For Sculpture': '/images/sculpture_garden_out_8ffaa6d4.jpg',
};

async function importCSV() {
  const csvPath = path.join(process.cwd(), 'attached_assets/Places_of_Interest_-_Sheet1_1766376428557.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  
  const header = parseCSVLine(lines[0]);
  console.log('Headers:', header.slice(0, 10));
  
  await db.delete(places);
  console.log('Cleared existing places');
  
  const seenNames = new Set<string>();
  let imported = 0;
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = parseCSVLine(lines[i]);
    if (values.length < 20) continue;
    
    const name = values[0];
    if (!name || seenNames.has(name)) continue;
    seenNames.add(name);
    
    const nearbyRestaurants: Array<{ name: string; description: string; distance?: string }> = [];
    const r1 = parseRestaurant(values[21]);
    const r2 = parseRestaurant(values[22]);
    const r3 = parseRestaurant(values[23]);
    if (r1) nearbyRestaurants.push(r1);
    if (r2) nearbyRestaurants.push(r2);
    if (r3) nearbyRestaurants.push(r3);
    
    const placeData = {
      name: values[0],
      overview: values[1],
      googleMapsUrl: values[2],
      address: values[3],
      distanceMiles: values[4] || null,
      driveTimeMinutes: parseDriveTime(values[5]),
      category: values[6],
      subcategory: values[7],
      keyHighlights: values[8],
      insiderTips: values[9],
      entryFee: values[10],
      averageSpend: parseNumber(values[11]),
      bestSeasons: values[12],
      bestDay: values[13],
      parkingInfo: values[15] || values[14],
      evCharging: values[16],
      googleRating: parseRating(values[18]),
      tripadvisorRating: parseRating(values[19]),
      overallSentiment: values[20],
      nearbyRestaurants,
      averageVisitDuration: values[24],
      upcomingEvents: values[26],
      researchSources: values[29],
      visited: values[30]?.toLowerCase() === 'true' || values[30]?.toLowerCase() === 'yes',
      userNotes: values[31],
      imageUrl: imageMap[name] || null,
    };
    
    try {
      await db.insert(places).values(placeData);
      console.log(`Imported: ${name}`);
      imported++;
    } catch (err) {
      console.error(`Error importing ${name}:`, err);
    }
  }
  
  console.log(`\nImported ${imported} places`);
  process.exit(0);
}

importCSV().catch(console.error);
