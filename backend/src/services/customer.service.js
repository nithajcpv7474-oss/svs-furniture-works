import prisma from '../config/prisma.js';

export const getCustomers = async ({ skip, take, search, status, customerType }) => {
  const where = { isDeleted: false };

  if (status) {
    where.status = status;
  }

  if (customerType) {
    where.customerType = customerType;
  }

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { customerCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, total };
};

export const getCustomerById = async (id) => {
  return prisma.customer.findFirst({
    where: { id, isDeleted: false },
  });
};

export const createCustomer = async (data) => {
  // Check for duplicate phone
  const existingPhone = await prisma.customer.findUnique({ where: { phone: data.phone } });
  if (existingPhone) {
    throw new Error('Customer with this phone number already exists.');
  }

  // Check for duplicate email
  if (data.email) {
    const existingEmail = await prisma.customer.findUnique({ where: { email: data.email } });
    if (existingEmail) {
      throw new Error('Customer with this email already exists.');
    }
  }

  // Generate Customer Code (e.g. CUST0001)
  const lastCustomer = await prisma.customer.findFirst({
    orderBy: { customerCode: 'desc' },
  });

  let nextNumber = 1;
  if (lastCustomer && lastCustomer.customerCode) {
    const match = lastCustomer.customerCode.match(/\d+/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }
  const customerCode = `CUST-${nextNumber.toString().padStart(4, '0')}`;

  return prisma.customer.create({
    data: {
      ...data,
      customerCode,
    },
  });
};

export const updateCustomer = async (id, data) => {
  // Check duplicates if phone is being updated
  if (data.phone) {
    const existingPhone = await prisma.customer.findFirst({ where: { phone: data.phone, id: { not: id } } });
    if (existingPhone) {
      throw new Error('Another customer with this phone number already exists.');
    }
  }

  // Check duplicates if email is being updated
  if (data.email) {
    const existingEmail = await prisma.customer.findFirst({ where: { email: data.email, id: { not: id } } });
    if (existingEmail) {
      throw new Error('Another customer with this email already exists.');
    }
  }

  return prisma.customer.update({
    where: { id },
    data,
  });
};

export const deleteCustomer = async (id) => {
  // Soft delete
  return prisma.customer.update({
    where: { id },
    data: { isDeleted: true },
  });
};
