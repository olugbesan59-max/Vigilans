import { db } from '../db/database.js';

export function getUserIdFromHeader(authHeader) {
  if (!authHeader) return null;
  const raw = authHeader.replace(/^Bearer\s+/i, '').trim();
  
  if (raw.includes('_')) {
    const parts = raw.split('_');
    return parts[1] || null;
  }
  
  if (raw.startsWith('token-')) {
    const rest = raw.substring(6);
    const lastHyphen = rest.lastIndexOf('-');
    return lastHyphen > 0 ? rest.substring(0, lastHyphen) : rest;
  }
  
  return raw;
}

export function getAuthContext(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const userId = getUserIdFromHeader(authHeader);
  if (!userId) return null;
  const user = db.findById('users', userId);
  if (!user) return null;
  const workspace = db.findById('workspaces', user.workspace_id);
  return { user, workspace };
}

export function authenticateUser(req) {
  const ctx = getAuthContext(req);
  return ctx ? ctx.user : null;
}
