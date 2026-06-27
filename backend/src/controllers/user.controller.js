import * as userService from '../services/user.service.js';
import { notifyUserCreated } from '../services/notification.service.js';
import { logAction } from '../services/audit.service.js';

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const users = await userService.getUsers(role);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    notifyUserCreated(user);
    logAction({ userId: req.user.id, action: 'Create', module: 'Users', newValue: user, req });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const oldUser = await userService.getUserById(req.params.id);
    const user = await userService.updateUser(req.params.id, req.body);
    logAction({ userId: req.user.id, action: 'Update', module: 'Users', oldValue: oldUser, newValue: user, req });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const oldUser = await userService.getUserById(req.params.id);
    await userService.deleteUser(req.params.id);
    logAction({ userId: req.user.id, action: 'Delete', module: 'Users', oldValue: oldUser, req });
    res.json({ message: 'User disabled successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    // Only allow updating self
    const user = await userService.updatePreferences(req.user.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const targetUser = await userService.getUserById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Role Hierarchy Enforcement
    if (req.user.role === 'Management' && ['Admin', 'Management'].includes(targetUser.role)) {
      return res.status(403).json({ message: 'Management role cannot reset passwords for Admin or Management users' });
    }

    const tempPassword = await userService.resetUserPassword(targetUserId);
    
    // Audit Logging
    let actionDescription = 'Password reset triggered by administrator';
    if (req.user.role === 'Admin' && targetUser.role === 'Admin') {
      actionDescription = '[HIGH RISK] Admin password reset by another Admin';
    }

    logAction({ 
      userId: req.user.id, 
      action: 'Update', 
      module: 'Users', 
      oldValue: { id: targetUser.id, role: targetUser.role }, 
      newValue: { id: targetUser.id, role: targetUser.role, passwordReset: true, actionDescription }, 
      req 
    });

    res.json({ message: 'Password reset successfully', tempPassword });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
