import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MetricCard } from '../src/components/MetricCard';
import {
  ScientificEvidenceDrawer,
} from '../src/components/science/ScientificEvidenceDrawer';
import {
  NASA_SCIENTIFIC_REGISTRY,
  searchEvidence,
  generateBibtex,
  generateApaCitation,
} from '../src/data/nasaScientificRegistry';
import type { MetricThresholds, TelemetryReading } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
  }
}

const mockThresholds: MetricThresholds = {
  minNominal: 60,
  maxNominal: 90,
  minCaution: 50,
  maxCaution: 110,
  unit: 'bpm',
  sourceNote: 'NASA-STD-3001 Vol 1 Rev B: Resting heart rate nominal ranges',
};

const mockHistory: TelemetryReading[] = [
  { timestamp: Date.now() - 5000, heartRate: 72 } as any,
  { timestamp: Date.now() - 4000, heartRate: 75 } as any,
  { timestamp: Date.now() - 3000, heartRate: 78 } as any,
  { timestamp: Date.now() - 2000, heartRate: 74 } as any,
  { timestamp: Date.now() - 1000, heartRate: 72 } as any,
];

console.log('=== TEST SUITE 1: MetricCard Prop & Interaction Tests ===');

// Test 1.1: MetricCard renders safely with undefined evidenceId and undefined onOpenEvidence
try {
  const htmlNoEvidence = renderToStaticMarkup(
    React.createElement(MetricCard, {
      title: 'Frecuencia Cardíaca',
      value: 72,
      unit: 'bpm',
      metricKey: 'heartRate' as any,
      history: mockHistory,
      thresholds: mockThresholds,
    })
  );
  assert(!htmlNoEvidence.includes('[Ref]'), 'MetricCard: [Ref] button NOT rendered when evidenceId is undefined');
  assert(htmlNoEvidence.includes('Ref: 60-90'), 'MetricCard: Displays reference range');
  assert(!htmlNoEvidence.includes('cursor-pointer hover:text-sky-400'), 'MetricCard: Ref span not styled as clickable without evidence');
} catch (err: any) {
  assert(false, 'MetricCard: Rendering with undefined evidenceId should not throw', err.message);
}

// Test 1.2: MetricCard with evidenceId defined but onOpenEvidence undefined
try {
  const htmlWithEvidenceNoHandler = renderToStaticMarkup(
    React.createElement(MetricCard, {
      title: 'Frecuencia Cardíaca',
      value: 72,
      unit: 'bpm',
      metricKey: 'heartRate' as any,
      history: mockHistory,
      thresholds: mockThresholds,
      evidenceId: 'NASA-STD-3001-VOL1-CVS',
    })
  );
  assert(htmlWithEvidenceNoHandler.includes('[Ref]'), 'MetricCard: [Ref] button rendered when evidenceId is present');

  // Inspect tree to verify click handler is safe when onOpenEvidence is undefined
  const cardElement = MetricCard({
    title: 'Frecuencia Cardíaca',
    value: 72,
    unit: 'bpm',
    metricKey: 'heartRate' as any,
    history: mockHistory,
    thresholds: mockThresholds,
    evidenceId: 'NASA-STD-3001-VOL1-CVS',
  });
  
  let stoppedPropagation = false;
  const mockEvent = {
    stopPropagation: () => {
      stoppedPropagation = true;
    },
  };
  
  const headerDiv = cardElement.props.children[0];
  const titleRow = headerDiv.props.children[0];
  const buttonsGroup = titleRow.props.children[1];
  const refButton = buttonsGroup.props.children[0];

  assert(refButton !== null && refButton !== undefined, 'MetricCard: [Ref] button element exists in tree');
  refButton.props.onClick(mockEvent);
  assert(stoppedPropagation, 'MetricCard: [Ref] button calls stopPropagation even without onOpenEvidence');
} catch (err: any) {
  assert(false, 'MetricCard: Click with undefined onOpenEvidence should not throw', err.message);
}

// Test 1.3: MetricCard with evidenceId AND onOpenEvidence defined
try {
  let openedEvidenceId = '';
  let stoppedPropagation = false;

  const onOpenEvidenceSpy = (id: string) => {
    openedEvidenceId = id;
  };

  const cardElement = MetricCard({
    title: 'Frecuencia Cardíaca',
    value: 72,
    unit: 'bpm',
    metricKey: 'heartRate' as any,
    history: mockHistory,
    thresholds: mockThresholds,
    evidenceId: 'NASA-STD-3001-VOL1-CVS',
    onOpenEvidence: onOpenEvidenceSpy,
  });

  const headerDiv = cardElement.props.children[0];
  const titleRow = headerDiv.props.children[0];
  const buttonsGroup = titleRow.props.children[1];
  const refButton = buttonsGroup.props.children[0];

  const syntheticEvent = {
    stopPropagation: () => {
      stoppedPropagation = true;
    },
  };

  refButton.props.onClick(syntheticEvent);
  assert(stoppedPropagation, 'MetricCard: [Ref] button calls e.stopPropagation()');
  assert(
    openedEvidenceId === 'NASA-STD-3001-VOL1-CVS',
    'MetricCard: onOpenEvidence called with exact evidenceId',
    `Received: ${openedEvidenceId}`
  );

  // Footer span click test
  const footerDiv = cardElement.props.children[2];
  const refSpan = footerDiv.props.children[0];
  assert(typeof refSpan.props.onClick === 'function', 'MetricCard: Footer Ref span has onClick handler');
  refSpan.props.onClick();
  assert(
    openedEvidenceId === 'NASA-STD-3001-VOL1-CVS',
    'MetricCard: Footer span onClick calls onOpenEvidence with evidenceId'
  );
} catch (err: any) {
  assert(false, 'MetricCard: Interaction test with onOpenEvidence failed', err.message);
}

// Test 1.4: MetricCard propagation test (parent container click isolation)
try {
  let parentClicked = false;
  let childEvidenceOpened = false;
  const parentContainerClick = () => {
    parentClicked = true;
  };

  const onOpenEvidence = (_id: string) => {
    childEvidenceOpened = true;
  };

  const cardElement = MetricCard({
    title: 'Presión Arterial',
    value: '120/80',
    unit: 'mmHg',
    metricKey: 'bloodPressure' as any,
    history: mockHistory,
    thresholds: mockThresholds,
    evidenceId: 'NASA-STD-3001-VOL1-CVS',
    onOpenEvidence,
  });

  const headerDiv = cardElement.props.children[0];
  const titleRow = headerDiv.props.children[0];
  const buttonsGroup = titleRow.props.children[1];
  const refButton = buttonsGroup.props.children[0];

  // Simulate event dispatch through a bubbling listener simulator
  let propagationStopped = false;
  const event = {
    stopPropagation: () => {
      propagationStopped = true;
    },
  };

  // Button onClick
  refButton.props.onClick(event);
  if (!propagationStopped) {
    parentContainerClick();
  }

  assert(childEvidenceOpened, 'MetricCard: [Ref] click invokes onOpenEvidence');
  assert(propagationStopped, 'MetricCard: [Ref] click blocks bubbling via stopPropagation');
  assert(!parentClicked, 'MetricCard: Parent container click handler is NOT triggered');
} catch (err: any) {
  assert(false, 'MetricCard: Propagation isolation test failed', err.message);
}

console.log('\n=== TEST SUITE 2: ScientificEvidenceDrawer Edge Cases ===');

// Test 2.1: Initial selectedEvidenceId not found in registry (NPE check)
try {
  const invalidIds = ['NON_EXISTENT_EVIDENCE_999', '', 'undefined', 'null', 'UNKNOWN_AGENCY_CODE'];
  for (const testId of invalidIds) {
    const html = renderToStaticMarkup(
      React.createElement(ScientificEvidenceDrawer, {
        isOpen: true,
        onClose: () => {},
        initialEvidenceId: testId,
      })
    );
    assert(
      html.includes('Registro Científico Multi-Agencia'),
      `ScientificEvidenceDrawer: Renders with non-existent id "${testId}" without throwing NPE`
    );
    assert(
      html.includes('NASA-STD-3001 Vol 1 Rev B'),
      `ScientificEvidenceDrawer: Standard registry items still render when non-existent id is passed`
    );
  }

  // Also test with null / undefined
  const htmlNull = renderToStaticMarkup(
    React.createElement(ScientificEvidenceDrawer, {
      isOpen: true,
      onClose: () => {},
      initialEvidenceId: null,
    })
  );
  assert(htmlNull.includes('Registro Científico Multi-Agencia'), 'ScientificEvidenceDrawer: Renders with initialEvidenceId=null without NPE');
} catch (err: any) {
  assert(false, 'ScientificEvidenceDrawer: Threw error on non-existent initialEvidenceId', err.message);
}

// Test 2.2: Backdrop click triggers onClose
try {
  let closed = false;
  const onCloseSpy = () => {
    closed = true;
  };

  let capturedBackdropProps: any = null;
  let capturedAsideProps: any = null;
  let capturedCloseBtnProps: any = null;

  function Inspector() {
    const drawerVNode: any = ScientificEvidenceDrawer({
      isOpen: true,
      onClose: onCloseSpy,
    });
    const [backdrop, aside] = drawerVNode.props.children;
    capturedBackdropProps = backdrop.props;
    capturedAsideProps = aside.props;
    // Find close button in header
    const drawerHeader = aside.props.children[0];
    const closeBtn = drawerHeader.props.children[1];
    capturedCloseBtnProps = closeBtn.props;
    return null;
  }

  renderToStaticMarkup(React.createElement(Inspector));

  assert(capturedBackdropProps !== null, 'ScientificEvidenceDrawer: Backdrop extracted successfully in render context');
  assert(capturedBackdropProps.className.includes('fixed inset-0'), 'ScientificEvidenceDrawer: Backdrop has fixed inset-0 overlay');
  assert(typeof capturedBackdropProps.onClick === 'function', 'ScientificEvidenceDrawer: Backdrop has onClick handler');

  // Trigger backdrop click
  capturedBackdropProps.onClick();
  assert(closed, 'ScientificEvidenceDrawer: Clicking backdrop triggers onClose callback');

  // Verify aside is sibling, preventing click propagation to backdrop
  assert(capturedAsideProps !== null, 'ScientificEvidenceDrawer: Aside container is isolated sibling of backdrop');

  // Trigger header close button click
  closed = false;
  capturedCloseBtnProps.onClick();
  assert(closed, 'ScientificEvidenceDrawer: Clicking header X button triggers onClose');
} catch (err: any) {
  assert(false, 'ScientificEvidenceDrawer: Backdrop and close button test failed', err.message);
}

// Test 2.3: Empty search results display gracefully & filter reset
try {
  // Test direct search helper first
  const emptySearchResult = searchEvidence('ZXY_NON_EXISTENT_MARKER_12345');
  assert(emptySearchResult.length === 0, 'searchEvidence: Correctly returns 0 results for non-existent query');

  let interceptedHtml = '';
  let capturedResetAction: (() => void) | null = null;
  const ReactSharedInternals =
    (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
    (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

  function EmptySearchDrawerInspector() {
    const origUseState = ReactSharedInternals.H.useState;
    let callIdx = 0;
    ReactSharedInternals.H.useState = (init: any) => {
      callIdx++;
      if (callIdx === 1) {
        // Return non-existent search query for the 1st useState hook (searchQuery)
        return ['non_existent_biomarker_test_query', () => {}];
      }
      return origUseState(init);
    };

    try {
      const vnode: any = ScientificEvidenceDrawer({
        isOpen: true,
        onClose: () => {},
      });
      const aside = vnode.props.children[1];
      const asideChildren = React.Children.toArray(aside.props.children);
      const scrollArea: any = asideChildren[2];
      const emptyStateBox: any = scrollArea?.props?.children;
      const boxChildren = React.Children.toArray(emptyStateBox?.props?.children);
      const resetBtn: any = boxChildren.find((c: any) => c && c.type === 'button') || boxChildren[3];
      capturedResetAction = resetBtn?.props?.onClick;
      return vnode;
    } finally {
      ReactSharedInternals.H.useState = origUseState;
    }
  }

  interceptedHtml = renderToStaticMarkup(React.createElement(EmptySearchDrawerInspector));

  assert(
    interceptedHtml.includes('No se encontraron evidencias coincidentes'),
    'ScientificEvidenceDrawer: Displays graceful empty state message when no results match query'
  );
  assert(
    interceptedHtml.includes('Intente ajustar los términos de búsqueda o los filtros de agencia/categoría.'),
    'ScientificEvidenceDrawer: Displays helpful suggestion to adjust filters'
  );
  assert(
    interceptedHtml.includes('Restablecer todos los filtros'),
    'ScientificEvidenceDrawer: Displays "Restablecer todos los filtros" button'
  );
  assert(
    interceptedHtml.includes('Mostrando <span class="text-sky-300 font-semibold">0</span> de 16'),
    'ScientificEvidenceDrawer: Dynamic count correctly reports 0 of 16'
  );
  assert(typeof capturedResetAction === 'function', 'ScientificEvidenceDrawer: Reset button has an executable onClick handler');
} catch (err: any) {
  assert(false, 'ScientificEvidenceDrawer: Empty search test failed', err.message);
}

// Test 2.4: Agency and Category filter checks
try {
  const nasaOnly = NASA_SCIENTIFIC_REGISTRY.filter((e) => e.agency === 'NASA');
  const esaOnly = NASA_SCIENTIFIC_REGISTRY.filter((e) => e.agency === 'ESA');
  const jaxaOnly = NASA_SCIENTIFIC_REGISTRY.filter((e) => e.agency === 'JAXA');
  const csaOnly = NASA_SCIENTIFIC_REGISTRY.filter((e) => e.agency === 'CSA');
  const aebOnly = NASA_SCIENTIFIC_REGISTRY.filter((e) => e.agency === 'AEB');

  assert(nasaOnly.length >= 10, 'Registry contains >= 10 NASA standards and evidence entries');
  assert(esaOnly.length >= 1, 'Registry contains ESA evidence');
  assert(jaxaOnly.length >= 1, 'Registry contains JAXA evidence');
  assert(csaOnly.length >= 1, 'Registry contains CSA evidence');
  assert(aebOnly.length >= 1, 'Registry contains AEB evidence');
} catch (err: any) {
  assert(false, 'Registry filter checks failed', err.message);
}

console.log('\n=== TEST SUITE 3: Registry & Citation Format Checks ===');

// Test 3.1: Verify registry completeness and fields
assert(NASA_SCIENTIFIC_REGISTRY.length === 16, 'Registry contains exactly 16 comprehensive scientific entries');
for (const entry of NASA_SCIENTIFIC_REGISTRY) {
  assert(Boolean(entry.id), `Entry ${entry.id} has valid id`);
  assert(Boolean(entry.thresholdSpec), `Entry ${entry.id} has thresholdSpec`);
  assert(Boolean(entry.thresholdSpec.nominalRange), `Entry ${entry.id} has nominalRange`);
  assert(Boolean(entry.thresholdSpec.cautionRange), `Entry ${entry.id} has cautionRange`);
  assert(Boolean(entry.thresholdSpec.criticalThreshold), `Entry ${entry.id} has criticalThreshold`);
}

// Test 3.2: Verify APA and BibTeX citation formatting
const sampleEntry = NASA_SCIENTIFIC_REGISTRY[0];
const apa = generateApaCitation(sampleEntry);
assert(apa.includes(String(sampleEntry.publicationDetails.year)), 'APA citation contains publication year');
assert(apa.includes(sampleEntry.publicationDetails.journalOrSource), 'APA citation contains journal or source');

const bibtex = generateBibtex(sampleEntry);
assert(bibtex.startsWith('@article') || bibtex.startsWith('@misc') || bibtex.startsWith('@standard') || bibtex.startsWith('@techreport'), 'BibTeX citation starts with valid BibTeX type');
assert(bibtex.includes(String(sampleEntry.publicationDetails.year)), 'BibTeX citation contains year');

// Test 3.3: Stress & edge cases
try {
  // Empty history test
  const emptyHistoryHtml = renderToStaticMarkup(
    React.createElement(MetricCard, {
      title: 'Frecuencia Cardíaca',
      value: 'N/A',
      unit: 'bpm',
      metricKey: 'heartRate' as any,
      history: [],
      thresholds: mockThresholds,
    })
  );
  assert(emptyHistoryHtml.includes('NOMINAL'), 'MetricCard: NaN/string value safely defaults to NOMINAL');
  assert(emptyHistoryHtml.includes('<polyline'), 'MetricCard: Renders polyline even with empty history');
  assert(!emptyHistoryHtml.includes('<circle'), 'MetricCard: Omits endpoint circle when history is empty');

  // Search query with regex special characters
  const specialChars = ['(', '[', '*', '+', '?', '\\', 'NASA-STD-3001', '8-OHdG'];
  for (const query of specialChars) {
    const results = searchEvidence(query);
    assert(Array.isArray(results), `searchEvidence: Handled special characters "${query}" safely without regex crashes`);
  }

  // Drawer closed rendering state
  const closedDrawerHtml = renderToStaticMarkup(
    React.createElement(ScientificEvidenceDrawer, {
      isOpen: false,
      onClose: () => {},
    })
  );
  assert(closedDrawerHtml.includes('translate-x-full'), 'ScientificEvidenceDrawer: Aside has translate-x-full when closed');
  assert(closedDrawerHtml.includes('opacity-0 pointer-events-none'), 'ScientificEvidenceDrawer: Backdrop is hidden and pointer-events-none when closed');
} catch (err: any) {
  assert(false, 'Stress test failed', err.message);
}

console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) {
  process.exit(1);
}
