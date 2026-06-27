import * as reportService from '../services/report.service.js';

export const getDashboardCharts = async (req, res) => {
  try {
    const data = await reportService.getDashboardCharts();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSalesReports = async (req, res) => {
  try {
    const data = await reportService.getSalesReports(req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInventoryReports = async (req, res) => {
  try {
    const data = await reportService.getInventoryReports();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductionReports = async (req, res) => {
  try {
    const data = await reportService.getProductionReports(req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDeliveryReports = async (req, res) => {
  try {
    const data = await reportService.getDeliveryReports(req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
