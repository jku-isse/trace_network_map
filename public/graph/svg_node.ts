type SvgNode = {
  dataImage: string,
  width: number,
  height: number,
}

export function render(serviceName:string, name: string): SvgNode {
  const width = 200;
  const height = 60;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <style>
        .service-name { fill: grey; font: bold 10px sans-serif; }
        .name { fill: white; font: normal 16px sans-serif; }
      </style>

      <text x="10" y="20" class="service-name">${serviceName}</text>
      <text x="10" y="40" class="name">${name}</text>
    </svg>`;

  return {
    dataImage: 'data:image/svg+xml;base64,' + btoa(svg),
    width,
    height,
  };
}
