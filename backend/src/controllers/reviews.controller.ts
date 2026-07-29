import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import { NotFoundError, UnauthorizedError } from '../utils/errors';

// Helper to recalculate Safe Place averages
const updatePlaceAverages = async (placeId: string) => {
  const reviews = await prisma.placeReview.findMany({
    where: { placeId },
  });

  if (reviews.length === 0) return;

  const sumRating = reviews.reduce((acc, r) => acc + r.rating, 0);
  const sumLighting = reviews.reduce((acc, r) => acc + r.lighting, 0);
  const sumAccessibility = reviews.reduce((acc, r) => acc + r.cleanliness, 0); // Cleanup map score

  await prisma.safePlace.update({
    where: { placeId },
    data: {
      averageRating: sumRating / reviews.length,
      lightingScore: (sumLighting / reviews.length) * 2, // Map 1-5 score to 0-10 scale
    },
  });
};

export const createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { placeId, rating, lighting, crowd, cleanliness, security, comment } = req.body;

    const place = await prisma.safePlace.findUnique({ where: { placeId } });
    if (!place) throw new NotFoundError('Safe place not found');

    const newReview = await prisma.placeReview.create({
      data: {
        userId,
        placeId,
        rating,
        lighting,
        crowd,
        cleanliness,
        security,
        comment,
      },
    });

    await updatePlaceAverages(placeId);

    // Fetch user info for socket trigger
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { fullName: true },
    });

    socketManager.emitToRoom(`place:${placeId}`, 'new-review', {
      review: newReview,
      userName: user?.fullName,
    });

    ResponseHelper.success(res, 'Review added successfully', newReview, 201);
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const updateData = req.body;

    const review = await prisma.placeReview.findUnique({ where: { reviewId: id } });
    if (!review) throw new NotFoundError('Review not found');

    if (review.userId !== userId) {
      throw new UnauthorizedError('Access Denied: Only the review creator can edit this review.');
    }

    const updatedReview = await prisma.placeReview.update({
      where: { reviewId: id },
      data: updateData,
    });

    await updatePlaceAverages(review.placeId);

    socketManager.emitToRoom(`place:${review.placeId}`, 'review-updated', updatedReview);
    ResponseHelper.success(res, 'Review updated successfully', updatedReview);
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const review = await prisma.placeReview.findUnique({ where: { reviewId: id } });
    if (!review) throw new NotFoundError('Review not found');

    if (review.userId !== userId) {
      throw new UnauthorizedError('Access Denied: Only the review creator can delete this review.');
    }

    await prisma.placeReview.delete({ where: { reviewId: id } });
    await updatePlaceAverages(review.placeId);

    ResponseHelper.success(res, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const listPlaceReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // Place ID
    const reviews = await prisma.placeReview.findMany({
      where: { placeId: id },
      include: {
        user: {
          select: { fullName: true, profileImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    ResponseHelper.success(res, 'Place reviews listed successfully', reviews);
  } catch (error) {
    next(error);
  }
};
