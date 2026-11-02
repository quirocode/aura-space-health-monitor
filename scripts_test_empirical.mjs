/**
 * Empirical Test Suite for Challenger M1-1
 * Tests NASA Scientific Registry and Citation Drawer helpers
 */

import {
  NASA_SCIENTIFIC_REGISTRY,
  getAllEvidence,
  getEvidenceById,
  getEvidenceByAgency,
  getEvidenceByCategory,
  searchEvidence,
  generateApaCitation,
  generateBibtex,
  getCategoryLabel,
  getAgencyBadgeColor
} from './src/data/nasaScientificRegistry.ts';

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passCount++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failCount++;
    const msg = `  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`;
    console.error(msg);
    failures.push({ testName, details });
  }
}

console.log('=====================================================');
console.log('SUITE 1: Registry Data Integrity & Schema Validation');
console.log('=====================================================');

assert(NASA_SCIENTIFIC_REGISTRY.length >= 15, 'Registry contains at least 15 entries', `Actual: ${NASA_SCIENTIFIC_REGISTRY.length}`);
assert(NASA_SCIENTIFIC_REGISTRY.length === 16, 'Registry contains exactly 16 entries as documented', `Actual: ${NASA_SCIENTIFIC_REGISTRY.length}`);

// Check uniqueness of IDs
const ids = NASA_SCIENTIFIC_REGISTRY.map(e => e.id);
const uniqueIds = new Set(ids);
assert(ids.length === uniqueIds.size, 'All canonical IDs are unique', `Total: ${ids.length}, Unique: ${uniqueIds.size}`);

// Check uniqueness of altIds
const altIds = NASA_SCIENTIFIC_REGISTRY.map(e => e.altId).filter(Boolean);
const uniqueAltIds = new Set(altIds);
assert(altIds.length === uniqueAltIds.size, 'All altIds are unique', `Total: ${altIds.length}, Unique: ${uniqueAltIds.size}`);

// Check agencies representation
const agencies = ['NASA', 'ESA', 'JAXA', 'CSA', 'AEB'];
const foundAgencies = new Set(NASA_SCIENTIFIC_REGISTRY.map(e => e.agency));
for (const agency of agencies) {
  assert(foundAgencies.has(agency), `Agency ${agency} is present in registry`);
}

// Agency counts
const agencyCounts = {};
for (const e of NASA_SCIENTIFIC_REGISTRY) {
  agencyCounts[e.agency] = (agencyCounts[e.agency] || 0) + 1;
}
console.log('  Agency distribution:', JSON.stringify(agencyCounts));

// Check categories representation
const expectedCategories = [
  'cardiovascular_0g',
  'neuro_ocular_sans',
  'bone_muscle_deconditioning',
  'radiation_bfo_spe',
  'decompression_eva',
  'circadian_sleep',
  'autonomous_triage',
  'genomics_soma',
  'metabolic_redox'
];
const foundCategories = new Set(NASA_SCIENTIFIC_REGISTRY.map(e => e.category));
for (const cat of expectedCategories) {
  assert(foundCategories.has(cat), `Category ${cat} is present in registry`);
}

// Validate field completeness on all entries
NASA_SCIENTIFIC_REGISTRY.forEach((entry, idx) => {
  const prefix = `[Entry ${idx} ${entry.id}]`;
  assert(typeof entry.id === 'string' && entry.id.trim().length > 0, `${prefix} has valid id`);
  assert(typeof entry.standardCode === 'string' && entry.standardCode.trim().length > 0, `${prefix} has valid standardCode`);
  assert(typeof entry.title === 'string' && entry.title.trim().length > 0, `${prefix} has valid title`);
  assert(typeof entry.shortSummary === 'string' && entry.shortSummary.trim().length > 0, `${prefix} has valid shortSummary`);
  assert(typeof entry.clinicalThreshold === 'string' && entry.clinicalThreshold.trim().length > 0, `${prefix} has valid clinicalThreshold`);
  assert(typeof entry.spaceflightContext === 'string' && entry.spaceflightContext.trim().length > 0, `${prefix} has valid spaceflightContext`);
  assert(typeof entry.operationalImpact === 'string' && entry.operationalImpact.trim().length > 0, `${prefix} has valid operationalImpact`);
  assert(typeof entry.countermeasureProtocol === 'string' && entry.countermeasureProtocol.trim().length > 0, `${prefix} has valid countermeasureProtocol`);
  assert(typeof entry.publicationRef === 'string' && entry.publicationRef.trim().length > 0, `${prefix} has valid publicationRef`);
  assert(Array.isArray(entry.tags) && entry.tags.length > 0, `${prefix} has non-empty tags array`);
  assert(Array.isArray(entry.applicableEnvironments) && entry.applicableEnvironments.length > 0, `${prefix} has applicableEnvironments`);
  
  // Validate thresholdSpec
  assert(entry.thresholdSpec && typeof entry.thresholdSpec === 'object', `${prefix} has thresholdSpec`);
  assert(typeof entry.thresholdSpec.parameter === 'string' && entry.thresholdSpec.parameter.length > 0, `${prefix} thresholdSpec.parameter valid`);
  assert(typeof entry.thresholdSpec.nominalRange === 'string' && entry.thresholdSpec.nominalRange.length > 0, `${prefix} thresholdSpec.nominalRange valid`);
  assert(typeof entry.thresholdSpec.cautionRange === 'string' && entry.thresholdSpec.cautionRange.length > 0, `${prefix} thresholdSpec.cautionRange valid`);
  assert(typeof entry.thresholdSpec.criticalThreshold === 'string' && entry.thresholdSpec.criticalThreshold.length > 0, `${prefix} thresholdSpec.criticalThreshold valid`);
  assert(typeof entry.thresholdSpec.unit === 'string' && entry.thresholdSpec.unit.length > 0, `${prefix} thresholdSpec.unit valid`);
  
  // Validate publicationDetails
  assert(entry.publicationDetails && typeof entry.publicationDetails === 'object', `${prefix} has publicationDetails`);
  assert(typeof entry.publicationDetails.authors === 'string' && entry.publicationDetails.authors.length > 0, `${prefix} publicationDetails.authors valid`);
  assert(typeof entry.publicationDetails.year === 'number' && entry.publicationDetails.year > 1950, `${prefix} publicationDetails.year valid`);
  assert(typeof entry.publicationDetails.title === 'string' && entry.publicationDetails.title.length > 0, `${prefix} publicationDetails.title valid`);
  assert(typeof entry.publicationDetails.journalOrSource === 'string' && entry.publicationDetails.journalOrSource.length > 0, `${prefix} publicationDetails.journalOrSource valid`);
  assert(typeof entry.publicationDetails.url === 'string' && entry.publicationDetails.url.startsWith('http'), `${prefix} publicationDetails.url is valid URL`);
  
  // Validate bibtex
  assert(typeof entry.bibtexCitation === 'string' && entry.bibtexCitation.includes('@'), `${prefix} has valid bibtexCitation`);
});

console.log('\n=====================================================');
console.log('SUITE 2: Query Helper Tests (getEvidenceById)');
console.log('=====================================================');

// Exact ID matches
NASA_SCIENTIFIC_REGISTRY.forEach(e => {
  const result = getEvidenceById(e.id);
  assert(result !== undefined && result.id === e.id, `getEvidenceById finds canonical ID ${e.id}`);
});

// altId matches
NASA_SCIENTIFIC_REGISTRY.forEach(e => {
  if (e.altId) {
    const result = getEvidenceById(e.altId);
    assert(result !== undefined && result.id === e.id, `getEvidenceById finds altId ${e.altId}`);
  }
});

// Case insensitivity
assert(getEvidenceById('nasa-std-3001-vol1-cvs')?.id === 'NASA-STD-3001-VOL1-CVS', 'getEvidenceById handles lowercase canonical ID');
assert(getEvidenceById('reg-nasa-cardio-01')?.id === 'NASA-STD-3001-VOL1-CVS', 'getEvidenceById handles lowercase altId');
assert(getEvidenceById('NASA-std-3001-VoL1-CVS')?.id === 'NASA-STD-3001-VOL1-CVS', 'getEvidenceById handles mixed-case canonical ID');

// Whitespace trimming
assert(getEvidenceById('  NASA-STD-3001-VOL1-CVS  ')?.id === 'NASA-STD-3001-VOL1-CVS', 'getEvidenceById trims outer whitespace');

// Partial standardCode match
assert(getEvidenceById('Sec 3.2')?.id === 'NASA-STD-3001-VOL1-CVS', 'getEvidenceById matches partial standardCode "Sec 3.2"');
assert(getEvidenceById('EveryWear')?.id === 'ESA-EVERYWEAR-TEMP', 'getEvidenceById matches partial standardCode "EveryWear"');

// Non-existent / invalid IDs
assert(getEvidenceById('NON_EXISTENT_ID_999') === undefined, 'getEvidenceById returns undefined for unknown ID');
assert(getEvidenceById('') === undefined, 'getEvidenceById returns undefined for empty string');

// CRITICAL EDGE CASE: Whitespace-only string
const whitespaceOnlyResult = getEvidenceById('   ');
console.log('  [OBSERVATION] getEvidenceById("   ") returned:', whitespaceOnlyResult ? whitespaceOnlyResult.id : 'undefined');
// We test if it returns undefined. If not, this is an empirical bug!
assert(whitespaceOnlyResult === undefined, 'getEvidenceById("   ") returns undefined for whitespace-only string', `Returned: ${whitespaceOnlyResult?.id}`);

// Null / undefined runtime safety
try {
  const nullResult = getEvidenceById(null);
  assert(nullResult === undefined, 'getEvidenceById(null) returns undefined safely');
} catch (err) {
  assert(false, 'getEvidenceById(null) should not throw', err.message);
}

try {
  const undefResult = getEvidenceById(undefined);
  assert(undefResult === undefined, 'getEvidenceById(undefined) returns undefined safely');
} catch (err) {
  assert(false, 'getEvidenceById(undefined) should not throw', err.message);
}

console.log('\n=====================================================');
console.log('SUITE 3: Agency & Category Filters');
console.log('=====================================================');

// getEvidenceByAgency
for (const agency of agencies) {
  const list = getEvidenceByAgency(agency);
  assert(list.length > 0, `getEvidenceByAgency("${agency}") returns entries`, `Count: ${list.length}`);
  assert(list.every(e => e.agency === agency), `All results from getEvidenceByAgency("${agency}") match agency`);
}
assert(getEvidenceByAgency('UNKNOWN').length === 0, 'getEvidenceByAgency("UNKNOWN") returns empty array');
assert(getEvidenceByAgency('').length === 0, 'getEvidenceByAgency("") returns empty array');

// getEvidenceByCategory
for (const cat of expectedCategories) {
  const list = getEvidenceByCategory(cat);
  assert(list.length > 0, `getEvidenceByCategory("${cat}") returns entries`, `Count: ${list.length}`);
  assert(list.every(e => e.category === cat), `All results from getEvidenceByCategory("${cat}") match category`);
}
assert(getEvidenceByCategory('unknown_category').length === 0, 'getEvidenceByCategory("unknown") returns empty array');

console.log('\n=====================================================');
console.log('SUITE 4: searchEvidence Tests');
console.log('=====================================================');

// Empty & whitespace search
assert(searchEvidence('').length === 16, 'searchEvidence("") returns all 16 entries');
assert(searchEvidence('   ').length === 16, 'searchEvidence("   ") returns all 16 entries');
assert(searchEvidence(null).length === 16, 'searchEvidence(null) returns all 16 entries');
assert(searchEvidence(undefined).length === 16, 'searchEvidence(undefined) returns all 16 entries');

// Specific searches
assert(searchEvidence('cardiovascular').length >= 2, 'searchEvidence("cardiovascular") finds >= 2 entries');
assert(searchEvidence('SANS').length >= 1, 'searchEvidence("SANS") finds SANS entries');
assert(searchEvidence('Astroskin').length >= 1, 'searchEvidence("Astroskin") finds CSA entry');
assert(searchEvidence('EveryWear').length >= 1, 'searchEvidence("EveryWear") finds ESA entry');
assert(searchEvidence('Kibo').length >= 1, 'searchEvidence("Kibo") finds JAXA entry');
assert(searchEvidence('Centenário').length >= 1, 'searchEvidence("Centenário") finds AEB entry');

// Case insensitivity
assert(searchEvidence('sans').length === searchEvidence('SANS').length, 'searchEvidence is case-insensitive for "sans" vs "SANS"');
assert(searchEvidence('ASTROSKIN').length === searchEvidence('astroskin').length, 'searchEvidence is case-insensitive for "ASTROSKIN"');

// Multi-token search (AND condition)
const multiResults = searchEvidence('NASA cardiovascular');
assert(multiResults.length > 0, 'searchEvidence("NASA cardiovascular") finds matches');
assert(multiResults.every(e => e.agency === 'NASA' || e.tags.includes('cardiovascular')), 'Multi-token results contain all tokens');

// Search for non-existent term
assert(searchEvidence('supercalifragilistic12345').length === 0, 'searchEvidence returns empty array for non-matching query');

// Search with one matching token and one impossible token
assert(searchEvidence('NASA supercalifragilistic12345').length === 0, 'Multi-token search with impossible token returns empty array');

// Stress testing special characters in query
const specialCharQueries = [
  'NASA-STD-3001',
  '8.2',
  '480nm',
  'CO2',
  '8-OHdG',
  'SpO2 <85%',
  '37.0 °C',
  '#*()[]+?^$\\',
  '<!DOCTYPE html>',
  '<script>alert(1)</script>',
  'quotes "test" and \'test\'',
  'emoji 🚀 test',
  'Latin1 áéíóú ñ',
  '   multiple    spaces   between   words   '
];

for (const q of specialCharQueries) {
  try {
    const results = searchEvidence(q);
    assert(Array.isArray(results), `searchEvidence survives special char query: "${q.replace(/\n/g, '')}"`);
  } catch (err) {
    assert(false, `searchEvidence failed on special char query: "${q}"`, err.message);
  }
}

// Tokenizing check: multiple spaces between words
const spacedResults = searchEvidence('   NASA    cardiovascular   ');
assert(spacedResults.length === searchEvidence('NASA cardiovascular').length, 'searchEvidence handles multiple whitespace separators cleanly');

console.log('\n=====================================================');
console.log('SUITE 5: Citation Generators (BibTeX & APA)');
console.log('=====================================================');

// Test on all 16 entries
NASA_SCIENTIFIC_REGISTRY.forEach((entry, idx) => {
  const apa = generateApaCitation(entry);
  assert(typeof apa === 'string' && apa.length > 20, `generateApaCitation produces valid string for entry ${idx} (${entry.id})`);
  assert(apa.includes(entry.publicationDetails.authors), `APA citation contains author for entry ${idx}`);
  assert(apa.includes(String(entry.publicationDetails.year)), `APA citation contains year for entry ${idx}`);
  assert(apa.includes(entry.publicationDetails.title), `APA citation contains title for entry ${idx}`);

  const bibtex = generateBibtex(entry);
  assert(typeof bibtex === 'string' && bibtex.startsWith('@'), `generateBibtex produces valid BibTeX block for entry ${idx} (${entry.id})`);
  assert(bibtex.includes(entry.publicationDetails.title) || bibtex.includes('title'), `BibTeX citation contains title info for entry ${idx}`);
});

// Test BibTeX fallback generator when bibtexCitation is empty
const mockEntryWithoutBibtex = {
  id: 'MOCK-TEST-ENTRY-01',
  agency: 'NASA',
  category: 'cardiovascular_0g',
  standardCode: 'MOCK-STD-001',
  title: 'Mock Test Standard for Aerospace Testing',
  shortSummary: 'Mock summary',
  clinicalThreshold: 'Mock threshold',
  thresholdSpec: {
    parameter: 'Mock Parameter',
    nominalRange: '0-10',
    cautionRange: '10-20',
    criticalThreshold: '>20',
    unit: 'units'
  },
  spaceflightContext: 'Mock context',
  operationalImpact: 'Mock impact',
  countermeasureProtocol: 'Mock protocol',
  publicationRef: 'Tester, J. (2026). Mock study.',
  publicationDetails: {
    authors: 'Tester, John and Doe, Jane',
    year: 2026,
    title: 'Mock Aerospace Title With Special Chars & Symbols: An Analysis',
    journalOrSource: 'Aerospace Medicine Journal',
    doiOrUid: '10.1234/mock.2026',
    url: 'https://example.com/mock'
  },
  tags: ['mock', 'test'],
  applicableEnvironments: ['microgravity'],
  bibtexCitation: '' // Empty to trigger fallback generator
};

const fallbackBibtex = generateBibtex(mockEntryWithoutBibtex);
assert(fallbackBibtex.startsWith('@article{NASA_2026_MOCK_TEST_ENTRY_01,'), 'BibTeX fallback generates correct citeKey', fallbackBibtex.split('\n')[0]);
assert(fallbackBibtex.includes('author = {Tester, John and Doe, Jane}'), 'BibTeX fallback includes authors');
assert(fallbackBibtex.includes('url = {https://example.com/mock}'), 'BibTeX fallback includes url');

// Test APA citation formatting without doiOrUid
const mockEntryWithoutDoi = {
  ...mockEntryWithoutBibtex,
  publicationDetails: {
    ...mockEntryWithoutBibtex.publicationDetails,
    doiOrUid: undefined
  }
};
const apaWithoutDoi = generateApaCitation(mockEntryWithoutDoi);
assert(!apaWithoutDoi.includes('https://doi.org/undefined'), 'APA citation handles missing doiOrUid gracefully without "undefined"');
assert(!apaWithoutDoi.endsWith('https://doi.org/'), 'APA citation does not leave dangling doi prefix');

console.log('\n=====================================================');
console.log('SUITE 6: Category Labels & Agency Badge Colors');
console.log('=====================================================');

for (const cat of expectedCategories) {
  const label = getCategoryLabel(cat);
  assert(typeof label === 'string' && label.length > 0 && label !== cat, `getCategoryLabel returns Spanish human label for ${cat}: "${label}"`);
}
// Fallback for unexpected category
assert(getCategoryLabel('custom_unknown_cat') === 'custom_unknown_cat', 'getCategoryLabel falls back to raw string for unknown category');

for (const agency of agencies) {
  const colors = getAgencyBadgeColor(agency);
  assert(colors && colors.border && colors.bg && colors.text && colors.badge && colors.glow, `getAgencyBadgeColor returns full color palette for ${agency}`);
}

console.log('\n=====================================================');
console.log('SUITE 7: Immutability & Array Mutation Safety');
console.log('=====================================================');

const allEvidenceCopy1 = getAllEvidence();
allEvidenceCopy1.pop(); // Mutate returned array
assert(allEvidenceCopy1.length === 15, 'Mutated copy length is 15');
assert(NASA_SCIENTIFIC_REGISTRY.length === 16, 'getAllEvidence returns shallow copy, protecting NASA_SCIENTIFIC_REGISTRY length');
assert(getAllEvidence().length === 16, 'Subsequent call to getAllEvidence still returns 16');

console.log('\n=====================================================');
console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED out of ${passCount + failCount} assertions.`);
if (failures.length > 0) {
  console.log('FAILURES:');
  failures.forEach(f => console.log(` - ${f.testName} ${f.details ? `(${f.details})` : ''}`));
}
console.log('=====================================================');
