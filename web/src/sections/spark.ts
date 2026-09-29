import { partitionsCount } from '../core/partitions';
import { unrank } from '../core/rank';
import { createFerrersDiagram, type FerrersDiagramHandle } from '../viz/ferrersDiagram';
import { createGrowthCurve, type GrowthCurveHandle } from '../viz/growthCurve';
import { createNumberReveal, type NumberRevealHandle } from '../viz/numberReveal';
import { createSectionShell, type SectionShell } from './shell';

const MAX_N = 60;

/** A visually varied partition of n to show - not the all-1s or single-part extremes. */
function representativePartition(n: number): number[] {
  const total = partitionsCount(n);
  const midRank = total / 2n;
  return unrank(midRank, n);
}

export function createSparkSection(): SectionShell {
  const shell = createSectionShell({
    id: 'spark',
    eyebrow: 'The spark',
    heading: 'Ramanujan, p(n), and a “why not?”',
    lead: 'The genesis of this algorithm came from watching "The Man Who Knew Infinity" while taking a cryptography class - wondering about the intersection of partition theory and practical cryptography, thinking simply "why not?" Drag the slider to watch p(n) grow.',
    idea: 'This number grows unbelievably fast - that felt like raw material for a cipher.',
    stagePlaceholder: '',
  });

  shell.stage.classList.add('stage--live');
  shell.stage.textContent = '';

  const controlRow = document.createElement('div');
  controlRow.className = 'control-row';

  const sliderLabel = document.createElement('label');
  sliderLabel.setAttribute('for', 'spark-n-slider');
  sliderLabel.textContent = 'n =';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = 'spark-n-slider';
  slider.min = '1';
  slider.max = String(MAX_N);
  slider.value = '8';
  slider.setAttribute('aria-describedby', 'spark-pn-value');

  controlRow.append(sliderLabel, slider);

  const diagramWrap = document.createElement('div');
  diagramWrap.className = 'hero-diagram';

  const statRow = document.createElement('div');
  statRow.className = 'stat-row';

  const pnStat = document.createElement('div');
  pnStat.className = 'stat';
  const pnLabel = document.createElement('span');
  pnLabel.className = 'stat__label';
  pnLabel.textContent = 'p(n)';
  const pnValueContainer = document.createElement('span');
  pnValueContainer.className = 'stat__value';
  pnValueContainer.id = 'spark-pn-value';
  pnStat.append(pnLabel, pnValueContainer);
  statRow.append(pnStat);

  const curveWrap = document.createElement('div');
  curveWrap.style.width = '100%';

  const legend = document.createElement('div');
  legend.className = 'growth-curve-legend';

  function legendItem(swatchClass: string, label: string): HTMLSpanElement {
    const item = document.createElement('span');
    const swatch = document.createElement('span');
    swatch.className = `growth-curve-legend__swatch ${swatchClass}`;
    item.append(swatch, document.createTextNode(label));
    return item;
  }

  legend.append(
    legendItem('growth-curve-legend__swatch--actual', 'actual p(n)'),
    legendItem('growth-curve-legend__swatch--asymptotic', 'Hardy-Ramanujan estimate')
  );

  shell.stage.append(controlRow, diagramWrap, statRow, curveWrap, legend);

  const initialN = Number(slider.value);
  const diagram: FerrersDiagramHandle = createFerrersDiagram(
    diagramWrap,
    representativePartition(initialN),
    'Partition diagram, updates with n'
  );

  const pnReveal: NumberRevealHandle = createNumberReveal(
    pnValueContainer,
    partitionsCount(initialN).toString()
  );

  const curve: GrowthCurveHandle = createGrowthCurve(curveWrap, MAX_N);
  curve.setHighlightN(initialN);

  function updateForN(n: number): void {
    diagram.setPartition(representativePartition(n));
    pnReveal.setValue(partitionsCount(n).toString());
    curve.setHighlightN(n);
  }

  slider.addEventListener('input', () => {
    updateForN(Number(slider.value));
  });

  return shell;
}
