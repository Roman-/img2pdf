import { jsPDF } from 'jspdf';

// Constants
const MARGIN_MM = 6;
const GAP_MM = 2;

// A4 dimensions in mm
const A4_PORTRAIT = { width: 210, height: 297 };
const A4_LANDSCAPE = { width: 297, height: 210 };

/**
 * Converts hex color to RGB array
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

/**
 * Calculate render dimensions for image to fit in cell
 * - Preserves aspect ratio
 * - Does not upscale (scale <= 1.0)
 * - Downscales if needed to fit cell
 */
function calculateImageRenderSize(imgWPx, imgHPx, cellWMm, cellHMm) {
  // Approximate conversion: 1mm ≈ 3.78 pixels at 96 DPI
  const PX_PER_MM = 3.78;

  // Cell size in pixels
  const cellWPx = cellWMm * PX_PER_MM;
  const cellHPx = cellHMm * PX_PER_MM;

  // Calculate scale to fit cell while preserving aspect ratio
  const scaleX = cellWPx / imgWPx;
  const scaleY = cellHPx / imgHPx;
  let scale = Math.min(scaleX, scaleY);

  // Clamp scale to <= 1.0 (no upscaling)
  scale = Math.min(scale, 1.0);

  // Render size in mm
  const renderWMm = (imgWPx * scale) / PX_PER_MM;
  const renderHMm = (imgHPx * scale) / PX_PER_MM;

  return { renderWMm, renderHMm };
}

/**
 * Error class for PDF generation failures
 */
export class PdfGenerationError extends Error {
  constructor(message, type = 'unknown') {
    super(message);
    this.name = 'PdfGenerationError';
    this.type = type;
  }
}

/**
 * Generates a PDF from images
 * Returns { blob, pageCount } on success
 * Throws PdfGenerationError on failure
 */
export function generatePdf({
  images,
  rows,
  cols,
  orientation,
  gridEnabled,
  gridColor,
  gridThickness,
}) {
  // Validate inputs
  if (!images || images.length === 0) {
    throw new PdfGenerationError('No images provided', 'validation');
  }

  if (!rows || rows < 1) {
    throw new PdfGenerationError('Invalid rows value', 'validation');
  }

  if (!cols || cols < 1) {
    throw new PdfGenerationError('Invalid columns value', 'validation');
  }

  const pageSize = orientation === 'landscape' ? A4_LANDSCAPE : A4_PORTRAIT;
  const { width: pageW, height: pageH } = pageSize;

  let doc;
  try {
    doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation,
    });
  } catch {
    throw new PdfGenerationError(
      'Failed to initialize PDF generator. Please refresh the page and try again.',
      'initialization'
    );
  }

  // Calculate usable area and cell sizes
  const usableW = pageW - 2 * MARGIN_MM;
  const usableH = pageH - 2 * MARGIN_MM;
  const cellW = (usableW - (cols - 1) * GAP_MM) / cols;
  const cellH = (usableH - (rows - 1) * GAP_MM) / rows;

  // Validate cell size
  if (cellW <= 0 || cellH <= 0) {
    throw new PdfGenerationError(
      'Grid configuration results in invalid cell size. Please reduce rows or columns.',
      'validation'
    );
  }

  // Calculate pagination
  const imagesPerPage = rows * cols;
  const pageCount = Math.ceil(images.length / imagesPerPage);

  try {
    for (let page = 0; page < pageCount; page++) {
      if (page > 0) {
        doc.addPage('a4', orientation);
      }

      // Place images for this page
      const startIdx = page * imagesPerPage;
      const endIdx = Math.min(startIdx + imagesPerPage, images.length);

      for (let i = startIdx; i < endIdx; i++) {
        const img = images[i];

        // Skip images with invalid dimensions
        if (!img.wPx || !img.hPx || img.wPx <= 0 || img.hPx <= 0) {
          console.warn(`Skipping image with invalid dimensions: ${img.name || 'unknown'}`);
          continue;
        }

        const localIdx = i - startIdx;
        const row = Math.floor(localIdx / cols);
        const col = localIdx % cols;

        // Calculate cell top-left position
        const cellX = MARGIN_MM + col * (cellW + GAP_MM);
        const cellY = MARGIN_MM + row * (cellH + GAP_MM);

        // Calculate render size (fit to cell, no upscale)
        const { renderWMm, renderHMm } = calculateImageRenderSize(
          img.wPx,
          img.hPx,
          cellW,
          cellH
        );

        // Center image in cell
        const imgX = cellX + (cellW - renderWMm) / 2;
        const imgY = cellY + (cellH - renderHMm) / 2;

        // Add image to PDF with error handling
        try {
          doc.addImage(img.dataUrl, 'PNG', imgX, imgY, renderWMm, renderHMm);
        } catch (imgError) {
          console.warn(`Failed to add image to PDF: ${img.name || 'unknown'}`, imgError);
          // Continue with other images instead of failing completely
        }
      }

      // Draw grid lines if enabled (solid or dashed)
      if (gridEnabled && gridEnabled !== 'none') {
        const [r, g, b] = hexToRgb(gridColor);
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(gridThickness || 0.5);

        // Set line style based on gridEnabled value
        const isDashed = gridEnabled === 'dashed';
        const dashLength = isDashed ? 2 : 0;
        const gapLength = isDashed ? 2 : 0;

        // Draw vertical lines between columns
        for (let c = 1; c < cols; c++) {
          const x = MARGIN_MM + c * cellW + (c - 1) * GAP_MM + GAP_MM / 2;
          if (isDashed) {
            doc.setLineDashPattern([dashLength, gapLength], 0);
          }
          doc.line(x, MARGIN_MM, x, pageH - MARGIN_MM);
        }

        // Draw horizontal lines between rows
        for (let r = 1; r < rows; r++) {
          const y = MARGIN_MM + r * cellH + (r - 1) * GAP_MM + GAP_MM / 2;
          if (isDashed) {
            doc.setLineDashPattern([dashLength, gapLength], 0);
          }
          doc.line(MARGIN_MM, y, pageW - MARGIN_MM, y);
        }

        // Reset dash pattern for subsequent operations
        if (isDashed) {
          doc.setLineDashPattern([], 0);
        }
      }
    }
  } catch (error) {
    if (error instanceof PdfGenerationError) {
      throw error;
    }

    // Check for memory-related errors
    if (error.message && (
      error.message.includes('memory') ||
      error.message.includes('allocation') ||
      error.message.includes('out of')
    )) {
      throw new PdfGenerationError(
        'Not enough memory to generate PDF. Try using fewer or smaller images.',
        'memory'
      );
    }

    throw new PdfGenerationError(
      `PDF generation failed: ${error.message || 'Unknown error'}`,
      'generation'
    );
  }

  // Generate output blob
  let blob;
  try {
    blob = doc.output('blob');
  } catch {
    throw new PdfGenerationError(
      'Failed to create PDF file. The document may be too large.',
      'output'
    );
  }

  return { blob, pageCount };
}
