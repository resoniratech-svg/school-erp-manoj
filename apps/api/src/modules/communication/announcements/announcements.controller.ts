/**
 * Announcements Controller
 */
import { communicationController } from '../communication.controller';

export const announcementsController = {
    create: communicationController.createAnnouncement,
    get: communicationController.getAnnouncement,
    list: communicationController.listAnnouncements,
    update: communicationController.updateAnnouncement,
    publish: communicationController.publishAnnouncement,
    archive: communicationController.archiveAnnouncement,
};
