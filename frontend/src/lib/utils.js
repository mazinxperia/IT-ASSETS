import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export function truncate(str, length = 50) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function downloadCSV(data, filename) {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  HR: 'HR',
  CEO: 'CEO',
  VIEWER: 'VIEWER'
};

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['all'],
  ADMIN: ['dashboard', 'assets', 'employees', 'inventory', 'transfers', 'search'],
  HR: ['dashboard', 'employees', 'assets:read', 'inventory:read', 'transfers:read'],
  CEO: ['dashboard:read', 'assets:read', 'employees:read', 'inventory:read', 'transfers:read'],
  VIEWER: ['dashboard:read', 'assets:read', 'employees:read', 'inventory:read']
};

export function hasPermission(userRole, permission) {
  if (userRole === ROLES.SUPER_ADMIN) return true;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes('all') || 
         permissions.includes(permission) || 
         permissions.includes(permission.split(':')[0]);
}

export function canEdit(userRole) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(userRole);
}

export function canDelete(userRole) {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(userRole);
}

export function isReadOnly(userRole) {
  return [ROLES.CEO, ROLES.VIEWER].includes(userRole);
}
