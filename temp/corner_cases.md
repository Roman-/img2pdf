# Corner Cases Analysis

This document catalogs all potential corner cases where the PNG to PDF Grid Converter may fail, behave unexpectedly, or crash.

---

## 1. Image File Issues

### 1.1 Corrupted Image Files
- **Description**: Image file has valid header but corrupted body/data
- **Current Behavior**: May cause Image() element to fail loading, triggering onerror
- **Risk Level**: Medium

### 1.2 Fake/Invalid Image Files
- **Description**: Non-image files renamed with image extensions (e.g., text.txt → text.png)
- **Current Behavior**: MIME type check passes but Image() load fails silently
- **Risk Level**: Medium

### 1.3 Zero-Byte/Empty Files
- **Description**: Files with 0 bytes or effectively empty content
- **Current Behavior**: FileReader succeeds but Image() load fails
- **Risk Level**: Low

### 1.4 Extremely Large Image Files
- **Description**: Images that are very large (>50MB or >10000x10000 pixels)
- **Current Behavior**: May cause browser memory exhaustion, tab crash, or long freeze
- **Risk Level**: High

### 1.5 Very Small/Invalid Dimension Images
- **Description**: Images with 0px or 1px dimensions
- **Current Behavior**: May cause division by zero or layout calculation errors
- **Risk Level**: Medium

### 1.6 Unsupported Color Spaces
- **Description**: CMYK images, Lab color, or other non-RGB color spaces
- **Current Behavior**: Browser may fail to render or render incorrectly; jsPDF behavior undefined
- **Risk Level**: Medium

### 1.7 Truncated Image Files
- **Description**: Images that were partially downloaded or saved
- **Current Behavior**: Image() may load partial data or fail completely
- **Risk Level**: Medium

### 1.8 Extreme Aspect Ratios
- **Description**: Images that are extremely wide (10000x10) or tall (10x10000)
- **Current Behavior**: Will render correctly but may appear as thin lines in grid cells
- **Risk Level**: Low (cosmetic)

### 1.9 Animated Images (GIF, APNG)
- **Description**: Multi-frame animated images
- **Current Behavior**: Only first frame captured in PDF; no warning shown
- **Risk Level**: Low (cosmetic)

### 1.10 Progressive/Interlaced Images
- **Description**: Images using progressive encoding
- **Current Behavior**: Should work but may have different load timing characteristics
- **Risk Level**: Low

### 1.11 Images with Embedded ICC Profiles
- **Description**: Images with color management profiles
- **Current Behavior**: Profile may be stripped, causing color shift in PDF
- **Risk Level**: Low (cosmetic)

### 1.12 Browser-Dependent Format Support
- **Description**: WebP, HEIC, AVIF, JXL formats with varying browser support
- **Current Behavior**: Some browsers reject unsupported formats silently
- **Risk Level**: Medium

### 1.13 SVG Files
- **Description**: Vector graphics uploaded as images
- **Current Behavior**: SVG loads but may have unusual dimension reporting or scaling issues
- **Risk Level**: Medium

### 1.14 PDF Files with Image Extension
- **Description**: PDFs renamed to have image extensions
- **Current Behavior**: MIME type mismatch detection may fail
- **Risk Level**: Low

### 1.15 EXIF Orientation Data
- **Description**: Photos with rotation metadata (common from phones)
- **Current Behavior**: Image may appear rotated incorrectly in PDF
- **Risk Level**: Medium

---

## 2. File Handling Issues

### 2.1 Too Many Files
- **Description**: Dropping hundreds or thousands of files at once
- **Current Behavior**: Browser may freeze or crash; memory exhaustion
- **Risk Level**: High

### 2.2 Very Long File Names
- **Description**: File names exceeding 255 characters
- **Current Behavior**: May cause issues with common prefix detection or display
- **Risk Level**: Low

### 2.3 Special Characters in File Names
- **Description**: Names with emojis, RTL characters, null bytes, newlines, etc.
- **Current Behavior**: May break filename parsing or display
- **Risk Level**: Low

### 2.4 Unicode File Names
- **Description**: Non-ASCII characters in file names
- **Current Behavior**: Should work but may affect common prefix detection
- **Risk Level**: Low

### 2.5 Files Without Extensions
- **Description**: Image files with no file extension
- **Current Behavior**: Should work if MIME type is correct
- **Risk Level**: Low

### 2.6 Duplicate File Names
- **Description**: Multiple files with identical names
- **Current Behavior**: All processed but may confuse users
- **Risk Level**: Low (cosmetic)

### 2.7 Single File Upload
- **Description**: User drops only one file
- **Current Behavior**: Error message shown (handled)
- **Risk Level**: None (handled)

### 2.8 Zero Files
- **Description**: Empty drop event or cancelled file picker
- **Current Behavior**: No action taken
- **Risk Level**: None

### 2.9 Mixed File Types
- **Description**: Mix of valid images and non-image files
- **Current Behavior**: Error shown but unclear which files are invalid
- **Risk Level**: Medium

---

## 3. Grid Configuration Issues

### 3.1 Very Large Grid Dimensions
- **Description**: User enters very large values (e.g., 1000 rows × 1000 columns)
- **Current Behavior**: Cells become sub-millimeter; calculation may produce unusable PDF
- **Risk Level**: Medium

### 3.2 Grid Cell Too Small for Content
- **Description**: Cell dimensions smaller than minimum meaningful size
- **Current Behavior**: Images shrunk to nearly invisible; no warning
- **Risk Level**: Medium

### 3.3 Zero Values
- **Description**: User enters 0 for rows or columns
- **Current Behavior**: Math.max(1, value) protects but input shows 0
- **Risk Level**: Low (partially handled)

### 3.4 Negative Values
- **Description**: User enters negative numbers
- **Current Behavior**: Number input prevents this; Math.max protects
- **Risk Level**: None (handled)

### 3.5 Non-Numeric Input
- **Description**: User enters text in numeric fields
- **Current Behavior**: HTML5 number input prevents this
- **Risk Level**: None (handled)

### 3.6 Decimal Values
- **Description**: User enters 2.5 rows or similar
- **Current Behavior**: Treated as float which may cause layout issues
- **Risk Level**: Low

### 3.7 Very Large Image Count with Small Grid
- **Description**: 1000 images with 1×1 grid = 1000 pages
- **Current Behavior**: PDF generation takes very long; may fail
- **Risk Level**: High

---

## 4. PDF Generation Issues

### 4.1 Memory Exhaustion During Generation
- **Description**: PDF generation runs out of browser memory
- **Current Behavior**: Unhandled error; may crash tab
- **Risk Level**: High

### 4.2 PDF Size Limit
- **Description**: Generated PDF exceeds browser/jsPDF limits
- **Current Behavior**: May fail silently or produce corrupted output
- **Risk Level**: Medium

### 4.3 Blob URL Creation Failure
- **Description**: URL.createObjectURL fails
- **Current Behavior**: Unhandled error; preview broken
- **Risk Level**: Medium

### 4.4 Concurrent Generation Requests
- **Description**: Multiple rapid clicks on generate button
- **Current Behavior**: Multiple simultaneous generations; memory leak
- **Risk Level**: Medium

### 4.5 Generation Interrupted
- **Description**: User navigates away or closes tab during generation
- **Current Behavior**: Process interrupted; resources not cleaned up
- **Risk Level**: Low

### 4.6 jsPDF Library Errors
- **Description**: Bugs or exceptions from jsPDF library
- **Current Behavior**: Unhandled; may crash or produce corrupted PDF
- **Risk Level**: Medium

---

## 5. Browser/Environment Issues

### 5.1 Insufficient Memory
- **Description**: Device has low available RAM
- **Current Behavior**: May crash or freeze
- **Risk Level**: High

### 5.2 PDF Preview Not Supported
- **Description**: Some browsers don't support PDF preview in iframes
- **Current Behavior**: Blank preview; no fallback
- **Risk Level**: Medium

### 5.3 Download Blocked
- **Description**: Browser or extension blocks automatic downloads
- **Current Behavior**: Download fails silently
- **Risk Level**: Low

### 5.4 Tab Backgrounded
- **Description**: User switches tabs during processing
- **Current Behavior**: Processing may slow or throttle
- **Risk Level**: Low

### 5.5 Private/Incognito Mode
- **Description**: Restricted storage or different security policies
- **Current Behavior**: Should work but may have issues with Blob URLs
- **Risk Level**: Low

### 5.6 Old Browser Versions
- **Description**: Browsers lacking modern APIs
- **Current Behavior**: May fail without meaningful error message
- **Risk Level**: Medium

---

## 6. User Interaction Issues

### 6.1 Changing Settings During Generation
- **Description**: User modifies rows/cols while PDF is generating
- **Current Behavior**: May cause state inconsistency
- **Risk Level**: Medium

### 6.2 Dropping New Files During Generation
- **Description**: User drops new batch while PDF is generating
- **Current Behavior**: May cause race condition or state corruption
- **Risk Level**: Medium

### 6.3 Rapid Setting Changes
- **Description**: User rapidly toggles settings triggering many regenerations
- **Current Behavior**: Multiple generations queued; memory leak; performance issues
- **Risk Level**: Medium

### 6.4 Download Before Generation Complete
- **Description**: User clicks download while isGenerating is true
- **Current Behavior**: Button disabled but timing edge cases exist
- **Risk Level**: Low

### 6.5 Drag and Drop Outside Zone
- **Description**: User drops files outside designated drop zone
- **Current Behavior**: Browser may try to open file; uncontrolled behavior
- **Risk Level**: Low

---

## 7. Data Quality Issues

### 7.1 All Images Different Dimensions
- **Description**: Every image has unique dimensions
- **Current Behavior**: Warning shown; proceeds anyway; layout may look uneven
- **Risk Level**: Low (cosmetic)

### 7.2 Mixed Image Types
- **Description**: PNG, JPEG, GIF, WebP all in same batch
- **Current Behavior**: Should work but quality may vary
- **Risk Level**: Low

### 7.3 Transparent Images
- **Description**: PNG with alpha transparency
- **Current Behavior**: jsPDF renders with white background; may look different than expected
- **Risk Level**: Low (cosmetic)

### 7.4 Grayscale vs Color
- **Description**: Mix of grayscale and color images
- **Current Behavior**: Should work; no issue
- **Risk Level**: None

### 7.5 High Bit Depth Images
- **Description**: 16-bit or 32-bit images
- **Current Behavior**: Converted to 8-bit; may lose detail
- **Risk Level**: Low

---

## Summary by Risk Level

### High Risk (Requires Immediate Attention)
- 1.4: Extremely Large Image Files
- 2.1: Too Many Files
- 3.7: Very Large Image Count with Small Grid
- 4.1: Memory Exhaustion During Generation
- 5.1: Insufficient Memory

### Medium Risk (Should Be Addressed)
- 1.1: Corrupted Image Files
- 1.2: Fake/Invalid Image Files
- 1.5: Very Small/Invalid Dimension Images
- 1.6: Unsupported Color Spaces
- 1.7: Truncated Image Files
- 1.12: Browser-Dependent Format Support
- 1.13: SVG Files
- 1.15: EXIF Orientation Data
- 2.9: Mixed File Types
- 3.1: Very Large Grid Dimensions
- 3.2: Grid Cell Too Small for Content
- 4.2: PDF Size Limit
- 4.3: Blob URL Creation Failure
- 4.4: Concurrent Generation Requests
- 4.6: jsPDF Library Errors
- 5.2: PDF Preview Not Supported
- 5.6: Old Browser Versions
- 6.1: Changing Settings During Generation
- 6.2: Dropping New Files During Generation
- 6.3: Rapid Setting Changes

### Low Risk (Nice to Have)
- All remaining items
