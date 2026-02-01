/**
 * Validation utilities for image processing
 */

// Limits
export const LIMITS = {
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024, // 20MB per file
  MAX_TOTAL_SIZE_BYTES: 150 * 1024 * 1024, // 150MB total
  MAX_FILE_COUNT: 200,
  MAX_DIMENSION_PX: 8000, // 8000x8000 max
  MIN_DIMENSION_PX: 1,
  MAX_GRID_DIMENSION: 20, // Max rows or columns before warning
  MIN_CELL_SIZE_MM: 10, // Minimum useful cell size
  MAX_PAGES_WARNING: 50, // Warn if more than this many pages
  MAX_PAGES_ERROR: 500, // Error if more than this many pages
};

// A4 dimensions in mm
export const A4_PORTRAIT = { width: 210, height: 297 };
export const A4_LANDSCAPE = { width: 297, height: 210 };
const MARGIN_MM = 6;
const GAP_MM = 2;

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if file is animated (GIF or APNG)
 */
export function isAnimatedFormat(file) {
  const name = file.name.toLowerCase();
  return name.endsWith('.gif') || name.endsWith('.apng');
}

/**
 * Check if file is SVG
 */
export function isSvgFormat(file) {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
}

/**
 * Validate a single file before processing
 * Returns { valid: boolean, error?: string, warning?: string }
 */
export function validateFile(file, totalSizeSoFar = 0) {
  const result = { valid: true, warnings: [] };

  // Check file size
  if (file.size === 0) {
    return { valid: false, error: `"${file.name}" is empty (0 bytes)` };
  }

  if (file.size > LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `"${file.name}" is too large (${formatFileSize(file.size)}). Max: ${formatFileSize(LIMITS.MAX_FILE_SIZE_BYTES)}`
    };
  }

  if (totalSizeSoFar + file.size > LIMITS.MAX_TOTAL_SIZE_BYTES) {
    return {
      valid: false,
      error: `Total batch size would exceed ${formatFileSize(LIMITS.MAX_TOTAL_SIZE_BYTES)} limit`
    };
  }

  // Check for animated formats
  if (isAnimatedFormat(file)) {
    result.warnings.push(`"${file.name}" is animated. Only the first frame will be used.`);
  }

  // Check for SVG
  if (isSvgFormat(file)) {
    result.warnings.push(`"${file.name}" is an SVG. It may not render at optimal quality.`);
  }

  return result;
}

/**
 * Validate image dimensions after loading
 * Returns { valid: boolean, error?: string, warnings: string[] }
 */
export function validateImageDimensions(width, height, filename) {
  const result = { valid: true, warnings: [] };

  if (width === 0 || height === 0) {
    return { valid: false, error: `"${filename}" has invalid dimensions (${width}x${height})` };
  }

  if (width < LIMITS.MIN_DIMENSION_PX || height < LIMITS.MIN_DIMENSION_PX) {
    result.warnings.push(`"${filename}" is very small (${width}x${height}px)`);
  }

  if (width > LIMITS.MAX_DIMENSION_PX || height > LIMITS.MAX_DIMENSION_PX) {
    result.warnings.push(`"${filename}" is very large (${width}x${height}px). This may slow down processing.`);
  }

  // Check extreme aspect ratio
  const aspectRatio = width / height;
  if (aspectRatio > 10 || aspectRatio < 0.1) {
    result.warnings.push(`"${filename}" has an extreme aspect ratio and may appear as a thin strip`);
  }

  return result;
}

/**
 * Calculate cell dimensions for given settings
 */
export function calculateCellSize(rows, cols, orientation) {
  const pageSize = orientation === 'landscape' ? A4_LANDSCAPE : A4_PORTRAIT;
  const usableW = pageSize.width - 2 * MARGIN_MM;
  const usableH = pageSize.height - 2 * MARGIN_MM;
  const cellW = (usableW - (cols - 1) * GAP_MM) / cols;
  const cellH = (usableH - (rows - 1) * GAP_MM) / rows;
  return { cellW, cellH };
}

/**
 * Validate grid configuration
 * Returns { warnings: string[], errors: string[] }
 */
export function validateGridConfig(rows, cols, imageCount, orientation) {
  const warnings = [];
  const errors = [];

  // Check grid dimensions
  if (rows > LIMITS.MAX_GRID_DIMENSION || cols > LIMITS.MAX_GRID_DIMENSION) {
    warnings.push(`Large grid (${rows}x${cols}) will create very small cells`);
  }

  // Calculate cell size
  const { cellW, cellH } = calculateCellSize(rows, cols, orientation);

  if (cellW < LIMITS.MIN_CELL_SIZE_MM || cellH < LIMITS.MIN_CELL_SIZE_MM) {
    warnings.push(`Cell size is very small (${cellW.toFixed(1)}x${cellH.toFixed(1)} mm). Images may be hard to see.`);
  }

  // Check page count
  const imagesPerPage = rows * cols;
  const pageCount = imageCount > 0 ? Math.ceil(imageCount / imagesPerPage) : 0;

  if (pageCount > LIMITS.MAX_PAGES_ERROR) {
    errors.push(`Configuration would create ${pageCount} pages. Maximum is ${LIMITS.MAX_PAGES_ERROR}.`);
  } else if (pageCount > LIMITS.MAX_PAGES_WARNING) {
    warnings.push(`This will create ${pageCount} pages. Generation may be slow.`);
  }

  return { warnings, errors, cellW, cellH, pageCount };
}

/**
 * Validate file count
 */
export function validateFileCount(count) {
  if (count > LIMITS.MAX_FILE_COUNT) {
    return {
      valid: false,
      error: `Too many files (${count}). Maximum is ${LIMITS.MAX_FILE_COUNT} files at once.`
    };
  }
  return { valid: true };
}

/**
 * Check browser support for required features
 */
export function checkBrowserSupport() {
  const issues = [];

  if (typeof FileReader === 'undefined') {
    issues.push('FileReader API not supported');
  }

  if (typeof URL === 'undefined' || typeof URL.createObjectURL === 'undefined') {
    issues.push('Blob URL creation not supported');
  }

  if (typeof Blob === 'undefined') {
    issues.push('Blob API not supported');
  }

  return {
    supported: issues.length === 0,
    issues
  };
}
