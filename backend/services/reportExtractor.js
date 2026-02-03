import pdf from 'pdf-parse';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs';

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF extraction error:', error.message);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from image using OCR (Tesseract)
 */
async function extractTextFromImage(filePath) {
  try {
    // Preprocess image with sharp for better OCR results
    const preprocessedPath = filePath + '_processed.png';
    await sharp(filePath)
      .greyscale()
      .normalize()
      .sharpen()
      .toFile(preprocessedPath);

    // Run OCR
    const { data: { text } } = await Tesseract.recognize(
      preprocessedPath,
      'eng',
      {
        logger: m => console.log(m), // Progress logging
      }
    );

    // Clean up preprocessed image
    if (fs.existsSync(preprocessedPath)) {
      fs.unlinkSync(preprocessedPath);
    }

    return text || '';
  } catch (error) {
    console.error('Image OCR error:', error.message);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Extract text from any supported file type
 */
async function extractText(filePath, fileType) {
  const ext = fileType.toLowerCase();

  if (ext === '.pdf' || ext === 'pdf') {
    return await extractTextFromPDF(filePath);
  } else if (['.jpg', '.jpeg', '.png', 'jpg', 'jpeg', 'png'].includes(ext)) {
    return await extractTextFromImage(filePath);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

export async function extractReportText(file) {
  // Accept either a file path string or an object (e.g., multer file)
  let filePath = file;
  let ext = '';
  try {
    if (typeof file === 'object' && file !== null) {
      filePath = file.path || file.filepath || file.filename || file;
      ext = (file.originalname && file.originalname.slice(((file.originalname.lastIndexOf(".") - 1) >>> 0) + 2)) || '';
    }
    if (typeof filePath === 'string') {
      const path = filePath;
      const dotIdx = path.lastIndexOf('.');
      ext = dotIdx !== -1 ? path.slice(dotIdx) : '';
    }
    return await extractText(filePath, ext);
  } catch (err) {
    throw err;
  }
}

export {
  extractText,
  extractTextFromPDF,
  extractTextFromImage,
};
