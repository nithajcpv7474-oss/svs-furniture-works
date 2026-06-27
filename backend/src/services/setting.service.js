import prisma from '../config/prisma.js';

export const getSettings = async () => {
  let settings = await prisma.appSetting.findUnique({
    where: { id: '1' }
  });

  if (!settings) {
    settings = await prisma.appSetting.create({
      data: {
        id: '1',
      }
    });
  }

  return settings;
};

export const updateSettings = async (data) => {
  const updateData = {};
  
  if (data.companyName !== undefined) updateData.companyName = data.companyName;
  if (data.companyLogo !== undefined) updateData.companyLogo = data.companyLogo;
  if (data.companyEmail !== undefined) updateData.companyEmail = data.companyEmail;
  if (data.companyPhone !== undefined) updateData.companyPhone = data.companyPhone;
  if (data.companyAddress !== undefined) updateData.companyAddress = data.companyAddress;
  if (data.gstin !== undefined) updateData.gstin = data.gstin;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.taxRate !== undefined) updateData.taxRate = parseFloat(data.taxRate);
  
  if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(data.lowStockThreshold, 10);
  if (data.deliveryOverdueGraceHours !== undefined) updateData.deliveryOverdueGraceHours = parseInt(data.deliveryOverdueGraceHours, 10);
  if (data.productionDelayGraceHours !== undefined) updateData.productionDelayGraceHours = parseInt(data.productionDelayGraceHours, 10);
  
  if (data.enableLowStockAlerts !== undefined) updateData.enableLowStockAlerts = String(data.enableLowStockAlerts) === 'true';
  if (data.enableDeliveryAlerts !== undefined) updateData.enableDeliveryAlerts = String(data.enableDeliveryAlerts) === 'true';
  if (data.enableProductionAlerts !== undefined) updateData.enableProductionAlerts = String(data.enableProductionAlerts) === 'true';
  if (data.enableSpecificationAlerts !== undefined) updateData.enableSpecificationAlerts = String(data.enableSpecificationAlerts) === 'true';
  
  if (data.defaultExportFormat !== undefined) updateData.defaultExportFormat = data.defaultExportFormat;
  if (data.dateFormat !== undefined) updateData.dateFormat = data.dateFormat;

  return prisma.appSetting.upsert({
    where: { id: '1' },
    update: updateData,
    create: {
      id: '1',
      ...updateData
    }
  });
};
