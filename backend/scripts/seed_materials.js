import prisma from '../src/config/prisma.js';

const materialsData = [
  { name: 'Teak Wood', unit: 'kg', category: 'Wood' },
  { name: 'Rosewood', unit: 'kg', category: 'Wood' },
  { name: 'Sheesham Wood', unit: 'kg', category: 'Wood' },
  { name: 'Mango Wood', unit: 'kg', category: 'Wood' },
  { name: 'Pine Wood', unit: 'kg', category: 'Wood' },
  { name: 'Plywood 18mm', unit: 'sheets', category: 'Wood' },
  { name: 'Plywood 12mm', unit: 'sheets', category: 'Wood' },
  { name: 'Plywood 6mm', unit: 'sheets', category: 'Wood' },
  { name: 'MDF Board 18mm', unit: 'sheets', category: 'Wood' },
  { name: 'MDF Board 12mm', unit: 'sheets', category: 'Wood' },
  { name: 'Blockboard 19mm', unit: 'sheets', category: 'Wood' },
  { name: 'HDF Board', unit: 'sheets', category: 'Wood' },
  { name: 'Particle Board', unit: 'sheets', category: 'Wood' },
  { name: 'Veneer Sheet - Teak', unit: 'sheets', category: 'Wood' },
  { name: 'Veneer Sheet - Walnut', unit: 'sheets', category: 'Wood' },

  { name: 'Fabric - Cotton', unit: 'meters', category: 'Upholstery' },
  { name: 'Fabric - Velvet', unit: 'meters', category: 'Upholstery' },
  { name: 'Fabric - Linen', unit: 'meters', category: 'Upholstery' },
  { name: 'Fabric - Leather', unit: 'sq.ft', category: 'Upholstery' },
  { name: 'Fabric - Faux Leather', unit: 'sq.ft', category: 'Upholstery' },
  { name: 'Foam - High Density', unit: 'kg', category: 'Upholstery' },
  { name: 'Foam - Medium Density', unit: 'kg', category: 'Upholstery' },
  { name: 'Foam - Low Density', unit: 'kg', category: 'Upholstery' },
  { name: 'Foam - Memory Foam', unit: 'kg', category: 'Upholstery' },
  { name: 'Dacron / Fiber Fill', unit: 'kg', category: 'Upholstery' },
  { name: 'Jute Webbing', unit: 'meters', category: 'Upholstery' },
  { name: 'Sinuous Spring', unit: 'pieces', category: 'Upholstery' },
  { name: 'Rubberized Coir Sheet', unit: 'sheets', category: 'Upholstery' },

  { name: 'Wood Screws M4', unit: 'pieces', category: 'Hardware' },
  { name: 'Wood Screws M6', unit: 'pieces', category: 'Hardware' },
  { name: 'Wood Screws M8', unit: 'pieces', category: 'Hardware' },
  { name: 'Nut & Bolt Set M8', unit: 'sets', category: 'Hardware' },
  { name: 'Cam Lock Fittings', unit: 'pieces', category: 'Hardware' },
  { name: 'Drawer Slider 18 inch', unit: 'pairs', category: 'Hardware' },
  { name: 'Drawer Slider 24 inch', unit: 'pairs', category: 'Hardware' },
  { name: 'Soft Close Hinge', unit: 'pieces', category: 'Hardware' },
  { name: 'Piano Hinge', unit: 'pieces', category: 'Hardware' },
  { name: 'Barrel Hinge', unit: 'pieces', category: 'Hardware' },
  { name: 'Furniture Leg - Wooden', unit: 'pieces', category: 'Hardware' },
  { name: 'Furniture Leg - Metal', unit: 'pieces', category: 'Hardware' },
  { name: 'Cabinet Handle - Steel', unit: 'pieces', category: 'Hardware' },
  { name: 'Cabinet Handle - Brass', unit: 'pieces', category: 'Hardware' },
  { name: 'Door Knob', unit: 'pieces', category: 'Hardware' },
  { name: 'Shelf Pin', unit: 'pieces', category: 'Hardware' },
  { name: 'Corner Bracket', unit: 'pieces', category: 'Hardware' },
  { name: 'L Bracket', unit: 'pieces', category: 'Hardware' },
  { name: 'Wardrobe Channel Track', unit: 'meters', category: 'Hardware' },
  { name: 'Glass Door Track', unit: 'meters', category: 'Hardware' },
  { name: 'Caster Wheel - Lockable', unit: 'pieces', category: 'Hardware' },
  { name: 'Caster Wheel - Plain', unit: 'pieces', category: 'Hardware' },
  { name: 'Sofa Leg - Wooden 4inch', unit: 'pieces', category: 'Hardware' },
  { name: 'Sofa Leg - Metal 6inch', unit: 'pieces', category: 'Hardware' },
  { name: 'Bed Slat', unit: 'pieces', category: 'Hardware' },
  { name: 'Bed Center Support Leg', unit: 'pieces', category: 'Hardware' },

  { name: 'Steel Rod 12mm', unit: 'meters', category: 'Metal' },
  { name: 'Steel Pipe 1 inch', unit: 'meters', category: 'Metal' },
  { name: 'Steel Flat Bar 2inch', unit: 'meters', category: 'Metal' },
  { name: 'Aluminum Profile', unit: 'meters', category: 'Metal' },
  { name: 'Glass 4mm Clear', unit: 'sq.ft', category: 'Glass' },
  { name: 'Glass 6mm Clear', unit: 'sq.ft', category: 'Glass' },
  { name: 'Glass 6mm Frosted', unit: 'sq.ft', category: 'Glass' },
  { name: 'Mirror Sheet', unit: 'sq.ft', category: 'Glass' },

  { name: 'Wood Polish - Clear', unit: 'liters', category: 'Finishing' },
  { name: 'Wood Polish - Glossy', unit: 'liters', category: 'Finishing' },
  { name: 'Wood Stain - Walnut', unit: 'liters', category: 'Finishing' },
  { name: 'Wood Stain - Mahogany', unit: 'liters', category: 'Finishing' },
  { name: 'Wood Stain - Ebony', unit: 'liters', category: 'Finishing' },
  { name: 'Wood Primer', unit: 'liters', category: 'Finishing' },
  { name: 'Lacquer - Matte', unit: 'liters', category: 'Finishing' },
  { name: 'Lacquer - Gloss', unit: 'liters', category: 'Finishing' },
  { name: 'PU Coat', unit: 'liters', category: 'Finishing' },
  { name: 'Edge Banding - Teak', unit: 'meters', category: 'Finishing' },
  { name: 'Edge Banding - White', unit: 'meters', category: 'Finishing' },
  { name: 'Sandpaper 80 Grit', unit: 'sheets', category: 'Finishing' },
  { name: 'Sandpaper 120 Grit', unit: 'sheets', category: 'Finishing' },
  { name: 'Sandpaper 220 Grit', unit: 'sheets', category: 'Finishing' },
  { name: 'Wood Filler', unit: 'kg', category: 'Finishing' },
  { name: 'Fevicol / Wood Glue', unit: 'kg', category: 'Finishing' },
  { name: 'Epoxy Adhesive', unit: 'kg', category: 'Finishing' },

  { name: 'Bubble Wrap', unit: 'meters', category: 'Packaging' },
  { name: 'Corrugated Sheet', unit: 'sheets', category: 'Packaging' },
  { name: 'Stretch Film', unit: 'rolls', category: 'Packaging' },
  { name: 'Foam Sheet 10mm', unit: 'sheets', category: 'Packaging' },
  { name: 'Packaging Tape', unit: 'rolls', category: 'Packaging' },
  { name: 'Cardboard Box - Large', unit: 'pieces', category: 'Packaging' }
];

async function main() {
  console.log('Seeding materials...');
  let mCode = 9000;
  for (const mat of materialsData) {
    const existing = await prisma.material.findFirst({
      where: { materialName: mat.name }
    });

    if (!existing) {
      await prisma.material.create({
        data: {
          materialCode: `MAT-${mCode++}`,
          materialName: mat.name,
          category: mat.category,
          unit: mat.unit,
          minimumStock: 10,
          reorderLevel: 20,
          purchasePrice: 100,
          availableStock: 100
        }
      });
      console.log(`Created: ${mat.name}`);
    } else {
      console.log(`Skipped existing: ${mat.name}`);
    }
  }

  const count = await prisma.material.count();
  console.log(`Total materials in DB: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
