const fs = require('fs');
const svg = fs.readFileSync('src/assets/new_logo.svg', 'utf8');

function hexToHsl(hex) {
  let r = parseInt(hex.substring(1,3), 16) / 255;
  let g = parseInt(hex.substring(3,5), 16) / 255;
  let b = parseInt(hex.substring(5,7), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if(max == min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToHex(h, s, l) {
  let r, g, b;

  if(s == 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = function hue2rgb(p, q, t) {
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

const newSvg = svg.replace(/fill="#([0-9A-Fa-f]{6})"/g, (match, hex) => {
  let [h, s, l] = hexToHsl('#' + hex);
  // cyan is h = 171/360 = 0.475
  h = 171 / 360; 
  // Make it brighter since old logo was bright cyan
  // If original lightness was 0.1, we can boost it. Let's map [0, 0.5] to [0.2, 0.9]
  l = Math.min(1, l * 2 + 0.3);
  // Increase saturation
  s = Math.min(1, s * 1.5 + 0.2);
  return 'fill="' + hslToHex(h, s, l) + '"';
});

fs.writeFileSync('src/assets/new_logo_cyan.svg', newSvg);
console.log('Done!');
