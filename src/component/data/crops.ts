export interface Crop {
  id: string;
  name: string;
  icon: string;
  soil: string[];
  season: string;
  tempMin: number;
  tempMax: number;
  rainfallMin: number;
  rainfallMax: number;
  description: string;
  yieldEstimate: string;
  growthDays: number;
  marketPrice: number; // per quintal demo
}

export const crops: Crop[] = [
  { id: "rice", name: "Rice", icon: "🌾", soil: ["Clay", "Loamy"], season: "Kharif", tempMin: 20, tempMax: 37, rainfallMin: 100, rainfallMax: 200, description: "Staple cereal crop grown in flooded paddies. Requires warm climate and abundant water.", yieldEstimate: "40-60 quintals/hectare", growthDays: 120, marketPrice: 2040 },
  { id: "wheat", name: "Wheat", icon: "🌾", soil: ["Loamy", "Clay Loam"], season: "Rabi", tempMin: 10, tempMax: 25, rainfallMin: 25, rainfallMax: 75, description: "Major cereal grain for bread and chapati. Thrives in cool, dry conditions.", yieldEstimate: "30-50 quintals/hectare", growthDays: 135, marketPrice: 2275 },
  { id: "cotton", name: "Cotton", icon: "🏵️", soil: ["Black", "Loamy"], season: "Kharif", tempMin: 21, tempMax: 35, rainfallMin: 50, rainfallMax: 100, description: "Cash crop for textile industry. Needs warm temperatures and moderate rainfall.", yieldEstimate: "15-25 quintals/hectare", growthDays: 160, marketPrice: 6620 },
  { id: "maize", name: "Maize", icon: "🌽", soil: ["Loamy", "Sandy Loam"], season: "Kharif", tempMin: 18, tempMax: 32, rainfallMin: 50, rainfallMax: 100, description: "Versatile cereal used for food, feed, and industrial products.", yieldEstimate: "50-70 quintals/hectare", growthDays: 100, marketPrice: 2090 },
  { id: "soybean", name: "Soybean", icon: "🫘", soil: ["Loamy", "Clay Loam"], season: "Kharif", tempMin: 20, tempMax: 30, rainfallMin: 60, rainfallMax: 100, description: "Protein-rich oilseed crop. Fixes nitrogen in soil.", yieldEstimate: "15-25 quintals/hectare", growthDays: 100, marketPrice: 4600 },
  { id: "groundnut", name: "Groundnut", icon: "🥜", soil: ["Sandy Loam", "Red"], season: "Kharif", tempMin: 22, tempMax: 35, rainfallMin: 50, rainfallMax: 75, description: "Major oilseed and snack crop. Prefers well-drained sandy soils.", yieldEstimate: "15-20 quintals/hectare", growthDays: 110, marketPrice: 5850 },
  { id: "sugarcane", name: "Sugarcane", icon: "🎋", soil: ["Loamy", "Clay Loam"], season: "Kharif", tempMin: 20, tempMax: 38, rainfallMin: 75, rainfallMax: 150, description: "Tall perennial grass for sugar production. Requires tropical climate.", yieldEstimate: "600-800 quintals/hectare", growthDays: 330, marketPrice: 315 },
  { id: "barley", name: "Barley", icon: "🌿", soil: ["Loamy", "Sandy Loam"], season: "Rabi", tempMin: 5, tempMax: 20, rainfallMin: 25, rainfallMax: 50, description: "Hardy cereal crop for food and brewing. Drought tolerant.", yieldEstimate: "25-35 quintals/hectare", growthDays: 130, marketPrice: 1735 },
  { id: "mustard", name: "Mustard", icon: "🌼", soil: ["Loamy", "Sandy Loam"], season: "Rabi", tempMin: 10, tempMax: 25, rainfallMin: 25, rainfallMax: 50, description: "Important oilseed crop. Yellow flowers create scenic fields.", yieldEstimate: "10-15 quintals/hectare", growthDays: 120, marketPrice: 5650 },
  { id: "chickpea", name: "Chickpea", icon: "🫛", soil: ["Loamy", "Sandy Loam"], season: "Rabi", tempMin: 10, tempMax: 25, rainfallMin: 25, rainfallMax: 50, description: "Major pulse crop rich in protein. Drought tolerant.", yieldEstimate: "12-18 quintals/hectare", growthDays: 110, marketPrice: 5440 },
  { id: "peas", name: "Peas", icon: "🫛", soil: ["Loamy", "Clay Loam"], season: "Rabi", tempMin: 7, tempMax: 20, rainfallMin: 30, rainfallMax: 60, description: "Cool season legume. Rich in protein and fiber.", yieldEstimate: "10-15 quintals/hectare", growthDays: 90, marketPrice: 5500 },
  { id: "oats", name: "Oats", icon: "🌾", soil: ["Loamy", "Clay"], season: "Rabi", tempMin: 5, tempMax: 18, rainfallMin: 25, rainfallMax: 50, description: "Cereal grain valued for nutrition. Used for food and fodder.", yieldEstimate: "20-30 quintals/hectare", growthDays: 120, marketPrice: 2500 },
  { id: "tomato", name: "Tomato", icon: "🍅", soil: ["Loamy", "Sandy Loam"], season: "Kharif/Rabi", tempMin: 18, tempMax: 30, rainfallMin: 40, rainfallMax: 60, description: "High-value vegetable crop. Versatile in cooking and processing.", yieldEstimate: "200-350 quintals/hectare", growthDays: 75, marketPrice: 1500 },
  { id: "potato", name: "Potato", icon: "🥔", soil: ["Sandy Loam", "Loamy"], season: "Rabi", tempMin: 10, tempMax: 22, rainfallMin: 30, rainfallMax: 60, description: "Staple tuber crop. Third most important food crop globally.", yieldEstimate: "200-300 quintals/hectare", growthDays: 90, marketPrice: 1200 },
  { id: "onion", name: "Onion", icon: "🧅", soil: ["Loamy", "Sandy Loam"], season: "Rabi/Kharif", tempMin: 13, tempMax: 28, rainfallMin: 35, rainfallMax: 55, description: "Essential vegetable with high market demand. Multiple seasons.", yieldEstimate: "150-250 quintals/hectare", growthDays: 100, marketPrice: 1800 },
  { id: "sunflower", name: "Sunflower", icon: "🌻", soil: ["Loamy", "Black"], season: "Kharif/Rabi", tempMin: 18, tempMax: 30, rainfallMin: 40, rainfallMax: 70, description: "Oilseed crop with bright yellow flowers. Good bee forage.", yieldEstimate: "10-15 quintals/hectare", growthDays: 95, marketPrice: 6760 },
  { id: "bajra", name: "Bajra (Pearl Millet)", icon: "🌿", soil: ["Sandy", "Sandy Loam"], season: "Kharif", tempMin: 25, tempMax: 40, rainfallMin: 25, rainfallMax: 60, description: "Drought-resistant millet. Staple in arid regions.", yieldEstimate: "15-25 quintals/hectare", growthDays: 80, marketPrice: 2500 },
  { id: "jowar", name: "Jowar (Sorghum)", icon: "🌿", soil: ["Black", "Red", "Loamy"], season: "Kharif/Rabi", tempMin: 25, tempMax: 38, rainfallMin: 40, rainfallMax: 80, description: "Important millet crop. Heat and drought tolerant grain.", yieldEstimate: "20-30 quintals/hectare", growthDays: 110, marketPrice: 3180 },
];

export const soilTypes = ["Sandy", "Sandy Loam", "Loamy", "Clay Loam", "Clay", "Black", "Red"];
export const seasons = ["Kharif", "Rabi", "Kharif/Rabi"];

