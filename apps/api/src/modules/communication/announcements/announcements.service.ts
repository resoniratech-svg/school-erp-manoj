/**
 * Announcements Service
 */
import { communicationService } from '../communication.service';
import type { AnnouncementResponse, CommunicationContext } from '../communication.types';
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from '../communication.validator';

export class AnnouncementsService {
    async create(input: CreateAnnouncementInput, context: CommunicationContext): Promise<AnnouncementResponse> {
        return communicationService.createAnnouncement(input, context);
    }

    async getById(id: string, context: CommunicationContext): Promise<AnnouncementResponse> {
        return communicationService.getAnnouncementById(id, context);
    }

    async list(
        filters: { status?: string; targetGroup?: string },
        context: CommunicationContext
    ): Promise<AnnouncementResponse[]> {
        return communicationService.listAnnouncements(filters, context);
    }

    async update(id: string, input: UpdateAnnouncementInput, context: CommunicationContext): Promise<AnnouncementResponse> {
        return communicationService.updateAnnouncement(id, input, context);
    }

    async publish(id: string, context: CommunicationContext): Promise<AnnouncementResponse> {
        return communicationService.publishAnnouncement(id, context);
    }

    async archive(id: string, context: CommunicationContext): Promise<AnnouncementResponse> {
        return communicationService.archiveAnnouncement(id, context);
    }
}

export const announcementsService = new AnnouncementsService();
