declare module 'color-thief-browser' {
  type RGB = [number, number, number];

  class ColorThief {
    getColor(img: HTMLImageElement, quality?: number): RGB;
    getPalette(img: HTMLImageElement, colorCount?: number, quality?: number): RGB[];
  }

  export default ColorThief;
}
