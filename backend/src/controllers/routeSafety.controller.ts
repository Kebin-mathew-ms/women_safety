import { Request, Response, NextFunction } from 'express';
import RoutingService from '../services/routing.service';
import SafetyIntelligenceService, { EvaluatedRouteScore } from '../services/safetyIntelligence.service';
import AiReasoningService from '../services/aiReasoning.service';
import ResponseHelper from '../utils/response';

export const getRouteSafetyRecommendation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      origin,
      destination,
      departureTime,
      modeOfTransport = 'car',
      numberOfTravellers = 1,
      preferences = [],
      priority = 'safest',
    } = req.body;

    // Parse departure date
    let depDate = new Date();
    if (departureTime) {
      const parsed = new Date(departureTime);
      if (!isNaN(parsed.getTime())) depDate = parsed;
    }

    // Layer 1: Candidate Route Generation
    const routingResult = await RoutingService.getCandidateRoutes(origin, destination, modeOfTransport);

    // Layer 2: Safety Intelligence & Weighted Scoring
    const evaluatedScores = new Map<string, EvaluatedRouteScore>();
    routingResult.routes.forEach((route) => {
      const score = SafetyIntelligenceService.evaluateRoute(route, depDate, preferences);
      evaluatedScores.set(route.routeId, score);
    });

    // Layer 3: AI Reasoning & Anti-Hallucination Recommendation Generation
    const recommendation = await AiReasoningService.generateRecommendation(
      {
        origin: routingResult.originAddress,
        destination: routingResult.destAddress,
        departureTime: depDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric' }),
        modeOfTransport,
        numberOfTravellers,
        preferences,
        priority,
      },
      routingResult.routes,
      evaluatedScores
    );

    ResponseHelper.success(res, 'AI Specific Route Safety Recommendation generated', recommendation);
  } catch (error) {
    next(error);
  }
};
