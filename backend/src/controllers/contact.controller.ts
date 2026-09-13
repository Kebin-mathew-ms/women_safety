import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import ResponseHelper from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

export const listContacts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const contacts = await prisma.emergencyContact.findMany({
      where: { userId },
      orderBy: [
        { isPrimary: 'desc' },
        { priority: 'asc' },
      ],
    });

    ResponseHelper.success(res, 'Emergency contacts fetched successfully', contacts);
  } catch (error) {
    next(error);
  }
};

export const addContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { name, phone, relationship, priority, isPrimary } = req.body;

    // Rule 1: Maximum 5 emergency contacts
    const contactCount = await prisma.emergencyContact.count({ where: { userId } });
    if (contactCount >= 5) {
      throw new BadRequestError('Maximum emergency contact limit (5) reached');
    }

    // Rule 2: No duplicate phone numbers
    const duplicatePhone = await prisma.emergencyContact.findFirst({
      where: { userId, phone },
    });
    if (duplicatePhone) {
      throw new BadRequestError('A contact with this phone number already exists');
    }

    // Rule 3: Enforce single primary contact
    // If it's the first contact, automatically make it primary.
    // If setting this one to primary, update all others to not primary.
    const shouldBePrimary = contactCount === 0 ? true : isPrimary;
    const finalPriority = priority ?? (contactCount + 1);

    await prisma.$transaction(async (tx) => {
      if (shouldBePrimary) {
        await tx.emergencyContact.updateMany({
          where: { userId },
          data: { isPrimary: false },
        });
      }

      const newContact = await tx.emergencyContact.create({
        data: {
          userId,
          name,
          phone,
          relationship,
          priority: finalPriority,
          isPrimary: shouldBePrimary,
        },
      });

      logger.info(`Emergency contact added for user ${userId}: ${name}`);
      ResponseHelper.success(res, 'Emergency contact added successfully', newContact, 201);
    });
  } catch (error) {
    next(error);
  }
};

export const editContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { name, phone, relationship, priority, isPrimary } = req.body;

    // Check contact exists and belongs to user
    const contact = await prisma.emergencyContact.findFirst({
      where: { contactId: id, userId },
    });

    if (!contact) {
      throw new NotFoundError('Emergency contact not found');
    }

    // Rule 2: No duplicate phone numbers (excluding this contact)
    if (phone && phone !== contact.phone) {
      const duplicatePhone = await prisma.emergencyContact.findFirst({
        where: { userId, phone, NOT: { contactId: id } },
      });
      if (duplicatePhone) {
        throw new BadRequestError('Another contact with this phone number already exists');
      }
    }

    await prisma.$transaction(async (tx) => {
      // Rule 3: Enforce single primary contact
      if (isPrimary === true && contact.isPrimary === false) {
        await tx.emergencyContact.updateMany({
          where: { userId },
          data: { isPrimary: false },
        });
      } else if (isPrimary === false && contact.isPrimary === true) {
        // Prevent unset primary if it's the only contact (cannot have zero primary contacts if some exist)
        const totalContacts = await tx.emergencyContact.count({ where: { userId } });
        if (totalContacts > 1) {
          // Find another contact and make it primary
          const anotherContact = await tx.emergencyContact.findFirst({
            where: { userId, NOT: { contactId: id } },
          });
          if (anotherContact) {
            await tx.emergencyContact.update({
              where: { contactId: anotherContact.contactId },
              data: { isPrimary: true },
            });
          }
        } else {
          // If only 1 contact, force it to remain primary
          req.body.isPrimary = true;
        }
      }

      const updatedContact = await tx.emergencyContact.update({
        where: { contactId: id },
        data: {
          name,
          phone,
          relationship,
          priority: priority ?? contact.priority,
          isPrimary: req.body.isPrimary ?? isPrimary,
        },
      });

      logger.info(`Emergency contact updated: ${id}`);
      ResponseHelper.success(res, 'Emergency contact updated successfully', updatedContact);
    });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Check contact exists and belongs to user
    const contact = await prisma.emergencyContact.findFirst({
      where: { contactId: id, userId },
    });

    if (!contact) {
      throw new NotFoundError('Emergency contact not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.emergencyContact.delete({
        where: { contactId: id },
      });

      // If we deleted the primary contact, nominate another contact to be primary
      if (contact.isPrimary) {
        const nextContact = await tx.emergencyContact.findFirst({
          where: { userId },
          orderBy: { priority: 'asc' },
        });
        
        if (nextContact) {
          await tx.emergencyContact.update({
            where: { contactId: nextContact.contactId },
            data: { isPrimary: true },
          });
          logger.info(`Promoted contact ${nextContact.contactId} to primary after deletion of ${id}`);
        }
      }

      logger.info(`Emergency contact deleted: ${id} by user: ${userId}`);
      ResponseHelper.success(res, 'Emergency contact deleted successfully');
    });
  } catch (error) {
    next(error);
  }
};
