import { FigmaClient } from './client';

describe('FigmaClient', () => {
  describe('extractFileKey', () => {
    it('extracts file key from standard Figma URL', () => {
      const url = 'https://www.figma.com/file/ABC123xyz/My-Design-File';
      expect(FigmaClient.extractFileKey(url)).toBe('ABC123xyz');
    });

    it('extracts file key from design URL format', () => {
      const url = 'https://www.figma.com/design/DEF456abc/Another-File';
      expect(FigmaClient.extractFileKey(url)).toBe('DEF456abc');
    });

    it('handles URL with query parameters', () => {
      const url = 'https://www.figma.com/file/GHI789xyz/File?node-id=1:234&mode=dev';
      expect(FigmaClient.extractFileKey(url)).toBe('GHI789xyz');
    });

    it('returns input if already a file key', () => {
      const key = 'ABC123xyz';
      expect(FigmaClient.extractFileKey(key)).toBe('ABC123xyz');
    });

    it('throws error for invalid URL', () => {
      const invalidUrl = 'https://example.com/not-figma';
      expect(() => FigmaClient.extractFileKey(invalidUrl)).toThrow('Invalid Figma URL');
    });

    it('handles URL without www', () => {
      const url = 'https://figma.com/file/ABC123/Design';
      expect(FigmaClient.extractFileKey(url)).toBe('ABC123');
    });
  });

  describe('extractNodeId', () => {
    it('extracts node ID from URL with node-id parameter', () => {
      const url = 'https://www.figma.com/file/ABC123/File?node-id=1:234';
      expect(FigmaClient.extractNodeId(url)).toBe('1:234');
    });

    it('extracts URL-encoded node ID', () => {
      const url = 'https://www.figma.com/file/ABC123/File?node-id=1%3A234';
      expect(FigmaClient.extractNodeId(url)).toBe('1:234');
    });

    it('returns null when no node ID present', () => {
      const url = 'https://www.figma.com/file/ABC123/File';
      expect(FigmaClient.extractNodeId(url)).toBeNull();
    });

    it('handles multiple query parameters', () => {
      const url = 'https://www.figma.com/file/ABC123/File?mode=dev&node-id=5:678&viewport=123';
      expect(FigmaClient.extractNodeId(url)).toBe('5:678');
    });
  });
});
