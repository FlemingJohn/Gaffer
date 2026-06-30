/**
 * Plain JSON-Schema definitions for QVAC's constrained decoding
 * (`responseFormat: { type: 'json_schema', json_schema: { name, schema } }`).
 *
 * Unlike `json_object` (which only nudges the model toward JSON), json_schema
 * constrains generation to this exact shape — so a small on-device model cannot
 * emit an out-of-enum `zone` or omit a required field. These mirror the Zod
 * schemas in schema.js; Zod still validates defensively after parsing.
 */

const ZONE_ENUM = ['left', 'centre-left', 'centre', 'centre-right', 'right', 'overall'];
const PHASE_ENUM = ['in-possession', 'out-of-possession', 'transition', 'set-piece'];

export const SIGNALS_JSON_SCHEMA = {
  name: 'tactical_signals',
  schema: {
    type: 'object',
    properties: {
      signals: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            zone: { type: 'string', enum: ZONE_ENUM },
            phase: { type: 'string', enum: PHASE_ENUM },
            severity: { type: 'integer', minimum: 1, maximum: 5 },
            evidence: { type: 'string' },
            players: { type: 'array', items: { type: 'string' } },
          },
          required: ['pattern', 'zone', 'phase', 'severity', 'evidence', 'players'],
          additionalProperties: false,
        },
      },
    },
    required: ['signals'],
    additionalProperties: false,
  },
};

export const CARD_JSON_SCHEMA = {
  name: 'halftime_card',
  schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      problems: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            issue: { type: 'string' },
            evidence: { type: 'string' },
          },
          required: ['issue', 'evidence'],
          additionalProperties: false,
        },
      },
      adjustments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            rationale: { type: 'string' },
            players: { type: 'array', items: { type: 'string' } },
          },
          required: ['action', 'rationale', 'players'],
          additionalProperties: false,
        },
      },
      drill: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          focus: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['name', 'focus', 'description'],
        additionalProperties: false,
      },
      grounding: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'integer', minimum: 1, maximum: 5 },
    },
    required: ['summary', 'problems', 'adjustments', 'drill', 'grounding', 'confidence'],
    additionalProperties: false,
  },
};
