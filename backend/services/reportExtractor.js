const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');

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

module.exports = {
  extractText,
  extractTextFromPDF,
  extractTextFromImage,
};
