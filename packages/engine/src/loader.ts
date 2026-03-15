/**
 * Suite Loader — parse YAML suite files and validate with zod schemas.
 */

import { readFile } from 'node:fs/promises';
import { parse as parseYAML } from 'yaml';
import { ZodError } from 'zod';
import { SuiteDefinitionSchema } from './schema.js';
import type { SuiteDefinition } from './types.js';

export class SuiteLoader {
  /**
   * Load a suite definition from a YAML file path.
   */
  async loadFile(filePath: string): Promise<SuiteDefinition> {
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to read suite file "${filePath}": ${message}`);
    }
    return this.loadString(content, filePath);
  }

  /**
   * Load a suite definition from a YAML string.
   * @param source Optional source identifier for error messages.
   */
  loadString(content: string, source?: string): SuiteDefinition {
    const label = source ?? '<string>';

    let raw: unknown;
    try {
      raw = parseYAML(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Invalid YAML in "${label}": ${message}`);
    }

    if (raw === null || raw === undefined || typeof raw !== 'object') {
      throw new Error(`Suite definition in "${label}" must be a YAML object`);
    }

    try {
      return SuiteDefinitionSchema.parse(raw);
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues
          .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
          .join('\n');
        throw new Error(`Invalid suite definition in "${label}":\n${issues}`);
      }
      throw err;
    }
  }
}
