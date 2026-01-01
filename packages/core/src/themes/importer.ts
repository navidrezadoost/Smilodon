/**
 * Design Token Importer
 * Convert design tokens from Figma, Adobe XD, and other design tools to CSS variables
 * 
 * Supports:
 * - Figma Variables API
 * - Adobe XD Design Tokens
 * - Design Tokens Format (W3C Community Group spec)
 * - Style Dictionary format
 * 
 * Usage:
 *   import { importTokens, applyTokens } from '@smilodon/core/themes/importer';
 *   
 *   const tokens = await importTokens('figma', figmaData);
 *   applyTokens(selectElement, tokens);
 */

/**
 * Design token types
 */
export interface DesignToken {
  $type?: string;
  $value: string | number | DesignToken;
  $description?: string;
}

export interface DesignTokens {
  [key: string]: DesignToken | DesignTokens;
}

export interface CSSVariable {
  name: string;
  value: string;
  category?: string;
  description?: string;
}

/**
 * Token categories for CSS variable naming
 */
const TOKEN_CATEGORIES = {
  color: 'color',
  dimension: 'size',
  fontFamily: 'font',
  fontWeight: 'font',
  fontSize: 'font',
  lineHeight: 'font',
  spacing: 'space',
  borderRadius: 'radius',
  borderWidth: 'border',
  shadow: 'shadow',
  duration: 'duration',
  cubicBezier: 'ease',
} as const;

/**
 * Import design tokens from various sources
 */
export async function importTokens(
  source: 'figma' | 'adobe-xd' | 'tokens-studio' | 'style-dictionary' | 'json',
  data: any
): Promise<Map<string, CSSVariable>> {
  switch (source) {
    case 'figma':
      return importFigmaTokens(data);
    case 'adobe-xd':
      return importAdobeXDTokens(data);
    case 'tokens-studio':
      return importTokensStudioTokens(data);
    case 'style-dictionary':
      return importStyleDictionaryTokens(data);
    case 'json':
      return importGenericTokens(data);
    default:
      throw new Error(`Unsupported token source: ${source}`);
  }
}

/**
 * Import Figma Variables API format
 * 
 * Example Figma export:
 * {
 *   "colors": {
 *     "primary": { "$type": "color", "$value": "#007aff" },
 *     "background": { "$type": "color", "$value": "#ffffff" }
 *   },
 *   "spacing": {
 *     "sm": { "$type": "dimension", "$value": "8px" }
 *   }
 * }
 */
export function importFigmaTokens(data: any): Map<string, CSSVariable> {
  const cssVars = new Map<string, CSSVariable>();
  
  function traverse(obj: any, prefix: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object') {
        if ('$value' in value) {
          // This is a token
          const token = value as DesignToken;
          const varName = `--ns-${prefix}${kebabCase(key)}`;
          const varValue = convertTokenValue(token.$value, token.$type);
          
          cssVars.set(varName, {
            name: varName,
            value: varValue,
            category: prefix ? prefix.slice(0, -1) : undefined,
            description: token.$description,
          });
        } else {
          // This is a group, traverse deeper
          traverse(value, `${prefix}${kebabCase(key)}-`);
        }
      }
    }
  }
  
  traverse(data);
  return cssVars;
}

/**
 * Import Adobe XD design tokens
 * 
 * Example Adobe XD export:
 * {
 *   "colors": [
 *     { "name": "Primary Blue", "value": "#007aff" }
 *   ],
 *   "textStyles": [
 *     { "name": "Body", "fontSize": 16, "fontFamily": "SF Pro" }
 *   ]
 * }
 */
export function importAdobeXDTokens(data: any): Map<string, CSSVariable> {
  const cssVars = new Map<string, CSSVariable>();
  
  // Colors
  if (data.colors && Array.isArray(data.colors)) {
    data.colors.forEach((color: any) => {
      const varName = `--ns-color-${kebabCase(color.name)}`;
      cssVars.set(varName, {
        name: varName,
        value: color.value,
        category: 'color',
      });
    });
  }
  
  // Text Styles
  if (data.textStyles && Array.isArray(data.textStyles)) {
    data.textStyles.forEach((style: any) => {
      const baseName = kebabCase(style.name);
      
      if (style.fontSize) {
        const varName = `--ns-font-size-${baseName}`;
        cssVars.set(varName, {
          name: varName,
          value: `${style.fontSize / 16}rem`,
          category: 'font',
        });
      }
      
      if (style.fontFamily) {
        const varName = `--ns-font-family-${baseName}`;
        cssVars.set(varName, {
          name: varName,
          value: `'${style.fontFamily}', sans-serif`,
          category: 'font',
        });
      }
      
      if (style.fontWeight) {
        const varName = `--ns-font-weight-${baseName}`;
        cssVars.set(varName, {
          name: varName,
          value: String(style.fontWeight),
          category: 'font',
        });
      }
      
      if (style.lineHeight) {
        const varName = `--ns-line-height-${baseName}`;
        cssVars.set(varName, {
          name: varName,
          value: String(style.lineHeight),
          category: 'font',
        });
      }
    });
  }
  
  // Character Styles (spacing, etc.)
  if (data.characterStyles && Array.isArray(data.characterStyles)) {
    data.characterStyles.forEach((style: any) => {
      if (style.letterSpacing) {
        const varName = `--ns-letter-spacing-${kebabCase(style.name)}`;
        cssVars.set(varName, {
          name: varName,
          value: `${style.letterSpacing}em`,
          category: 'font',
        });
      }
    });
  }
  
  return cssVars;
}

/**
 * Import Tokens Studio (Figma plugin) format
 */
export function importTokensStudioTokens(data: any): Map<string, CSSVariable> {
  // Tokens Studio uses similar format to Design Tokens spec
  return importFigmaTokens(data);
}

/**
 * Import Style Dictionary format
 * 
 * Example:
 * {
 *   "color": {
 *     "primary": { "value": "#007aff" }
 *   }
 * }
 */
export function importStyleDictionaryTokens(data: any): Map<string, CSSVariable> {
  const cssVars = new Map<string, CSSVariable>();
  
  function traverse(obj: any, path: string[] = []) {
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object') {
        if ('value' in value) {
          // This is a token
          const varName = `--ns-${path.concat(key).map(kebabCase).join('-')}`;
          const varValue = String(value.value);
          
          // Type guard for token properties
          const tokenValue = value as any;
          const description = tokenValue.comment || tokenValue.description || '';
          
          cssVars.set(varName, {
            name: varName,
            value: varValue,
            category: path[0],
            description,
          });
        } else {
          // Traverse deeper
          traverse(value, path.concat(key));
        }
      }
    }
  }
  
  traverse(data);
  return cssVars;
}

/**
 * Import generic JSON token format
 */
export function importGenericTokens(data: any): Map<string, CSSVariable> {
  // Try to detect format
  if (data.$type || data.$value || Object.values(data).some((v: any) => v?.$type)) {
    return importFigmaTokens(data);
  }
  
  if (data.colors || data.textStyles) {
    return importAdobeXDTokens(data);
  }
  
  if (Object.values(data).some((v: any) => v?.value)) {
    return importStyleDictionaryTokens(data);
  }
  
  throw new Error('Could not detect token format. Please specify source type.');
}

/**
 * Convert token value to CSS value
 */
function convertTokenValue(value: any, type?: string): string {
  if (typeof value === 'string') {
    // Check for token references like {color.primary}
    if (value.startsWith('{') && value.endsWith('}')) {
      const refPath = value.slice(1, -1);
      return `var(--ns-${kebabCase(refPath.replace(/\./g, '-'))})`;
    }
    return value;
  }
  
  if (typeof value === 'number') {
    if (type === 'dimension' || type === 'spacing' || type === 'borderRadius') {
      return `${value / 16}rem`; // Convert px to rem
    }
    return String(value);
  }
  
  if (typeof value === 'object') {
    // Handle rgba objects
    if ('r' in value && 'g' in value && 'b' in value) {
      const { r, g, b, a = 1 } = value;
      return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    }
    
    // Handle shadow objects
    if ('x' in value && 'y' in value && 'blur' in value) {
      const { x, y, blur, spread = 0, color = '#000000' } = value;
      return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
    }
  }
  
  return String(value);
}

/**
 * Apply CSS variables to an element
 */
export function applyTokens(
  element: HTMLElement,
  tokens: Map<string, CSSVariable>,
  options: {
    prefix?: string;
    scope?: 'element' | 'root';
  } = {}
): void {
  const { scope = 'element', prefix = '' } = options;
  const target = scope === 'root' ? document.documentElement : element;
  
  tokens.forEach((token) => {
    const varName = prefix ? `${prefix}${token.name}` : token.name;
    target.style.setProperty(varName, token.value);
  });
}

/**
 * Generate CSS stylesheet from tokens
 */
export function generateCSS(
  tokens: Map<string, CSSVariable>,
  options: {
    selector?: string;
    groupByCategory?: boolean;
    includeComments?: boolean;
  } = {}
): string {
  const {
    selector = ':host, smilodon-select',
    groupByCategory = true,
    includeComments = true,
  } = options;
  
  let css = `${selector} {\n`;
  
  if (groupByCategory) {
    // Group tokens by category
    const groups = new Map<string, CSSVariable[]>();
    
    tokens.forEach((token) => {
      const category = token.category || 'other';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(token);
    });
    
    // Generate CSS for each group
    groups.forEach((groupTokens, category) => {
      css += `  /* ${category.toUpperCase()} */\n`;
      
      groupTokens.forEach((token) => {
        if (includeComments && token.description) {
          css += `  /* ${token.description} */\n`;
        }
        css += `  ${token.name}: ${token.value};\n`;
      });
      
      css += '\n';
    });
  } else {
    // No grouping
    tokens.forEach((token) => {
      if (includeComments && token.description) {
        css += `  /* ${token.description} */\n`;
      }
      css += `  ${token.name}: ${token.value};\n`;
    });
  }
  
  css += '}\n';
  return css;
}

/**
 * Export tokens to various formats
 */
export function exportTokens(
  tokens: Map<string, CSSVariable>,
  format: 'css' | 'json' | 'scss' | 'js' | 'ts'
): string {
  switch (format) {
    case 'css':
      return generateCSS(tokens);
    
    case 'json':
      return JSON.stringify(
        Array.from(tokens.values()).map((t) => ({
          name: t.name,
          value: t.value,
          category: t.category,
          description: t.description,
        })),
        null,
        2
      );
    
    case 'scss':
      let scss = '';
      tokens.forEach((token) => {
        const scssVarName = token.name.replace(/^--ns-/, '$ns-');
        scss += `${scssVarName}: ${token.value};\n`;
      });
      return scss;
    
    case 'js':
      return `export const tokens = ${JSON.stringify(
        Object.fromEntries(
          Array.from(tokens.entries()).map(([key, value]) => [
            key.replace(/^--ns-/, ''),
            value.value,
          ])
        ),
        null,
        2
      )};\n`;
    
    case 'ts':
      return (
        `export const tokens: Record<string, string> = ${JSON.stringify(
          Object.fromEntries(
            Array.from(tokens.entries()).map(([key, value]) => [
              key.replace(/^--ns-/, ''),
              value.value,
            ])
          ),
          null,
          2
        )};\n`
      );
    
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Utility: Convert string to kebab-case
 */
function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * CLI tool for token conversion
 * 
 * Usage:
 *   npx @smilodon/tokens import figma tokens.json --output theme.css
 *   npx @smilodon/tokens import adobe-xd design.json --output vars.css
 */
export async function cli(args: string[]): Promise<void> {
  const [command, source, inputFile, ...flags] = args;
  
  if (command !== 'import') {
    console.error('Usage: npx @smilodon/tokens import <source> <file> [--output file.css]');
    process.exit(1);
  }
  
  // Read input file
  const fs = await import('fs/promises');
  const inputData = JSON.parse(await fs.readFile(inputFile, 'utf-8'));
  
  // Import tokens
  const tokens = await importTokens(source as any, inputData);
  
  // Get output file
  const outputIndex = flags.indexOf('--output');
  const outputFile = outputIndex !== -1 ? flags[outputIndex + 1] : 'tokens.css';
  
  // Get format
  const formatIndex = flags.indexOf('--format');
  const format = (formatIndex !== -1 ? flags[formatIndex + 1] : 'css') as any;
  
  // Export tokens
  const output = exportTokens(tokens, format);
  
  // Write output
  await fs.writeFile(outputFile, output, 'utf-8');
  
}
