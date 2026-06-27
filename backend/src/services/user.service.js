import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (role) => {
  const whereClause = {};
  if (role) {
    whereClause.role = role;
  }
  
  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      department: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  });
  return users;
};

export const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      department: true,
      isActive: true,
      forcePasswordChange: true,
      lastLogin: true,
      createdAt: true,
    }
  });
};

export const createUser = async (data) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error('Email is already in use.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: data.role || 'SalesStaff',
      department: data.department || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      forcePasswordChange: data.forcePasswordChange !== undefined ? data.forcePasswordChange : true
    },
    select: { id: true, fullName: true, email: true, role: true, department: true, isActive: true }
  });
  
  return user;
};

export const updateUser = async (id, data) => {
  const updateData = {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    role: data.role,
    department: data.department,
    isActive: data.isActive,
    forcePasswordChange: data.forcePasswordChange
  };

  // Only update password if provided
  if (data.password && data.password.trim() !== '') {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(data.password, salt);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, fullName: true, email: true, role: true, department: true, isActive: true }
  });

  return user;
};

export const deleteUser = async (id) => {
  // Instead of hard deleting, we typically just set isActive to false
  // to avoid breaking foreign key constraints on records created by this user
  return prisma.user.update({
    where: { id },
    data: { isActive: false }
  });
};

export const updatePreferences = async (id, data) => {
  const updateData = {};
  if (data.themePreference !== undefined) updateData.themePreference = data.themePreference;
  if (data.notificationPreferences !== undefined) updateData.notificationPreferences = data.notificationPreferences;
  if (data.autoClearAlerts !== undefined) updateData.autoClearAlerts = data.autoClearAlerts;
  if (data.autoClearDays !== undefined) updateData.autoClearDays = parseInt(data.autoClearDays, 10);

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { 
      id: true, 
      fullName: true, 
      email: true, 
      role: true, 
      themePreference: true, 
      notificationPreferences: true, 
      autoClearAlerts: true, 
      autoClearDays: true 
    }
  });
};

export const resetUserPassword = async (id) => {
  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(tempPassword, salt);

  await prisma.user.update({
    where: { id },
    data: { 
      password: hashedPassword,
      forcePasswordChange: true 
    }
  });

  return tempPassword;
};
