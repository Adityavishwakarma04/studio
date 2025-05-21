import { NextResponse, type NextRequest } from 'next/server';

// Mock data representing possible plant detections
const mockPlantDatabase = [
  { name: "Monstera Deliciosa", scientificName: "Monstera deliciosa", keywords: ["monstera", "swiss cheese"] },
  { name: "Fiddle Leaf Fig", scientificName: "Ficus lyrata", keywords: ["fiddle leaf", "ficus"] },
  { name: "Snake Plant", scientificName: "Dracaena trifasciata", keywords: ["snake plant", "mother-in-laws tongue"] },
  { name: "Peace Lily", scientificName: "Spathiphyllum wallisii", keywords: ["peace lily", "spathiphyllum"] },
  { name: "Spider Plant", scientificName: "Chlorophytum comosum", keywords: ["spider plant", "airplane plant"] },
  { name: "ZZ Plant", scientificName: "Zamioculcas zamiifolia", keywords: ["zz plant", "zanzibar gem"] },
  { name: "Pothos", scientificName: "Epipremnum aureum", keywords: ["pothos", "devils ivy"] },
  { name: "Rubber Plant", scientificName: "Ficus elastica", keywords: ["rubber plant", "ficus elastica"] },
  { name: "Aloe Vera", scientificName: "Aloe barbadensis miller", keywords: ["aloe vera", "medicinal aloe"] },
  { name: "Succulent Echeveria", scientificName: "Echeveria spp.", keywords: ["echeveria", "succulent"] }
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json({ message: 'No image file provided.' }, { status: 400 });
    }

    // Simulate image processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Simulate plant detection
    // For this mock, we'll randomly pick 1 to 3 plants from our database
    const numberOfDetections = Math.floor(Math.random() * 3) + 1; // 1 to 3 detections
    const detectedPlants: { name: string; count: number; scientificName: string }[] = [];
    const availablePlants = [...mockPlantDatabase];

    for (let i = 0; i < numberOfDetections; i++) {
      if (availablePlants.length === 0) break;
      const randomIndex = Math.floor(Math.random() * availablePlants.length);
      const plant = availablePlants.splice(randomIndex, 1)[0]; // Remove selected plant to avoid duplicates
      detectedPlants.push({
        name: plant.name,
        count: Math.floor(Math.random() * 3) + 1, // Random count 1-3
        scientificName: plant.scientificName,
      });
    }
    
    // Simulate a small chance of no detection
    if (Math.random() < 0.1 && detectedPlants.length > 0) { // 10% chance to override with no detections IF plants were detected
         return NextResponse.json({ detectedPlants: [] });
    }


    if (detectedPlants.length === 0) {
       // If after random selection, still no plants, pick one default to ensure some result
       const defaultPlant = mockPlantDatabase[Math.floor(Math.random() * mockPlantDatabase.length)];
       detectedPlants.push({
        name: defaultPlant.name,
        count: 1,
        scientificName: defaultPlant.scientificName,
       });
    }


    return NextResponse.json({ detectedPlants });

  } catch (error) {
    console.error('Error processing image upload:', error);
    return NextResponse.json({ message: 'Internal server error while processing image.' }, { status: 500 });
  }
}
