import prisma from '../config/prisma.js';

export const getMaterials = async ({ skip, take, search, category, status }) => {
  const where = { isDeleted: false };

  if (category) where.category = category;
  if (status) where.status = status;

  if (search) {
    where.OR = [
      { materialName: { contains: search, mode: 'insensitive' } },
      { materialCode: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [materials, total] = await Promise.all([
    prisma.material.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.material.count({ where }),
  ]);

  return { materials, total };
};

export const getMaterialById = async (id) => {
  return prisma.material.findFirst({
    where: { id, isDeleted: false },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } }
  });
};

export const createMaterial = async (data, files) => {
  const existingMaterial = await prisma.material.findFirst({
    where: { materialName: data.materialName, isDeleted: false },
  });

  if (existingMaterial) {
    throw new Error('Material with this name already exists.');
  }

  // Auto-generate MAT0001 code
  const lastMaterial = await prisma.material.findFirst({
    orderBy: { materialCode: 'desc' },
  });

  let nextNumber = 1;
  if (lastMaterial && lastMaterial.materialCode.startsWith('MAT')) {
    const lastNumberStr = lastMaterial.materialCode.replace('MAT', '');
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  const materialCode = `MAT${nextNumber.toString().padStart(4, '0')}`;

  const image = files?.image ? files.image[0].filename : null;

  return prisma.material.create({
    data: {
      ...data,
      materialCode,
      image,
      availableStock: parseFloat(data.availableStock) || 0,
      minimumStock: parseFloat(data.minimumStock) || 0,
      reorderLevel: parseFloat(data.reorderLevel) || 0,
      purchasePrice: parseFloat(data.purchasePrice) || 0,
      sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : null,
    },
  });
};

export const updateMaterial = async (id, data, files) => {
  const updateData = {
    ...data,
    availableStock: data.availableStock ? parseFloat(data.availableStock) : undefined,
    minimumStock: data.minimumStock ? parseFloat(data.minimumStock) : undefined,
    reorderLevel: data.reorderLevel ? parseFloat(data.reorderLevel) : undefined,
    purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : undefined,
    sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : undefined,
  };

  if (files?.image) {
    updateData.image = files.image[0].filename;
  }

  return prisma.material.update({
    where: { id },
    data: updateData,
  });
};

export const deleteMaterial = async (id) => {
  return prisma.material.update({
    where: { id },
    data: { isDeleted: true },
  });
};
