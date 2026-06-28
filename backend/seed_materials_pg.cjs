const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const testMaterials = [
  { materialName: 'Teak Wood',          unit: 'kg',     category: 'Wood' },
  { materialName: 'Rosewood',           unit: 'kg',     category: 'Wood' },
  { materialName: 'Sheesham Wood',      unit: 'kg',     category: 'Wood' },
  { materialName: 'Mango Wood',         unit: 'kg',     category: 'Wood' },
  { materialName: 'Pine Wood',          unit: 'kg',     category: 'Wood' },
  { materialName: 'Plywood 18mm',       unit: 'sheets', category: 'Wood' },
  { materialName: 'Plywood 12mm',       unit: 'sheets', category: 'Wood' },
  { materialName: 'Plywood 6mm',        unit: 'sheets', category: 'Wood' },
  { materialName: 'MDF Board 18mm',     unit: 'sheets', category: 'Wood' },
  { materialName: 'MDF Board 12mm',     unit: 'sheets', category: 'Wood' },
  { materialName: 'Blockboard 19mm',    unit: 'sheets', category: 'Wood' },
  { materialName: 'HDF Board',          unit: 'sheets', category: 'Wood' },
  { materialName: 'Particle Board',     unit: 'sheets', category: 'Wood' },
  { materialName: 'Veneer Sheet - Teak',unit: 'sheets', category: 'Wood' },
  { materialName: 'Veneer Sheet - Walnut',unit: 'sheets',category: 'Wood' },

  { materialName: 'Fabric - Cotton',    unit: 'meters', category: 'Upholstery' },
  { materialName: 'Fabric - Velvet',    unit: 'meters', category: 'Upholstery' },
  { materialName: 'Fabric - Linen',     unit: 'meters', category: 'Upholstery' },
  { materialName: 'Fabric - Leather',   unit: 'sq.ft',  category: 'Upholstery' },
  { materialName: 'Fabric - Faux Leather',unit: 'sq.ft',category: 'Upholstery' },
  { materialName: 'Foam - High Density',unit: 'kg',     category: 'Upholstery' },
  { materialName: 'Foam - Medium Density',unit:'kg',    category: 'Upholstery' },
  { materialName: 'Foam - Low Density', unit: 'kg',     category: 'Upholstery' },
  { materialName: 'Foam - Memory Foam', unit: 'kg',     category: 'Upholstery' },
  { materialName: 'Dacron / Fiber Fill',unit: 'kg',     category: 'Upholstery' },
  { materialName: 'Jute Webbing',       unit: 'meters', category: 'Upholstery' },
  { materialName: 'Sinuous Spring',     unit: 'pieces', category: 'Upholstery' },
  { materialName: 'Rubberized Coir Sheet',unit: 'sheets',category: 'Upholstery' },

  { materialName: 'Wood Screws M4',     unit: 'pieces', category: 'Hardware' },
  { materialName: 'Wood Screws M6',     unit: 'pieces', category: 'Hardware' },
  { materialName: 'Wood Screws M8',     unit: 'pieces', category: 'Hardware' },
  { materialName: 'Nut & Bolt Set M8',  unit: 'sets',   category: 'Hardware' },
  { materialName: 'Cam Lock Fittings',  unit: 'pieces', category: 'Hardware' },
  { materialName: 'Drawer Slider 18 inch',unit: 'pairs',category: 'Hardware' },
  { materialName: 'Drawer Slider 24 inch',unit: 'pairs',category: 'Hardware' },
  { materialName: 'Soft Close Hinge',   unit: 'pieces', category: 'Hardware' },
  { materialName: 'Piano Hinge',        unit: 'pieces', category: 'Hardware' },
  { materialName: 'Barrel Hinge',       unit: 'pieces', category: 'Hardware' },
  { materialName: 'Furniture Leg - Wooden',unit: 'pieces',category: 'Hardware' },
  { materialName: 'Furniture Leg - Metal',unit: 'pieces',category: 'Hardware' },
  { materialName: 'Cabinet Handle - Steel',unit: 'pieces',category: 'Hardware' },
  { materialName: 'Cabinet Handle - Brass',unit: 'pieces',category: 'Hardware' },
  { materialName: 'Door Knob',          unit: 'pieces', category: 'Hardware' },
  { materialName: 'Shelf Pin',          unit: 'pieces', category: 'Hardware' },
  { materialName: 'Corner Bracket',     unit: 'pieces', category: 'Hardware' },
  { materialName: 'L Bracket',          unit: 'pieces', category: 'Hardware' },
  { materialName: 'Wardrobe Channel Track',unit: 'meters',category: 'Hardware' },
  { materialName: 'Glass Door Track',   unit: 'meters', category: 'Hardware' },
  { materialName: 'Caster Wheel - Lockable',unit: 'pieces',category: 'Hardware' },
  { materialName: 'Caster Wheel - Plain',unit: 'pieces',category: 'Hardware' },
  { materialName: 'Sofa Leg - Wooden 4inch',unit: 'pieces',category: 'Hardware' },
  { materialName: 'Sofa Leg - Metal 6inch',unit: 'pieces',category: 'Hardware' },
  { materialName: 'Bed Slat',           unit: 'pieces', category: 'Hardware' },
  { materialName: 'Bed Center Support Leg',unit: 'pieces',category: 'Hardware' },

  { materialName: 'Steel Rod 12mm',     unit: 'meters', category: 'Metal' },
  { materialName: 'Steel Pipe 1 inch',  unit: 'meters', category: 'Metal' },
  { materialName: 'Steel Flat Bar 2inch',unit: 'meters',category: 'Metal' },
  { materialName: 'Aluminum Profile',   unit: 'meters', category: 'Metal' },
  { materialName: 'Glass 4mm Clear',    unit: 'sq.ft',  category: 'Glass' },
  { materialName: 'Glass 6mm Clear',    unit: 'sq.ft',  category: 'Glass' },
  { materialName: 'Glass 6mm Frosted',  unit: 'sq.ft',  category: 'Glass' },
  { materialName: 'Mirror Sheet',       unit: 'sq.ft',  category: 'Glass' },

  { materialName: 'Wood Polish - Clear',unit: 'liters', category: 'Finishing' },
  { materialName: 'Wood Polish - Glossy',unit: 'liters', category: 'Finishing' },
  { materialName: 'Wood Stain - Walnut',unit: 'liters', category: 'Finishing' },
  { materialName: 'Wood Stain - Mahogany',unit: 'liters', category: 'Finishing' },
  { materialName: 'Wood Stain - Ebony', unit: 'liters', category: 'Finishing' },
  { materialName: 'Wood Primer',        unit: 'liters', category: 'Finishing' },
  { materialName: 'Lacquer - Matte',    unit: 'liters', category: 'Finishing' },
  { materialName: 'Lacquer - Gloss',    unit: 'liters', category: 'Finishing' },
  { materialName: 'PU Coat',            unit: 'liters', category: 'Finishing' },
  { materialName: 'Edge Banding Tape - Teak',unit: 'meters', category: 'Finishing' },
  { materialName: 'Edge Banding Tape - White',unit:'meters', category: 'Finishing' },
  { materialName: 'Sandpaper 80 Grit',  unit: 'sheets', category: 'Finishing' },
  { materialName: 'Sandpaper 120 Grit', unit: 'sheets', category: 'Finishing' },
  { materialName: 'Sandpaper 220 Grit', unit: 'sheets', category: 'Finishing' },
  { materialName: 'Wood Filler',        unit: 'kg',     category: 'Finishing' },
  { materialName: 'Fevicol / Wood Glue',unit: 'kg',     category: 'Finishing' },
  { materialName: 'Epoxy Adhesive',     unit: 'kg',     category: 'Finishing' },

  { materialName: 'Bubble Wrap',        unit: 'meters', category: 'Packaging' },
  { materialName: 'Corrugated Sheet',   unit: 'sheets', category: 'Packaging' },
  { materialName: 'Stretch Film',       unit: 'rolls',  category: 'Packaging' },
  { materialName: 'Foam Sheet 10mm',    unit: 'sheets', category: 'Packaging' },
  { materialName: 'Packaging Tape',     unit: 'rolls',  category: 'Packaging' },
  { materialName: 'Cardboard Box - Large',unit: 'pieces', category: 'Packaging' }
];

async function run() {
  try {
    await client.connect();
    let count = 0;
    
    // Get existing max material code
    const res = await client.query('SELECT MAX("materialCode") as max_code FROM "Material"');
    let mCode = 1000;
    if (res.rows[0].max_code) {
      const match = res.rows[0].max_code.match(/\d+/);
      if (match) mCode = parseInt(match[0]) + 1;
    }

    for (const mat of testMaterials) {
      const existing = await client.query('SELECT id FROM "Material" WHERE "materialName" = $1', [mat.materialName]);
      if (existing.rowCount === 0) {
        const id = crypto.randomUUID();
        const code = `MAT-${mCode++}`;
        const query = `
          INSERT INTO "Material" 
          (id, "materialCode", "materialName", category, unit, "minimumStock", "reorderLevel", "purchasePrice", "availableStock", "updatedAt") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        `;
        await client.query(query, [id, code, mat.materialName, mat.category, mat.unit, 10, 20, 100, 500]);
        console.log('Inserted:', mat.materialName);
        count++;
      }
    }
    
    const finalCount = await client.query('SELECT COUNT(*) FROM "Material"');
    console.log('Total Materials in DB:', finalCount.rows[0].count);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
