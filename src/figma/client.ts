/**
 * Figma API Client
 * Handles communication with Figma REST API
 */

import axios, { AxiosInstance } from 'axios';
import { FigmaFile, FigmaNode } from '../types/figma';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

export interface FigmaClientConfig {
  accessToken: string;
}

export class FigmaClient {
  private client: AxiosInstance;

  constructor(config: FigmaClientConfig) {
    this.client = axios.create({
      baseURL: FIGMA_API_BASE,
      headers: {
        'X-Figma-Token': config.accessToken,
      },
    });
  }

  /**
   * Get a Figma file by its key
   */
  async getFile(fileKey: string): Promise<FigmaFile> {
    try {
      const response = await this.client.get(`/files/${fileKey}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Invalid Figma access token or insufficient permissions');
      }
      if (error.response?.status === 404) {
        throw new Error(`Figma file not found: ${fileKey}`);
      }
      throw new Error(`Failed to fetch Figma file: ${error.message}`);
    }
  }

  /**
   * Get specific nodes from a Figma file
   */
  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<Record<string, { document: FigmaNode }>> {
    try {
      const ids = nodeIds.join(',');
      const response = await this.client.get(`/files/${fileKey}/nodes`, {
        params: { ids },
      });
      return response.data.nodes;
    } catch (error: any) {
      throw new Error(`Failed to fetch Figma nodes: ${error.message}`);
    }
  }

  /**
   * Get images for specific nodes
   */
  async getImages(
    fileKey: string,
    nodeIds: string[],
    options: { format?: 'jpg' | 'png' | 'svg' | 'pdf'; scale?: number } = {}
  ): Promise<Record<string, string>> {
    try {
      const { format = 'png', scale = 2 } = options;
      const ids = nodeIds.join(',');
      const response = await this.client.get(`/images/${fileKey}`, {
        params: { ids, format, scale },
      });
      return response.data.images;
    } catch (error: any) {
      throw new Error(`Failed to fetch images: ${error.message}`);
    }
  }

  /**
   * Get component styles from a file
   */
  async getFileStyles(fileKey: string): Promise<any> {
    try {
      const response = await this.client.get(`/files/${fileKey}/styles`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch styles: ${error.message}`);
    }
  }

  /**
   * Get components from a file
   */
  async getFileComponents(fileKey: string): Promise<any> {
    try {
      const response = await this.client.get(`/files/${fileKey}/components`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch components: ${error.message}`);
    }
  }

  /**
   * Extract file key from Figma URL
   */
  static extractFileKey(figmaUrl: string): string {
    // Matches URLs like:
    // https://www.figma.com/file/ABC123/filename
    // https://www.figma.com/design/ABC123/filename
    const patterns = [
      /figma\.com\/file\/([a-zA-Z0-9]+)/,
      /figma\.com\/design\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = figmaUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // If no URL pattern matches, assume it's already a file key
    if (/^[a-zA-Z0-9]+$/.test(figmaUrl)) {
      return figmaUrl;
    }

    throw new Error('Invalid Figma URL or file key');
  }

  /**
   * Extract node ID from Figma URL if present
   */
  static extractNodeId(figmaUrl: string): string | null {
    // Matches node-id parameter in URL
    const match = figmaUrl.match(/node-id=([^&]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return null;
  }
}
