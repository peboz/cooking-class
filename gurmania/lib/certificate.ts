import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { uploadToS3, getPublicUrl } from './s3';
import { prisma } from '@/prisma';
import fs from 'fs';
import path from 'path';

/**
 * Generate a professional-looking PDF certificate for course completion
 */
export async function generateCertificatePDF(
  userName: string,
  courseTitle: string,
  instructorName: string,
  completionDate: Date
): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Register fontkit to enable custom font embedding
  pdfDoc.registerFontkit(fontkit);
  
  // Add a page with A4 landscape dimensions (842 x 595 points)
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();
  const centerX = width / 2;

  // Load custom fonts that support Croatian characters
  const robotoRegularPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
  const robotoBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');
  
  const robotoRegularBytes = fs.readFileSync(robotoRegularPath);
  const robotoBoldBytes = fs.readFileSync(robotoBoldPath);
  
  const robotoRegular = await pdfDoc.embedFont(robotoRegularBytes);
  const robotoBold = await pdfDoc.embedFont(robotoBoldBytes);

  // Colors
  const orange = rgb(0.85, 0.47, 0.02); // #D97706
  const lightOrange = rgb(0.96, 0.62, 0.04); // #F59E0B
  const darkGray = rgb(0.12, 0.16, 0.22); // #1F2937
  const gray = rgb(0.42, 0.45, 0.50); // #6B7280
  const lightGray = rgb(0.82, 0.84, 0.87); // #D1D5DB

  // Background (white - already default)
  
  // Decorative outer border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: orange,
    borderWidth: 3,
  });

  // Inner decorative border
  page.drawRectangle({
    x: 40,
    y: 40,
    width: width - 80,
    height: height - 80,
    borderColor: lightOrange,
    borderWidth: 1,
  });

  // Decorative corner lines
  // Top-left
  page.drawLine({ start: { x: 40, y: height - 40 }, end: { x: 40, y: height - 70 }, color: orange, thickness: 2 });
  page.drawLine({ start: { x: 40, y: height - 40 }, end: { x: 70, y: height - 40 }, color: orange, thickness: 2 });
  // Top-right
  page.drawLine({ start: { x: width - 40, y: height - 40 }, end: { x: width - 40, y: height - 70 }, color: orange, thickness: 2 });
  page.drawLine({ start: { x: width - 40, y: height - 40 }, end: { x: width - 70, y: height - 40 }, color: orange, thickness: 2 });
  // Bottom-left
  page.drawLine({ start: { x: 40, y: 40 }, end: { x: 40, y: 70 }, color: orange, thickness: 2 });
  page.drawLine({ start: { x: 40, y: 40 }, end: { x: 70, y: 40 }, color: orange, thickness: 2 });
  // Bottom-right
  page.drawLine({ start: { x: width - 40, y: 40 }, end: { x: width - 40, y: 70 }, color: orange, thickness: 2 });
  page.drawLine({ start: { x: width - 40, y: 40 }, end: { x: width - 70, y: 40 }, color: orange, thickness: 2 });

  // Title: "CERTIFIKAT"
  const titleText = 'CERTIFIKAT';
  const titleSize = 48;
  const titleWidth = robotoBold.widthOfTextAtSize(titleText, titleSize);
  page.drawText(titleText, {
    x: centerX - titleWidth / 2,
    y: height - 148,
    size: titleSize,
    font: robotoBold,
    color: darkGray,
  });

  // Subtitle
  const subtitleText = 'O ZAVRŠETKU TEČAJA';
  const subtitleSize = 16;
  const subtitleWidth = robotoRegular.widthOfTextAtSize(subtitleText, subtitleSize);
  page.drawText(subtitleText, {
    x: centerX - subtitleWidth / 2,
    y: height - 188,
    size: subtitleSize,
    font: robotoRegular,
    color: gray,
  });

  // Horizontal line under title
  page.drawLine({
    start: { x: centerX - 150, y: height - 205 },
    end: { x: centerX + 150, y: height - 205 },
    color: lightOrange,
    thickness: 2,
  });

  // "This certifies that" text
  const certifiesText = 'Ovim se potvrđuje da je';
  const certifiesSize = 14;
  const certifiesWidth = robotoRegular.widthOfTextAtSize(certifiesText, certifiesSize);
  page.drawText(certifiesText, {
    x: centerX - certifiesWidth / 2,
    y: height - 235,
    size: certifiesSize,
    font: robotoRegular,
    color: gray,
  });

  // User name (emphasized)
  const nameSize = 32;
  const nameWidth = robotoBold.widthOfTextAtSize(userName, nameSize);
  page.drawText(userName, {
    x: centerX - nameWidth / 2,
    y: height - 275,
    size: nameSize,
    font: robotoBold,
    color: orange,
  });

  // "Successfully completed" text
  const completedText = 'uspješno završio/la tečaj';
  const completedSize = 14;
  const completedWidth = robotoRegular.widthOfTextAtSize(completedText, completedSize);
  page.drawText(completedText, {
    x: centerX - completedWidth / 2,
    y: height - 305,
    size: completedSize,
    font: robotoRegular,
    color: gray,
  });

  // Course title (emphasized) - handle long titles by wrapping
  const courseTitleSize = 24;
  const maxCourseWidth = width - 200;
  let displayCourseTitle = courseTitle;
  let courseTitleWidth = robotoBold.widthOfTextAtSize(displayCourseTitle, courseTitleSize);
  
  // Simple truncation if too long
  if (courseTitleWidth > maxCourseWidth) {
    while (courseTitleWidth > maxCourseWidth && displayCourseTitle.length > 3) {
      displayCourseTitle = displayCourseTitle.slice(0, -4) + '...';
      courseTitleWidth = robotoBold.widthOfTextAtSize(displayCourseTitle, courseTitleSize);
    }
  }
  
  page.drawText(displayCourseTitle, {
    x: centerX - courseTitleWidth / 2,
    y: height - 345,
    size: courseTitleSize,
    font: robotoBold,
    color: darkGray,
  });

  // Date of completion
  const formattedDate = completionDate.toLocaleDateString('hr-HR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dateText = `Datum završetka: ${formattedDate}`;
  const dateSize = 12;
  const dateWidth = robotoRegular.widthOfTextAtSize(dateText, dateSize);
  page.drawText(dateText, {
    x: centerX - dateWidth / 2,
    y: height - 395,
    size: dateSize,
    font: robotoRegular,
    color: gray,
  });

  // Signature section
  const signatureY = 145;
  const signatureWidth = 200;

  // Left side - Instructor signature line
  page.drawLine({
    start: { x: centerX - signatureWidth - 50, y: signatureY },
    end: { x: centerX - 50, y: signatureY },
    color: lightGray,
    thickness: 1,
  });

  // Instructor name
  const instructorSize = 12;
  const instructorWidth = robotoBold.widthOfTextAtSize(instructorName, instructorSize);
  page.drawText(instructorName, {
    x: centerX - signatureWidth / 2 - 50 - instructorWidth / 2,
    y: signatureY - 22,
    size: instructorSize,
    font: robotoBold,
    color: darkGray,
  });

  // Instructor label
  const instructorLabelText = 'Instruktor';
  const instructorLabelSize = 10;
  const instructorLabelWidth = robotoRegular.widthOfTextAtSize(instructorLabelText, instructorLabelSize);
  page.drawText(instructorLabelText, {
    x: centerX - signatureWidth / 2 - 50 - instructorLabelWidth / 2,
    y: signatureY - 38,
    size: instructorLabelSize,
    font: robotoRegular,
    color: gray,
  });

  // Right side - Platform signature line
  page.drawLine({
    start: { x: centerX + 50, y: signatureY },
    end: { x: centerX + signatureWidth + 50, y: signatureY },
    color: lightGray,
    thickness: 1,
  });

  // Platform name
  const platformText = 'Gurmania';
  const platformSize = 12;
  const platformWidth = robotoBold.widthOfTextAtSize(platformText, platformSize);
  page.drawText(platformText, {
    x: centerX + signatureWidth / 2 + 50 - platformWidth / 2,
    y: signatureY - 22,
    size: platformSize,
    font: robotoBold,
    color: darkGray,
  });

  // Platform label
  const platformLabelText = 'Platforma za kuharske tečajeve';
  const platformLabelSize = 10;
  const platformLabelWidth = robotoRegular.widthOfTextAtSize(platformLabelText, platformLabelSize);
  page.drawText(platformLabelText, {
    x: centerX + signatureWidth / 2 + 50 - platformLabelWidth / 2,
    y: signatureY - 38,
    size: platformLabelSize,
    font: robotoRegular,
    color: gray,
  });

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate a certificate PDF and upload it to S3
 * @returns Object with certificate ID and public URL
 */
export async function generateAndUploadCertificate(
  certificateId: string,
  userName: string,
  courseTitle: string,
  instructorName: string,
  issuedAt: Date
): Promise<{ pdfUrl: string }> {
  try {
    console.log('[Certificate] Starting PDF generation for certificate:', certificateId);
    
    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(
      userName,
      courseTitle,
      instructorName,
      issuedAt
    );
    console.log('[Certificate] PDF buffer generated, size:', pdfBuffer.length, 'bytes');

    // Upload to S3
    const timestamp = Date.now();
    const s3Key = `certificates/${certificateId}/${timestamp}.pdf`;
    
    console.log('[Certificate] Uploading to S3 with key:', s3Key);
    await uploadToS3(pdfBuffer, s3Key, 'application/pdf');
    
    console.log('[Certificate] Getting public URL...');
    const pdfUrl = getPublicUrl(s3Key);
    console.log('[Certificate] Public URL obtained:', pdfUrl);

    return {
      pdfUrl,
    };
  } catch (error) {
    console.error('[Certificate] Error generating and uploading certificate:', error);
    throw error;
  }
}
