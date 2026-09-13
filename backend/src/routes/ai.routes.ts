import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { auth } from '../middleware/auth.middleware';
import { adminAuth } from '../middleware/adminAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import { aiChatSchema, aiRouteAnalysisSchema, aiHotelRecSchema, aiSafePlaceRecSchema } from '../validators/ai.validator';

const router = Router();

// Mobile & Web AI endpoints (auth required)
router.post('/chat', auth, validate(aiChatSchema), aiController.aiChat);
router.post('/ask', auth, validate(aiChatSchema), aiController.aiChat);
router.post('/route-analysis', auth, validate(aiRouteAnalysisSchema), aiController.routeAnalysis);
router.post('/hotel-recommendation', auth, validate(aiHotelRecSchema), aiController.hotelRecommendation);
router.post('/safe-place-recommendation', auth, validate(aiSafePlaceRecSchema), aiController.safePlaceRecommendation);
router.get('/review-summary/:placeId', auth, aiController.getReviewSummary);
router.get('/history', auth, aiController.listAIHistory);

// Admin AI management endpoints
router.get('/prompt-templates', adminAuth, aiController.listPromptTemplates);
router.post('/prompt-templates', adminAuth, aiController.createPromptTemplate);
router.put('/prompt-templates/:templateId', adminAuth, aiController.updatePromptTemplate);
router.delete('/prompt-templates/:templateId', adminAuth, aiController.deletePromptTemplate);

router.get('/model-config', adminAuth, aiController.getModelConfig);
router.put('/model-config', adminAuth, aiController.updateModelConfig);

export default router;

