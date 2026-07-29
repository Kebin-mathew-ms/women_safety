import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import AuditService from '../services/audit.service';

// GET /api/admin/roles
export const listRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roles = await prisma.roles.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
      orderBy: { roleName: 'asc' },
    });
    ResponseHelper.success(res, 'Roles retrieved', roles);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/roles
export const createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleName, description } = req.body;
    if (!roleName) throw new BadRequestError('roleName is required');

    const role = await prisma.roles.create({ data: { roleName, description } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'roles',
      action: 'CREATE',
      entityType: 'Role',
      entityId: role.roleId,
      ipAddress: req.ip,
      newValues: { roleName },
    });

    ResponseHelper.success(res, 'Role created', role, 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/roles/:roleId
export const updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    const { roleName, description } = req.body;

    const existing = await prisma.roles.findUnique({ where: { roleId } });
    if (!existing) throw new NotFoundError('Role not found');

    const updated = await prisma.roles.update({ where: { roleId }, data: { roleName, description } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'roles',
      action: 'UPDATE',
      entityType: 'Role',
      entityId: roleId,
      ipAddress: req.ip,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: { roleName, description },
    });

    ResponseHelper.success(res, 'Role updated', updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/roles/:roleId
export const deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    await prisma.roles.delete({ where: { roleId } });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'roles',
      action: 'DELETE',
      entityType: 'Role',
      entityId: roleId,
      ipAddress: req.ip,
    });

    ResponseHelper.success(res, 'Role deleted', null);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/permissions
export const listPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const permissions = await prisma.permissions.findMany({ orderBy: [{ module: 'asc' }, { permissionName: 'asc' }] });
    ResponseHelper.success(res, 'Permissions retrieved', permissions);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/roles/:roleId/permissions
export const assignPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body; // string[]

    if (!Array.isArray(permissionIds)) throw new BadRequestError('permissionIds must be an array');

    const role = await prisma.roles.findUnique({ where: { roleId } });
    if (!role) throw new NotFoundError('Role not found');

    // Replace all permissions
    await prisma.rolePermissions.deleteMany({ where: { roleId } });
    const created = await prisma.rolePermissions.createMany({
      data: permissionIds.map((permissionId: string) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'roles',
      action: 'UPDATE',
      entityType: 'RolePermissions',
      entityId: roleId,
      ipAddress: req.ip,
      newValues: { permissionIds },
    });

    ResponseHelper.success(res, `${created.count} permissions assigned`, created);
  } catch (err) {
    next(err);
  }
};

// ─── Admin Users Management ────────────────────────────────────────────────────

// GET /api/admin/admins
export const listAdmins = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const admins = await prisma.adminUsers.findMany({
      select: {
        adminId: true, name: true, email: true, role: true,
        status: true, lastLogin: true, createdAt: true,
        _count: { select: { auditLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    ResponseHelper.success(res, 'Admin users retrieved', admins);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/admins
export const createAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bcrypt = await import('bcrypt');
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) throw new BadRequestError('name, email, and password are required');
    const existing = await prisma.adminUsers.findUnique({ where: { email } });
    if (existing) throw new BadRequestError('Email already in use');

    const passwordHash = await bcrypt.default.hash(password, 12);
    const admin = await prisma.adminUsers.create({
      data: { name, email: email.toLowerCase().trim(), passwordHash, role: role ?? 'moderator' },
      select: { adminId: true, name: true, email: true, role: true, status: true, createdAt: true },
    });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'admins',
      action: 'CREATE',
      entityType: 'AdminUsers',
      entityId: admin.adminId,
      ipAddress: req.ip,
      newValues: { name, email, role },
    });

    ResponseHelper.success(res, 'Admin created', admin, 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/admins/:adminId/status
export const updateAdminStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) throw new BadRequestError('status must be active or suspended');

    const updated = await prisma.adminUsers.update({
      where: { adminId },
      data: { status },
      select: { adminId: true, name: true, email: true, status: true },
    });

    await AuditService.log({
      adminId: req.admin?.adminId,
      module: 'admins',
      action: 'UPDATE',
      entityType: 'AdminUsers',
      entityId: adminId,
      ipAddress: req.ip,
      newValues: { status },
    });

    ResponseHelper.success(res, 'Admin status updated', updated);
  } catch (err) {
    next(err);
  }
};
