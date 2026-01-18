
import { AsciiConfig } from '../types';

const applySharpen = (ctx: CanvasRenderingContext2D, imageData: ImageData, w: number, h: number) => {
  const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);
  const src = imageData.data;
  const sw = w;
  const sh = h;
  
  const output = ctx.createImageData(w, h);
  const dst = output.data;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const dstOff = (y * sw + x) * 4;
      
      let r = 0, g = 0, b = 0;
      
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = y + cy - halfSide;
          const scx = x + cx - halfSide;
          
          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            const srcOff = (scy * sw + scx) * 4;
            const wt = weights[cy * side + cx];
            
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
          }
        }
      }
      
      dst[dstOff] = Math.min(255, Math.max(0, r));
      dst[dstOff + 1] = Math.min(255, Math.max(0, g));
      dst[dstOff + 2] = Math.min(255, Math.max(0, b));
      dst[dstOff + 3] = src[dstOff + 3];
    }
  }
  return output;
};

export const processImageToAscii = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  config: AsciiConfig
): { ascii: string; coloredHtml: string } => {
  const { width, charSet, invert, contrast, colorMode, filter } = config;

  // Calculate height to maintain aspect ratio, including a 0.55 squish factor for character height
  const widthRatio = width / img.width;
  const height = Math.floor(img.height * widthRatio * 0.55);

  canvas.width = width;
  canvas.height = height;

  // Apply CSS filters for standard effects
  let filterStr = `contrast(${contrast}%)`;
  if (filter === 'blur') filterStr += ' blur(0.75px)';
  else if (filter === 'sepia') filterStr += ' sepia(100%)';
  else if (filter === 'grayscale') filterStr += ' grayscale(100%)';

  ctx.filter = filterStr;
  ctx.drawImage(img, 0, 0, width, height);

  let imageData = ctx.getImageData(0, 0, width, height);
  
  // Apply manual convolution for sharpen if selected
  if (filter === 'sharpen') {
    imageData = applySharpen(ctx, imageData, width, height);
  }

  const pixels = imageData.data;
  let ascii = '';
  let coloredHtml = '';

  const chars = invert ? charSet.split('').reverse().join('') : charSet;
  const charLen = chars.length;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    // Alpha is pixels[i+3], ignoring for now

    // Grayscale conversion using luminance formula
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Map grayscale (0-255) to character index
    const charIndex = Math.floor((gray / 256) * charLen);
    const char = chars[charIndex];
    
    ascii += char;

    if (colorMode !== 'mono') {
      const safeChar = char
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      if (colorMode === 'text') {
        coloredHtml += `<span style="color: rgb(${r},${g},${b})">${safeChar}</span>`;
      } else if (colorMode === 'background') {
        // Calculate perceived brightness to determine best text color (black or white)
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const textColor = luminance > 128 ? '#000000' : '#ffffff';
        coloredHtml += `<span style="background-color: rgb(${r},${g},${b}); color: ${textColor}">${safeChar}</span>`;
      }
    }

    // Add newline at end of each row
    if (((i / 4) + 1) % width === 0) {
      ascii += '\n';
      if (colorMode !== 'mono') coloredHtml += '\n';
    }
  }

  return { ascii, coloredHtml };
};
