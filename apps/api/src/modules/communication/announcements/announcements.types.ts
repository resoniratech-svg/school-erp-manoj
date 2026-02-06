/**
 * Announcements Types
 */
import type { AnnouncementResponse } from '../communication.types';

export interface AnnouncementListResponse {
    announcements: AnnouncementResponse[];
    total: number;
}
