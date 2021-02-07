import {NodeData} from "./data";

type SvgNode = {
  dataImage: string,
  width: number,
  height: number,
}

export function render(node: NodeData): SvgNode {
  const serviceName = node.getServiceName();
  const name = node.getName();
  const result = node.getResultSummary();
  const duration = node.getDuration();

  const width = Math.max(serviceName.length, name.length, (result ? result.text.length : 0)) > 20 ? 300 : 200;
  const height = result || duration ? 70 : 60;

  const resultNodeStr = result ? `<text x="10" y="60" class="info ${result.className}">${result.text}</text>` : '';
  const durationNodeStr = duration ? `<text x="${width - 40}" y="60" class="duration">${duration}</text>` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <style>
        .info { fill: lightblue; font: bold 10px sans-serif; }
        .duration { fill: lightgrey; font: 10px sans-serif; }
        .name { fill: white; font: normal 16px sans-serif; }
        .info.success { fill: lightgreen; }
        .info.error { fill: lightcoral; }
      </style>

      <text x="10" y="20" class="info">${serviceName}</text>
      <text x="10" y="40" class="name">${name}</text>
      ${resultNodeStr}
      ${durationNodeStr}
    </svg>`;

  return {
    dataImage: 'data:image/svg+xml;base64,' + btoa(svg),
    width,
    height,
  };
}
