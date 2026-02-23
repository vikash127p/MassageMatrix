/**
 * Upload validation constants for chat file and image attachments.
 * Max 10MB, allowed types for images and documents.
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_MB = 10;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
] as const;

export const ALLOWED_FILE_EXTENSIONS = [
  'pdf',
  'docx',
  'doc',
  'txt',
  'zip',
  'xls',
  'xlsx',
];

export const ALLOWED_ACCEPT = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_FILE_TYPES,
].join(',');

export function isImageType(mime: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mime as (typeof ALLOWED_IMAGE_TYPES)[number]);
}

export function isAllowedFileType(mime: string): boolean {
  return (
    ALLOWED_IMAGE_TYPES.includes(mime as (typeof ALLOWED_IMAGE_TYPES)[number]) ||
    ALLOWED_FILE_TYPES.includes(mime as (typeof ALLOWED_FILE_TYPES)[number])
  );
}

export function validateFile(file: File): { valid: true } | { valid: false; error: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
    };
  }
  if (!isAllowedFileType(file.type)) {
    return {
      valid: false,
      error: 'This file type is not allowed. Use images (jpg, png, webp, gif) or documents (pdf, docx, txt, zip, etc.).',
    };
  }
  return { valid: true };
}
