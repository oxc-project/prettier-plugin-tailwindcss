/**
 * Batch sorting API for external tools (like oxfmt)
 * 
 * This provides a simplified interface to sort multiple class strings
 * without going through Prettier's full parsing pipeline.
 */

import { getTailwindConfig } from './config.js'
import { sortClasses } from './sorting.js'
import type { ParserOptions } from 'prettier'
import type { TransformerEnv, UnifiedApi } from './types'

export interface BatchSortOptions {
  /**
   * Path to Tailwind config file (v3)
   * e.g., './tailwind.config.js'
   */
  tailwindConfig?: string
  
  /**
   * Path to Tailwind stylesheet (v4)
   * e.g., './src/app.css'
   */
  tailwindStylesheet?: string
  
  /**
   * Tailwind package name (for monorepos)
   * @default 'tailwindcss'
   */
  tailwindPackageName?: string
  
  /**
   * Preserve whitespace around classes
   * @default false
   */
  tailwindPreserveWhitespace?: boolean
  
  /**
   * Preserve duplicate classes
   * @default false
   */
  tailwindPreserveDuplicates?: boolean
  
  /**
   * Current working directory (for resolving paths)
   * @default process.cwd()
   */
  cwd?: string
}

export interface BatchSortContext {
  /**
   * Sort an array of class strings
   * @param classes - Array of class attribute values
   * @returns Array of sorted class strings (same order as input)
   */
  sortClasses(classes: string[]): string[]
  
  /**
   * Sort a single class string
   * @param classStr - Single class attribute value
   * @returns Sorted class string
   */
  sortClass(classStr: string): string
}

/**
 * Initialize a batch sorting context
 * 
 * @example
 * ```ts
 * const sorter = await createBatchSorter({
 *   tailwindConfig: './tailwind.config.js'
 * })
 * 
 * const sorted = sorter.sortClasses([
 *   'bg-blue-500 text-white px-4 py-2',
 *   'flex items-center justify-between'
 * ])
 * ```
 */
export async function createBatchSorter(
  options: BatchSortOptions = {}
): Promise<BatchSortContext> {
  // Build minimal ParserOptions for getTailwindConfig
  const parserOptions: Partial<ParserOptions> = {
    filepath: options.cwd ?? process.cwd(),
    tailwindConfig: options.tailwindConfig,
    tailwindStylesheet: options.tailwindStylesheet,
    tailwindPackageName: options.tailwindPackageName,
    tailwindPreserveWhitespace: options.tailwindPreserveWhitespace,
    tailwindPreserveDuplicates: options.tailwindPreserveDuplicates,
  }
  
  // Load Tailwind context once
  const context: UnifiedApi = await getTailwindConfig(parserOptions as any)
  
  // Create transformer env (minimal - no matcher or parsers needed)
  const env: TransformerEnv = {
    context,
    matcher: null as any, // Not needed for basic sorting
    parsers: {},
    options: parserOptions as any,
  }
  
  return {
    sortClasses(classes: string[]): string[] {
      return classes.map(classStr => {
        try {
          return sortClasses(classStr, { env })
        } catch (err) {
          // On error, return original string
          console.error(`[prettier-plugin-tailwindcss] Failed to sort classes: ${classStr}`, err)
          return classStr
        }
      })
    },
    
    sortClass(classStr: string): string {
      try {
        return sortClasses(classStr, { env })
      } catch (err) {
        console.error(`[prettier-plugin-tailwindcss] Failed to sort classes: ${classStr}`, err)
        return classStr
      }
    }
  }
}
