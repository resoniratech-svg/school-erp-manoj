/**
 * Files Client
 */
import { apiClient } from '../core/axios';
import type { ApiResponse } from '../types/api-response';

// Types
export interface FileAsset {
    id: string;
    entityType: string;
    entityId: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: Date;
}

export interface UploadResponse {
    file: FileAsset;
    uploadUrl?: string;
}

export interface SignedUrlResponse {
    url: string;
    expiresAt: Date;
}

/**
 * Files Client
 */
export const filesClient = {
    /**
     * Upload file
     */
    async upload(
        entityType: string,
        entityId: string,
        file: File
    ): Promise<FileAsset> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);

        const response = await apiClient.post<ApiResponse<FileAsset>>(
            '/api/v1/files/upload',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data.data;
    },

    /**
     * Get files by entity
     */
    async getByEntity(entityType: string, entityId: string): Promise<FileAsset[]> {
        const response = await apiClient.get<ApiResponse<FileAsset[]>>(
            `/api/v1/files/entity/${entityType}/${entityId}`
        );
        return response.data.data;
    },

    /**
     * Get download URL
     */
    async getDownloadUrl(fileId: string): Promise<SignedUrlResponse> {
        const response = await apiClient.get<ApiResponse<SignedUrlResponse>>(
            `/api/v1/files/${fileId}/download`
        );
        return response.data.data;
    },

    /**
     * Delete file
     */
    async delete(fileId: string): Promise<void> {
        await apiClient.delete(`/api/v1/files/${fileId}`);
    },

    /**
     * Download file directly
     */
    async download(fileId: string): Promise<Blob> {
        const { url } = await this.getDownloadUrl(fileId);
        const response = await apiClient.get(url, {
            responseType: 'blob',
        });
        return response.data;
    },
};
