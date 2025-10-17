/**
 * Output Formatter
 * Formats CLI output with colors and structure
 */

export type ColorCode = 'reset' | 'bright' | 'red' | 'green' | 'yellow' | 'blue' | 'cyan' | 'white'

export interface Colors {
  reset: string
  bright: string
  red: string
  green: string
  yellow: string
  blue: string
  cyan: string
  white: string
}

// ANSI color codes
const COLORS: Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

/**
 * Check if terminal supports colors
 */
export function supportsColor(): boolean {
  if (process.env.NO_COLOR) return false
  if (process.env.FORCE_COLOR) return true
  if (process.platform === 'win32') return true
  return process.stdout.isTTY !== false
}

/**
 * Get colors (disabled if terminal doesn't support)
 */
export function getColors(): Colors {
  return supportsColor() ? COLORS : getDisabledColors()
}

/**
 * Get disabled colors (all return empty string)
 */
function getDisabledColors(): Colors {
  return {
    reset: '',
    bright: '',
    red: '',
    green: '',
    yellow: '',
    blue: '',
    cyan: '',
    white: '',
  }
}

/**
 * Colorize text
 */
export function colorize(text: string, color: ColorCode): string {
  const colors = getColors()
  return `${colors[color]}${text}${colors.reset}`
}

/**
 * Format success message
 */
export function success(message: string): string {
  return `${colorize('✓', 'green')} ${message}`
}

/**
 * Format error message
 */
export function error(message: string): string {
  return `${colorize('✗', 'red')} ${message}`
}

/**
 * Format warning message
 */
export function warning(message: string): string {
  return `${colorize('⚠', 'yellow')} ${message}`
}

/**
 * Format info message
 */
export function info(message: string): string {
  return `${colorize('ℹ', 'cyan')} ${message}`
}

/**
 * Format header
 */
export function header(title: string): string {
  const colors = getColors()
  return `\n${colors.bright}${colors.blue}${title}${colors.reset}\n`
}

/**
 * Format section
 */
export function section(title: string): string {
  const colors = getColors()
  return `${colors.bright}${title}${colors.reset}\n`
}

/**
 * Format key-value pair
 */
export function keyValue(key: string, value: string, indent = 0): string {
  const colors = getColors()
  const padding = ' '.repeat(indent)
  return `${padding}${colors.cyan}${key}:${colors.reset} ${value}`
}

/**
 * Format list item
 */
export function listItem(item: string, indent = 0): string {
  const padding = ' '.repeat(indent)
  return `${padding}• ${item}`
}

/**
 * Format progress bar
 */
export function progressBar(current: number, total: number, width = 30): string {
  const percentage = Math.round((current / total) * 100)
  const filled = Math.round((current / total) * width)
  const empty = width - filled

  const colors = getColors()
  const bar = `${colors.green}${'█'.repeat(filled)}${colors.reset}${'░'.repeat(empty)}`

  return `[${bar}] ${percentage}%`
}

/**
 * Format table
 */
export function table(
  headers: string[],
  rows: string[][],
  options?: { border?: boolean; align?: 'left' | 'center' | 'right' }
): string {
  const colWidths = headers.map((h) => h.length)

  // Calculate column widths based on content
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      colWidths[i] = Math.max(colWidths[i], row[i].length)
    }
  }

  let output = ''

  // Header
  const headerRow = headers
    .map((h, i) => padString(h, colWidths[i], options?.align || 'left'))
    .join(' | ')
  output += headerRow + '\n'
  output += '-'.repeat(headerRow.length) + '\n'

  // Rows
  for (const row of rows) {
    const formattedRow = row
      .map((cell, i) => padString(cell, colWidths[i], options?.align || 'left'))
      .join(' | ')
    output += formattedRow + '\n'
  }

  return output
}

/**
 * Pad string to width
 */
function padString(str: string, width: number, align: 'left' | 'center' | 'right'): string {
  const padding = Math.max(0, width - str.length)

  if (align === 'right') {
    return ' '.repeat(padding) + str
  } else if (align === 'center') {
    const leftPad = Math.floor(padding / 2)
    const rightPad = padding - leftPad
    return ' '.repeat(leftPad) + str + ' '.repeat(rightPad)
  }

  return str + ' '.repeat(padding)
}

/**
 * Format time duration
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Clear line
 */
export function clearLine(): string {
  return '\r' + ' '.repeat(80) + '\r'
}

/**
 * Show spinner
 */
export function spinner(frame: number): string {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  return frames[frame % frames.length]
}
