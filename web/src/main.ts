import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import './styles/viz.css';

import { createHeader, createSkipLink } from './sections/header';
import { createHeroSection } from './sections/hero';
import { createSparkSection } from './sections/spark';
import { createV1AndCrackSection } from './sections/v1AndCrack';
import { createV2SearchSection } from './sections/v2Search';
import { createV3PipelineSection } from './sections/v3Pipeline';
import { createSecuritySection } from './sections/security';
import { createFooterSection } from './sections/footer';

function mount(): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    throw new Error('#app root element not found');
  }

  const main = document.createElement('main');
  main.id = 'main-content';

  const sections = [
    createHeroSection(),
    createSparkSection(),
    createV1AndCrackSection(),
    createV2SearchSection(),
    createV3PipelineSection(),
    createSecuritySection(),
  ];

  for (const section of sections) {
    main.append(section.element);
  }

  app.append(createSkipLink(), createHeader(), main, createFooterSection());
}

mount();
