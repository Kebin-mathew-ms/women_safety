import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import adminJwt, { requirePermission } from '../middleware/adminJwt.middleware';
import * as authCtrl from '../controllers/admin.auth.controller';
import * as dashCtrl from '../controllers/admin.dashboard.controller';
import * as usersCtrl from '../controllers/admin.users.controller';
import * as sosCtrl from '../controllers/admin.sos.controller';
import * as placesCtrl from '../controllers/admin.places.controller';
import * as communityCtrl from '../controllers/admin.community.controller';
import * as rolesCtrl from '../controllers/admin.roles.controller';
import * as announcementsCtrl from '../controllers/admin.announcements.controller';

const router = Router();

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Auth Routes (no JWT) ──────────────────────────────────────────────
router.post('/auth/login', loginLimiter, authCtrl.login);
router.post('/auth/refresh', authCtrl.refresh);
router.post('/auth/seed', authCtrl.seedAdmin);   // One-time setup

// ─── Protected Auth Routes ────────────────────────────────────────────────────
router.post('/auth/logout', adminJwt, authCtrl.logout);
router.get('/auth/me', adminJwt, authCtrl.getMe);

// ─── Dashboard & Analytics ────────────────────────────────────────────────────
router.get('/dashboard', adminJwt, dashCtrl.getDashboard);
router.get('/analytics/overview', adminJwt, requirePermission('reports:view'), dashCtrl.getAnalyticsOverview);
router.get('/analytics/users', adminJwt, requirePermission('reports:view'), dashCtrl.getUsersAnalytics);
router.get('/analytics/trips', adminJwt, requirePermission('reports:view'), dashCtrl.getTripsAnalytics);
router.get('/analytics/sos', adminJwt, requirePermission('reports:view'), dashCtrl.getSosAnalytics);

// ─── Reports ─────────────────────────────────────────────────────────────────
router.get('/reports/:type', adminJwt, requirePermission('reports:view'), dashCtrl.generateReport);

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get('/audit-logs', adminJwt, requirePermission('audit:view'), dashCtrl.getAuditLogs);

// ─── Settings ─────────────────────────────────────────────────────────────────
router.get('/settings', adminJwt, dashCtrl.getSettings);
router.put('/settings', adminJwt, requirePermission('settings:manage'), dashCtrl.updateSettings);

// ─── Global Search ────────────────────────────────────────────────────────────
router.get('/search', adminJwt, dashCtrl.globalSearch);

// ─── Broadcast ────────────────────────────────────────────────────────────────
router.post('/notifications/broadcast', adminJwt, requirePermission('notifications:manage'), dashCtrl.broadcastNotification);

// ─── User Management ──────────────────────────────────────────────────────────
router.get('/users', adminJwt, requirePermission('user:manage'), usersCtrl.listUsers);
router.get('/users/:userId', adminJwt, requirePermission('user:manage'), usersCtrl.getUserDetail);
router.put('/users/:userId/status', adminJwt, requirePermission('user:manage'), usersCtrl.updateUserStatus);
router.post('/users/:userId/reset-password', adminJwt, requirePermission('user:manage'), usersCtrl.resetUserPassword);
router.get('/users/:userId/trips', adminJwt, requirePermission('user:manage'), usersCtrl.getUserTrips);
router.get('/users/:userId/sos', adminJwt, requirePermission('user:manage'), usersCtrl.getUserSosHistory);

// ─── SOS Management ───────────────────────────────────────────────────────────
router.get('/sos', adminJwt, requirePermission('sos:manage'), sosCtrl.listSos);
router.get('/sos/live', adminJwt, requirePermission('sos:manage'), sosCtrl.getLiveSos);
router.get('/sos/analytics', adminJwt, requirePermission('sos:manage'), sosCtrl.getSosAnalytics);
router.put('/sos/:sosId/resolve', adminJwt, requirePermission('sos:manage'), sosCtrl.resolveSos);
router.put('/sos/:sosId/notes', adminJwt, requirePermission('sos:manage'), sosCtrl.addSosNotes);

// ─── Trips Management ─────────────────────────────────────────────────────────
router.get('/trips', adminJwt, requirePermission('trip:manage'), sosCtrl.listTrips);
router.put('/trips/:tripId/cancel', adminJwt, requirePermission('trip:manage'), sosCtrl.cancelTrip);

// ─── Safe Places ──────────────────────────────────────────────────────────────
router.get('/places', adminJwt, requirePermission('places:manage'), placesCtrl.listPlaces);
router.post('/places', adminJwt, requirePermission('places:manage'), placesCtrl.createPlace);
router.put('/places/:placeId', adminJwt, requirePermission('places:manage'), placesCtrl.updatePlace);
router.delete('/places/:placeId', adminJwt, requirePermission('places:manage'), placesCtrl.deletePlace);
router.put('/places/:placeId/verify', adminJwt, requirePermission('places:manage'), placesCtrl.verifyPlace);

// ─── Crime Reports ────────────────────────────────────────────────────────────
router.get('/crime-reports', adminJwt, requirePermission('crime:manage'), placesCtrl.listCrimeReports);
router.put('/crime-reports/:reportId/status', adminJwt, requirePermission('crime:manage'), placesCtrl.updateCrimeReportStatus);

// ─── Community Moderation ─────────────────────────────────────────────────────
router.get('/community/posts', adminJwt, requirePermission('community:manage'), communityCtrl.listPosts);
router.put('/community/posts/:postId/hide', adminJwt, requirePermission('community:manage'), communityCtrl.hidePost);
router.delete('/community/posts/:postId', adminJwt, requirePermission('community:manage'), communityCtrl.deletePost);
router.get('/community/reports', adminJwt, requirePermission('community:manage'), communityCtrl.listReportedPosts);
router.put('/community/reports/:reportId', adminJwt, requirePermission('community:manage'), communityCtrl.resolveReport);
router.put('/community/users/:userId/ban', adminJwt, requirePermission('community:manage'), communityCtrl.banUser);
router.put('/community/users/:userId/mute', adminJwt, requirePermission('community:manage'), communityCtrl.muteUser);

// ─── Roles & Permissions ──────────────────────────────────────────────────────
router.get('/roles', adminJwt, requirePermission('roles:manage'), rolesCtrl.listRoles);
router.post('/roles', adminJwt, requirePermission('roles:manage'), rolesCtrl.createRole);
router.put('/roles/:roleId', adminJwt, requirePermission('roles:manage'), rolesCtrl.updateRole);
router.delete('/roles/:roleId', adminJwt, requirePermission('roles:manage'), rolesCtrl.deleteRole);
router.get('/permissions', adminJwt, requirePermission('roles:manage'), rolesCtrl.listPermissions);
router.post('/roles/:roleId/permissions', adminJwt, requirePermission('roles:manage'), rolesCtrl.assignPermissions);

// ─── Admin Users (admin management) ──────────────────────────────────────────
router.get('/admins', adminJwt, requirePermission('roles:manage'), rolesCtrl.listAdmins);
router.post('/admins', adminJwt, requirePermission('roles:manage'), rolesCtrl.createAdmin);
router.put('/admins/:adminId/status', adminJwt, requirePermission('roles:manage'), rolesCtrl.updateAdminStatus);

// ─── Announcements ────────────────────────────────────────────────────────────
router.get('/announcements', adminJwt, announcementsCtrl.listAnnouncements);
router.post('/announcements', adminJwt, requirePermission('announcements:manage'), announcementsCtrl.createAnnouncement);
router.put('/announcements/:announcementId', adminJwt, requirePermission('announcements:manage'), announcementsCtrl.updateAnnouncement);
router.delete('/announcements/:announcementId', adminJwt, requirePermission('announcements:manage'), announcementsCtrl.deleteAnnouncement);

export default router;
