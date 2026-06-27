import prisma from '../config/prisma.js';
import { format, startOfYear, endOfYear, subMonths } from 'date-fns';

export const getDashboardCharts = async () => {
  const currentYearStart = startOfYear(new Date());
  
  // Fetch orders for this year
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: currentYearStart }, isDeleted: false },
    select: { createdAt: true, estimatedPrice: true, orderStatus: true }
  });

  // Group by Month (Jan-Dec)
  const monthlyDataMap = Array.from({ length: 12 }, (_, i) => ({
    name: format(new Date(new Date().getFullYear(), i, 1), 'MMM'),
    revenue: 0,
    orders: 0
  }));

  let totalRevenue = 0;
  
  orders.forEach(order => {
    const monthIndex = order.createdAt.getMonth();
    monthlyDataMap[monthIndex].orders += 1;
    monthlyDataMap[monthIndex].revenue += order.estimatedPrice;
    totalRevenue += order.estimatedPrice;
  });

  return {
    revenueTrend: monthlyDataMap,
    totalRevenue
  };
};

export const getSalesReports = async ({ startDate, endDate }) => {
  const where = { isDeleted: false };
  if (startDate && endDate) {
    where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  const [orders, customers] = await Promise.all([
    prisma.order.findMany({ 
      where, 
      include: { customer: true },
      orderBy: { createdAt: 'desc' } 
    }),
    prisma.customer.findMany({ where: { isDeleted: false } })
  ]);

  // Aggregate Status Distribution
  const statusCounts = {};
  orders.forEach(o => {
    statusCounts[o.orderStatus] = (statusCounts[o.orderStatus] || 0) + 1;
  });
  const statusDistribution = Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] }));

  // Top Customers
  const customerRevenue = {};
  orders.forEach(o => {
    const cid = o.customerId;
    if (!customerRevenue[cid]) {
      customerRevenue[cid] = { name: o.customer.fullName, revenue: 0, orderCount: 0 };
    }
    customerRevenue[cid].revenue += o.estimatedPrice;
    customerRevenue[cid].orderCount += 1;
  });

  const topCustomers = Object.values(customerRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    orders,
    statusDistribution,
    topCustomers
  };
};

export const getInventoryReports = async () => {
  const materials = await prisma.material.findMany({
    where: { isDeleted: false }
  });

  let totalValue = 0;
  const categoryDistributionMap = {};

  materials.forEach(m => {
    const val = (m.availableStock * m.purchasePrice) || 0;
    totalValue += val;
    
    categoryDistributionMap[m.category] = (categoryDistributionMap[m.category] || 0) + val;
  });

  const categoryDistribution = Object.keys(categoryDistributionMap).map(k => ({
    name: k,
    value: categoryDistributionMap[k]
  }));

  const lowStockMaterials = materials.filter(m => m.availableStock <= m.minimumStock);
  const outOfStockMaterials = materials.filter(m => m.availableStock === 0);

  return {
    materials,
    totalValue,
    categoryDistribution,
    lowStockMaterials,
    outOfStockMaterials
  };
};

export const getProductionReports = async ({ startDate, endDate }) => {
  const where = {};
  if (startDate && endDate) {
    where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  const jobs = await prisma.productionJob.findMany({
    where,
    include: { order: true }
  });

  const stageCounts = {};
  const statusCounts = {};
  let delayedCount = 0;

  jobs.forEach(j => {
    stageCounts[j.productionStage] = (stageCounts[j.productionStage] || 0) + 1;
    statusCounts[j.status] = (statusCounts[j.status] || 0) + 1;

    if (j.expectedCompletionDate && new Date() > new Date(j.expectedCompletionDate) && j.status !== 'Completed') {
      delayedCount++;
    }
  });

  return {
    jobs,
    stageDistribution: Object.keys(stageCounts).map(k => ({ name: k, value: stageCounts[k] })),
    statusDistribution: Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] })),
    delayedCount
  };
};

export const getDeliveryReports = async ({ startDate, endDate }) => {
  const where = {};
  if (startDate && endDate) {
    where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  const deliveries = await prisma.delivery.findMany({
    where,
    include: { order: true, customer: true, vehicle: true }
  });

  const statusCounts = {};
  let delayedCount = 0;

  deliveries.forEach(d => {
    statusCounts[d.deliveryStatus] = (statusCounts[d.deliveryStatus] || 0) + 1;
    if (d.expectedDeliveryDate && new Date() > new Date(d.expectedDeliveryDate) && d.deliveryStatus !== 'Delivered') {
      delayedCount++;
    }
  });

  const vehicles = await prisma.vehicle.findMany();
  const vehicleUtilization = vehicles.map(v => ({
    name: v.vehicleNumber,
    status: v.status
  }));

  return {
    deliveries,
    statusDistribution: Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] })),
    delayedCount,
    vehicleUtilization
  };
};
