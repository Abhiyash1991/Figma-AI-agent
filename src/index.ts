/**
 * Figma to Code Agent
 * Main entry point for programmatic usage
 */

export { FigmaToCodeAgent, AgentConfig, ConversionProgress, ProgressCallback } from './agent';
export { FigmaClient, FigmaClientConfig } from './figma';
export { ClaudeClient, ClaudeClientConfig } from './ai';
export { DesignParser } from './parser';
export { ComponentGenerator, StyleGenerator, TestGenerator } from './generators';
export * from './types';
