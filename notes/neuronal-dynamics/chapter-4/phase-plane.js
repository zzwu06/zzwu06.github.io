const plot = document.querySelector('#phase-plot');
const axes = document.querySelector('#phase-axes');
const data = document.querySelector('#phase-data');
const slider = document.querySelector('#voltage-feedback');
const value = document.querySelector('#feedback-value');
const result = document.querySelector('#phase-result');
const buttons = [...document.querySelectorAll('[data-feedback]')];
const b = 1;
const epsilon = 0.3;
const xMin = -2.5, xMax = 2.5, yMin = -2, yMax = 2;
const left = 70, top = 16, width = 520, height = 354;
let start = { u: 1.65, w: 0 };

const x = u => left + (u - xMin) * width / (xMax - xMin);
const y = w => top + (yMax - w) * height / (yMax - yMin);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function svg(tag, attributes, text) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

function line(x1, y1, x2, y2, style) {
  return svg('line', { x1, y1, x2, y2, ...style });
}

function drawAxes() {
  axes.append(line(left, top + height, left + width, top + height, { stroke: 'currentColor' }));
  axes.append(line(left, top, left, top + height, { stroke: 'currentColor' }));
  for (const tick of [-2, -1, 0, 1, 2]) {
    axes.append(line(x(tick), top + height, x(tick), top + height + 5, { stroke: 'currentColor' }));
    axes.append(svg('text', { x: x(tick), y: top + height + 24, 'text-anchor': 'middle' }, tick));
    axes.append(line(left - 5, y(tick), left, y(tick), { stroke: 'currentColor' }));
    axes.append(svg('text', { x: left - 11, y: y(tick) + 5, 'text-anchor': 'end' }, tick));
  }
  axes.append(svg('text', { x: left + width / 2, y: 428, 'text-anchor': 'middle' }, 'Voltage u'));
  axes.append(svg('text', { x: 17, y: 193, 'text-anchor': 'middle', transform: 'rotate(-90 17 193)' }, 'Recovery w'));
}

function velocity(u, w, a) {
  return { u: a * u - w, w: epsilon * (b * u - w) };
}

function trace(a) {
  const dt = 0.05;
  let { u, w } = start;
  const points = [[x(u), y(w)]];
  for (let step = 0; step < 640; step++) {
    const v = velocity(u, w, a);
    const midpoint = velocity(u + dt * v.u / 2, w + dt * v.w / 2, a);
    u += dt * midpoint.u;
    w += dt * midpoint.w;
    if (step % 2 === 0) points.push([x(u), y(w)]);
    if (Math.abs(u) > 8 || Math.abs(w) > 8) break;
  }
  return points.map(([px, py]) => [px.toFixed(2), py.toFixed(2)].join(',')).join(' ');
}

function classify(a) {
  const determinant = epsilon * (b - a);
  const tr = a - epsilon;
  if (Math.abs(determinant) < 1e-9) return 'The nullclines coincide. Every point on the shared line is fixed.';
  if (determinant < 0) return 'Saddle. Some starting points approach the fixed point along a special direction. Most move away.';
  if (Math.abs(tr) < 1e-9) return 'Neutral center. Nearby trajectories circle the fixed point at a constant amplitude.';
  if (tr < 0) return 'Stable fixed point. Nearby trajectories return to rest.';
  return tr * tr < 4 * determinant
    ? 'Unstable fixed point. Nearby trajectories spiral outward.'
    : 'Unstable fixed point. Nearby trajectories move away.';
}

function drawArrows(a) {
  const arrows = [];
  for (let u = -2.25; u <= 2.25; u += 0.5) {
    for (let w = -1.75; w <= 1.75; w += 0.5) {
      const velocityAtPoint = velocity(u, w, a);
      const dx = velocityAtPoint.u * width / (xMax - xMin);
      const dy = -velocityAtPoint.w * height / (yMax - yMin);
      const length = Math.hypot(dx, dy);
      if (length < 1e-9) continue;
      const ux = dx / length, uy = dy / length;
      const sx = x(u) - 7 * ux, sy = y(w) - 7 * uy;
      const ex = x(u) + 7 * ux, ey = y(w) + 7 * uy;
      arrows.push('M', sx, sy, 'L', ex, ey, 'M', ex - 4 * ux + 2.5 * uy, ey - 4 * uy - 2.5 * ux, 'L', ex, ey, 'L', ex - 4 * ux - 2.5 * uy, ey - 4 * uy + 2.5 * ux);
    }
  }
  return svg('path', { d: arrows.join(' '), fill: 'none', stroke: '#777', 'stroke-width': 0.9 });
}

function render() {
  const a = Number(slider.value);
  value.value = a.toFixed(2);
  const label = classify(a);
  if (result.textContent !== label) result.textContent = label;
  for (const button of buttons) button.setAttribute('aria-pressed', String(Number(button.dataset.feedback) === a));
  data.replaceChildren(
    drawArrows(a),
    line(x(xMin), y(a * xMin), x(xMax), y(a * xMax), { stroke: '#365f96', 'stroke-width': 2.3, 'stroke-dasharray': '9 5' }),
    line(x(xMin), y(b * xMin), x(xMax), y(b * xMax), { stroke: '#805631', 'stroke-width': 2.3, 'stroke-dasharray': '2 4', 'stroke-linecap': 'round' }),
    svg('polyline', { points: trace(a), fill: 'none', stroke: '#171717', 'stroke-width': 2.6 }),
    svg('circle', { cx: x(0), cy: y(0), r: 4, fill: '#171717' }),
    svg('circle', { cx: x(start.u), cy: y(start.w), r: 5, fill: '#fff', stroke: '#171717', 'stroke-width': 2 })
  );
}

slider.addEventListener('input', render);
for (const button of buttons) button.addEventListener('click', () => {
  slider.value = button.dataset.feedback;
  start = { u: 1.65, w: 0 };
  render();
});
plot.addEventListener('click', event => {
  const transform = plot.getScreenCTM();
  if (!transform) return;
  const { x: px, y: py } = new DOMPoint(event.clientX, event.clientY).matrixTransform(transform.inverse());
  if (px < left || px > left + width || py < top || py > top + height) return;
  start = {
    u: xMin + (px - left) * (xMax - xMin) / width,
    w: yMax - (py - top) * (yMax - yMin) / height
  };
  render();
});
plot.addEventListener('keydown', event => {
  const moves = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, 0.15], ArrowDown: [0, -0.15] };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  start = { u: clamp(start.u + move[0], xMin, xMax), w: clamp(start.w + move[1], yMin, yMax) };
  render();
});
drawAxes();
render();
