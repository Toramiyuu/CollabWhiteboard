import type { DrawingElement } from '@collabwhiteboard/shared';
import { getStroke } from 'perfect-freehand';

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'] as (string | number)[]
  );
  d.push('Z');
  return d.join(' ');
}

export function renderElement(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
  ctx.save();

  switch (element.type) {
    case 'pen': {
      if (element.points.length < 2) { ctx.restore(); return; }
      const stroke = getStroke(element.points.map(p => [p.x, p.y]), {
        size: element.strokeWidth,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      });
      const path = new Path2D(getSvgPathFromStroke(stroke));
      ctx.fillStyle = element.color;
      ctx.fill(path);
      ctx.stroke();
      break;
    }

    case 'rectangle': {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.strokeRect(element.x, element.y, element.width, element.height);
      break;
    }

    case 'circle': {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.beginPath();
      ctx.ellipse(element.cx, element.cy, element.rx, element.ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'line': {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(element.x1, element.y1);
      ctx.lineTo(element.x2, element.y2);
      ctx.stroke();
      break;
    }

    case 'text': {
      ctx.fillStyle = element.color;
      ctx.font = `${element.fontSize}px system-ui, sans-serif`;
      ctx.fillText(element.content, element.x, element.y);
      break;
    }

    case 'eraser':
      // Eraser removes elements; no canvas painting needed
      break;
  }

  ctx.restore();
}

export function renderAll(ctx: CanvasRenderingContext2D, elements: DrawingElement[]): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const el of elements) {
    renderElement(ctx, el);
  }
}
