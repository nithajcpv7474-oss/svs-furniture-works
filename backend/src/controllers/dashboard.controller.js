import * as reportService from '../services/report.service.js';
import prisma from '../config/prisma.js';
import { startOfMonth, subMonths, endOfMonth, format } from 'date-fns';

export const getDashboardSummary = async (req, res) => {
  try {
    const summaryData = {
      kpis: {},
      trends: {},
      performance: {},
      topMetrics: {},
      activities: []
    };

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    // 1. KPIs & Monthly Comparison
    const [
      totalCustomers,
      totalOrders,
      activeJobs,
      pendingDeliveries,
      currentMonthOrders,
      previousMonthOrders
    ] = await Promise.all([
      prisma.customer.count({ where: { isDeleted: false } }),
      prisma.order.count({ where: { isDeleted: false } }),
      prisma.productionJob.count({ where: { status: 'InProgress' } }),
      prisma.delivery.count({ where: { deliveryStatus: { in: ['Pending', 'Scheduled'] } } }),
      prisma.order.findMany({ where: { createdAt: { gte: currentMonthStart }, isDeleted: false }, select: { estimatedPrice: true } }),
      prisma.order.findMany({ where: { createdAt: { gte: previousMonthStart, lte: previousMonthEnd }, isDeleted: false }, select: { estimatedPrice: true } })
    ]);

    const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + o.estimatedPrice, 0);
    const prevRevenue = previousMonthOrders.reduce((sum, o) => sum + o.estimatedPrice, 0);
    
    const revenueGrowth = prevRevenue === 0 ? 100 : Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100);
    const orderGrowth = previousMonthOrders.length === 0 ? 100 : Math.round(((currentMonthOrders.length - previousMonthOrders.length) / previousMonthOrders.length) * 100);

    summaryData.kpis = {
      totalCustomers,
      totalOrders,
      activeJobs,
      pendingDeliveries,
      monthlyRevenue: currentRevenue,
      revenueGrowth,
      orderGrowth,
      monthlyOrdersCount: currentMonthOrders.length
    };

    // 2. Revenue Trends & Sales Forecast
    // Fetch last 6 months
    const last6MonthsStart = startOfMonth(subMonths(now, 5));
    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: last6MonthsStart }, isDeleted: false },
      select: { createdAt: true, estimatedPrice: true }
    });

    const monthlyRevenueMap = {};
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthKey = format(monthDate, 'MMM yyyy');
      monthlyRevenueMap[monthKey] = 0;
    }

    recentOrders.forEach(o => {
      const monthKey = format(o.createdAt, 'MMM yyyy');
      if (monthlyRevenueMap[monthKey] !== undefined) {
        monthlyRevenueMap[monthKey] += o.estimatedPrice;
      }
    });

    // Calculate Forecast (Simple Average Growth)
    const revArray = Object.values(monthlyRevenueMap);
    let totalGrowth = 0;
    let validMonths = 0;
    for (let i = 1; i < revArray.length; i++) {
      if (revArray[i-1] > 0) {
        totalGrowth += (revArray[i] - revArray[i-1]) / revArray[i-1];
        validMonths++;
      }
    }
    const avgGrowthRate = validMonths > 0 ? totalGrowth / validMonths : 0.05; // default 5% if no data

    const revenueTrend = Object.keys(monthlyRevenueMap).map(k => ({
      name: k,
      actual: monthlyRevenueMap[k],
      forecast: null
    }));

    let lastRev = revArray[revArray.length - 1] || 100000;
    for (let i = 1; i <= 3; i++) {
      const futureDate = subMonths(now, -i);
      const futureKey = format(futureDate, 'MMM yyyy');
      lastRev = lastRev * (1 + avgGrowthRate);
      revenueTrend.push({
        name: futureKey,
        actual: null,
        forecast: Math.round(lastRev)
      });
    }

    summaryData.trends.revenueForecast = revenueTrend;

    // 3. Heat Map (Orders by Day of Week)
    const allOrders = await prisma.order.findMany({ where: { isDeleted: false }, select: { createdAt: true } });
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmapData = Array.from({length: 7}, (_, i) => ({ day: dayNames[i], orders: 0 }));
    
    allOrders.forEach(o => {
      heatmapData[o.createdAt.getDay()].orders += 1;
    });
    summaryData.trends.orderHeatmap = heatmapData;

    // Category Distribution
    const inventoryData = await reportService.getInventoryReports();
    summaryData.trends.categoryDistribution = inventoryData.categoryDistribution;

    // 4. Top Metrics
    const salesData = await reportService.getSalesReports({});
    summaryData.topMetrics.topCustomers = salesData.topCustomers.slice(0, 5);

    // Top Materials (Outbound transactions in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { transactionType: 'StockOut', createdAt: { gte: thirtyDaysAgo } },
      include: { material: true }
    });
    const materialUsage = {};
    transactions.forEach(tx => {
      const mid = tx.materialId;
      if (!materialUsage[mid]) {
        materialUsage[mid] = { name: tx.material.materialName, quantity: 0 };
      }
      materialUsage[mid].quantity += Math.abs(tx.quantity);
    });
    summaryData.topMetrics.topMaterials = Object.values(materialUsage)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 5. Performance
    const jobs = await prisma.productionJob.findMany({ where: { status: 'Completed' } });
    let productionOnTime = 0;
    jobs.forEach(j => {
      if (!j.expectedCompletionDate || j.updatedAt <= j.expectedCompletionDate) {
        productionOnTime++;
      }
    });
    summaryData.performance.production = {
      totalCompleted: jobs.length,
      onTimeRate: jobs.length > 0 ? Math.round((productionOnTime / jobs.length) * 100) : 100
    };

    const deliveries = await prisma.delivery.findMany({ where: { deliveryStatus: 'Delivered' } });
    let deliveryOnTime = 0;
    deliveries.forEach(d => {
      if (!d.expectedDeliveryDate || (d.actualDeliveryDate && d.actualDeliveryDate <= d.expectedDeliveryDate)) {
        deliveryOnTime++;
      }
    });
    summaryData.performance.delivery = {
      totalCompleted: deliveries.length,
      onTimeRate: deliveries.length > 0 ? Math.round((deliveryOnTime / deliveries.length) * 100) : 100
    };

    // 6. Recent Activities
    const recentOrdersWidgets = await prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { customer: true }, where: { isDeleted: false } });
    const latestJobs = await prisma.productionJob.findMany({ take: 5, orderBy: { updatedAt: 'desc' } });
    const latestTx = await prisma.inventoryTransaction.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { material: true } });

    const activities = [];
    recentOrdersWidgets.forEach(o => activities.push({
      id: `ord-${o.id}`,
      type: 'Order',
      title: 'New Order',
      description: `${o.customer.fullName} placed an order for ₹${o.estimatedPrice.toLocaleString('en-IN')}.`,
      time: o.createdAt
    }));
    latestJobs.forEach(j => activities.push({
      id: `job-${j.id}`,
      type: 'Production',
      title: `Job ${j.status}`,
      description: `Production job ${j.productionNumber} moved to ${j.productionStage}.`,
      time: j.updatedAt
    }));
    latestTx.forEach(tx => activities.push({
      id: `tx-${tx.id}`,
      type: 'Inventory',
      title: `Stock ${tx.transactionType}`,
      description: `${Math.abs(tx.quantity)} units of ${tx.material.materialName} recorded.`,
      time: tx.createdAt
    }));

    activities.sort((a, b) => b.time - a.time);
    summaryData.activities = activities.slice(0, 10);

    res.status(200).json(summaryData);
  } catch (error) {
    console.error('Enterprise Dashboard Error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard summary.' });
  }
};
