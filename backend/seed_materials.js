import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const testMaterials = [
  { materialName: 'Teak Wood',          unit: 'CFT',     category: 'Wood' },
  { materialName: 'Plywood 18mm',       unit: 'Sheets', category: 'Wood' },
  { materialName: 'MDF Board',          unit: 'Sheets', category: 'Wood' },
  { materialName: 'Fabric - Cotton',    unit: 'Meters', category: 'Upholstery' },
  { materialName: 'Foam - High Density',unit: 'Kg',     category: 'Upholstery' },
  { materialName: 'Steel Rod 12mm',     unit: 'Meters', category: 'Hardware' },
  { materialName: 'Wood Screws M6',     unit: 'Pieces', category: 'Hardware' },
  { materialName: 'Piano Hinge',        unit: 'Pieces', category: 'Hardware' },
  { materialName: 'Drawer Slider',      unit: 'Pairs',  category: 'Hardware' },
  { materialName: 'Sandpaper 220 Grit', unit: 'Sheets', category: 'Finish' },
  { materialName: 'Wood Polish',        unit: 'Liters', category: 'Finish' },
  { materialName: 'Wood Stain - Walnut',unit: 'Liters', category: 'Finish' },
];

async function seedMaterials() {
  console.log('--- SEEDING TEST MATERIALS ---');
  let mCode = 8000;
  
  for (const mat of testMaterials) {
    const exists = await prisma.material.findFirst({
      where: { materialName: mat.materialName }
    });
    
    if (!exists) {
      await prisma.material.create({
        data: {
          materialCode: `MAT-${mCode++}`,
          materialName: mat.materialName,
          category: mat.category,
          unit: mat.unit,
          minimumStock: 10,
          reorderLevel: 20,
          purchasePrice: 150,
          availableStock: 500
        }
      });
      console.log(`Created: ${mat.materialName}`);
    } else {
      console.log(`Skipped (Already exists): ${mat.materialName}`);
    }
  }
  
  const count = await prisma.material.count();
  console.log(`\nTotal Materials in Database: ${count}`);
}

seedMaterials()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
