export const BANK_PERMISSIONS = Object.freeze([
  'view-own',
  'view-all',
  'manage-users',
  'manage-permissions',
  'deposit',
  'withdraw',
  'transfer',
  'card-purchase'
]);

export const CUSTOMER_PERMISSIONS = Object.freeze([
  'view-own',
  'deposit',
  'withdraw',
  'transfer',
  'card-purchase'
]);

export const ADMIN_PERMISSIONS = BANK_PERMISSIONS;

export function normalizePermissions(permissions = []) {
  if (!Array.isArray(permissions)) throw new Error('Permissions must be a list.');
  const unknownPermissions = permissions.filter(permission => !BANK_PERMISSIONS.includes(permission));
  if (unknownPermissions.length) throw new Error(`Unknown permission: ${unknownPermissions[0]}`);
  return [...new Set(permissions)];
}