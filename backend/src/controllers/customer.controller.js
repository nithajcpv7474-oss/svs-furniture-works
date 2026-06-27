import * as customerService from '../services/customer.service.js';
import { logAction } from '../services/audit.service.js';
import { getPaginationParams, formatPaginationResponse } from '../utils/pagination.util.js';

export const getCustomers = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, status, customerType } = req.query;

    const { customers, total } = await customerService.getCustomers({
      skip,
      take: limit,
      search,
      status,
      customerType,
    });

    res.status(200).json({
      data: customers,
      meta: formatPaginationResponse(total, page, limit),
    });
  } catch (error) {
    console.error('getCustomers Error:', error);
    res.status(500).json({ message: 'Failed to retrieve customers.' });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    res.status(200).json(customer);
  } catch (error) {
    console.error('getCustomerById Error:', error);
    res.status(500).json({ message: 'Failed to retrieve customer.' });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    logAction({ userId: req.user.id, action: 'Create', module: 'Customers', newValue: customer, req });
    res.status(201).json(customer);
  } catch (error) {
    console.error('createCustomer Error:', error);
    if (error.message.includes('already exists')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to create customer.' });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const oldCustomer = await customerService.getCustomerById(req.params.id);
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    logAction({ userId: req.user.id, action: 'Update', module: 'Customers', oldValue: oldCustomer, newValue: customer, req });
    res.status(200).json(customer);
  } catch (error) {
    console.error('updateCustomer Error:', error);
    if (error.message.includes('already exists')) {
      return res.status(400).json({ message: error.message });
    }
    // Handle Prisma "Record to update not found."
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    res.status(500).json({ message: 'Failed to update customer.' });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const oldCustomer = await customerService.getCustomerById(req.params.id);
    await customerService.deleteCustomer(req.params.id);
    logAction({ userId: req.user.id, action: 'Delete', module: 'Customers', oldValue: oldCustomer, req });
    res.status(200).json({ message: 'Customer deleted successfully.' });
  } catch (error) {
    console.error('deleteCustomer Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    res.status(500).json({ message: 'Failed to delete customer.' });
  }
};
