/**
 * Agent Framework Adapters
 *
 * Pre-built integrations for popular agent frameworks.
 */

// Base types and utilities
export type { AgreementGuardAdapter, CaptureParams } from './base';
export { DEFAULT_SYSTEM_PROMPT } from './base';

// Claude/Anthropic
export { ClaudeAdapter } from './claude';
export type { ClaudeToolDefinition, ClaudeToolInput } from './claude';

// OpenAI
export { OpenAIAdapter } from './openai';
export type { OpenAIFunctionDefinition, OpenAIToolDefinition, OpenAIFunctionInput } from './openai';

// LangChain
export { AgreementGuardTool, createAgreementGuardTool } from './langchain';
export type { LangChainToolInput } from './langchain';

// OpenClaw
export { OpenClawAdapter } from './openclaw';
export type {
  OpenClawSkillDefinition,
  OpenClawActionContext,
  OpenClawHookResult,
  OpenClawSkillInput
} from './openclaw';
