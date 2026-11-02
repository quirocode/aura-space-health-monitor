import React, { useState, useEffect, useRef, useMemo } from 'react';
import type {
  SpaceAgency,
  ClinicalEvidenceCategory,
  ScientificEvidenceEntry,
} from '../../data/nasaScientificRegistry';
import {
  getAllEvidence,
  getEvidenceById,
  generateBibtex,
  generateApaCitation,
  getAgencyBadgeColor,
  getCategoryLabel,
} from '../../data/nasaScientificRegistry';
import {
  X,
  Search,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  Shield,
  FileText,
  Activity,
  Sparkles,
  Info,
  SlidersHorizontal,
} from 'lucide-react';

export interface ScientificEvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialEvidenceId?: string | null;
  onSelectEvidence?: (id: string) => void;
}

const AGENCIES: { id: SpaceAgency | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'TODAS (16)' },
  { id: 'NASA', label: 'NASA' },
  { id: 'ESA', label: 'ESA' },
  { id: 'JAXA', label: 'JAXA' },
  { id: 'CSA', label: 'CSA' },
  { id: 'AEB', label: 'AEB' },
];

const CATEGORIES: { id: ClinicalEvidenceCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Todas las Categorías' },
  { id: 'cardiovascular_0g', label: 'Cardiovascular 0g / IJV' },
  { id: 'neuro_ocular_sans', label: 'Neuro-Ocular (SANS)' },
  { id: 'bone_muscle_deconditioning', label: 'Músculo-Esquelético' },
  { id: 'radiation_bfo_spe', label: 'Radiación BFO / SPE' },
  { id: 'decompression_eva', label: 'Descompresión EVA / ECLSS' },
  { id: 'circadian_sleep', label: 'Ciclo Circadiano (480nm)' },
  { id: 'genomics_soma', label: 'Genómica / SOMA' },
  { id: 'metabolic_redox', label: 'Estrés Oxidativo / Redox' },
  { id: 'autonomous_triage', label: 'Triaje Autónomo (START)' },
];

export const ScientificEvidenceDrawer: React.FC<ScientificEvidenceDrawerProps> = ({
  isOpen,
  onClose,
  initialEvidenceId,
  onSelectEvidence,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<SpaceAgency | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<ClinicalEvidenceCategory | 'ALL'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'bibtex' | 'apa' | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle auto-scroll and highlight when initialEvidenceId is provided or changes
  useEffect(() => {
    if (isOpen && initialEvidenceId) {
      const entry = getEvidenceById(initialEvidenceId);
      if (entry) {
        const timer = setTimeout(() => {
          setHighlightedId(entry.id);
          setSelectedAgency('ALL');
          setSelectedCategory('ALL');
          setSearchQuery('');
          const el = cardRefs.current.get(entry.id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);

        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, initialEvidenceId]);

  // Filter and search logic
  const allEvidence = useMemo(() => getAllEvidence(), []);

  const filteredEvidence = useMemo(() => {
    let result = allEvidence;

    if (selectedAgency !== 'ALL') {
      result = result.filter((e) => e.agency === selectedAgency);
    }

    if (selectedCategory !== 'ALL') {
      result = result.filter((e) => e.category === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
      const tokens = searchQuery.toLowerCase().trim().split(/\s+/);
      result = result.filter((e) => {
        const searchable = [
          e.id,
          e.altId ?? '',
          e.agency,
          e.category,
          e.standardCode,
          e.title,
          e.shortSummary,
          e.clinicalThreshold,
          e.spaceflightContext,
          e.operationalImpact,
          e.countermeasureProtocol,
          e.publicationRef,
          e.publicationDetails.authors,
          e.publicationDetails.doiOrUid ?? '',
          e.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase();

        return tokens.every((token) => searchable.includes(token));
      });
    }

    return result;
  }, [allEvidence, selectedAgency, selectedCategory, searchQuery]);

  // Copy citation to clipboard
  const handleCopyCitation = async (entry: ScientificEvidenceEntry, type: 'bibtex' | 'apa') => {
    try {
      const textToCopy = type === 'bibtex' ? generateBibtex(entry) : generateApaCitation(entry);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(entry.id);
      setCopiedType(type);
      setTimeout(() => {
        setCopiedId(null);
        setCopiedType(null);
      }, 2500);
    } catch (err) {
      console.error('Error al copiar cita:', err);
    }
  };

  const handleCardClick = (id: string) => {
    setHighlightedId(id);
    onSelectEvidence?.(id);
  };

  return (
    <>
      {/* Translucent Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Container */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:max-w-xl md:max-w-2xl bg-[#0b0f17] border-l border-white/[0.08] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Registro Científico Multi-Agencia"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-slate-950/70 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-center text-sky-400 mt-0.5 shrink-0 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-mono text-base font-semibold text-slate-100 tracking-wide uppercase">
                  Registro Científico Multi-Agencia
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950/50 border border-sky-500/30 text-sky-300 font-medium">
                  v4.0 Validado
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Estándares aeroespaciales oficiales de NASA-STD-3001, HRP, OSDR (Twins/SOMA), CSA Astroskin, ESA EveryWear, JAXA Kibo y AEB.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 p-1.5 rounded-lg border border-transparent hover:border-slate-700 transition-colors"
            title="Cerrar panel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-white/[0.08] bg-slate-900/40 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por estándar, umbral, autor, DOI o palabra clave..."
              className="w-full pl-9 pr-9 py-2 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Agency Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {AGENCIES.map((agency) => {
              const isSelected = selectedAgency === agency.id;
              const agencyColor = agency.id !== 'ALL' ? getAgencyBadgeColor(agency.id as SpaceAgency) : null;

              return (
                <button
                  key={agency.id}
                  onClick={() => setSelectedAgency(agency.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium tracking-tight whitespace-nowrap transition-all border ${
                    isSelected
                      ? agencyColor
                        ? `${agencyColor.bg} ${agencyColor.text} ${agencyColor.border} shadow-sm`
                        : 'bg-sky-950/60 text-sky-200 border-sky-500/50 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {agency.label}
                </button>
              );
            })}
          </div>

          {/* Category Dropdown and Quick Count */}
          <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ClinicalEvidenceCategory | 'ALL')}
                className="bg-slate-950/80 border border-slate-700/80 text-slate-300 rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:border-sky-500/60 truncate w-full max-w-[280px]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="shrink-0 text-slate-400 tabular-telemetry">
              Mostrando <span className="text-sky-300 font-semibold">{filteredEvidence.length}</span> de {allEvidence.length}
            </div>
          </div>
        </div>

        {/* Scrollable Evidence Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredEvidence.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
              <Info className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
              <p className="font-mono text-sm text-slate-300">No se encontraron evidencias coincidentes</p>
              <p className="text-xs text-slate-500 mt-1">Intente ajustar los términos de búsqueda o los filtros de agencia/categoría.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedAgency('ALL');
                  setSelectedCategory('ALL');
                }}
                className="mt-3 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-mono text-sky-400 transition-colors"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            filteredEvidence.map((entry) => {
              const agencyStyle = getAgencyBadgeColor(entry.agency);
              const isHighlighted = highlightedId === entry.id;

              return (
                <div
                  key={entry.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(entry.id, el);
                    else cardRefs.current.delete(entry.id);
                  }}
                  onClick={() => handleCardClick(entry.id)}
                  className={`rounded-xl border transition-all duration-300 p-4 bg-slate-900/40 relative cursor-pointer ${
                    isHighlighted
                      ? 'border-sky-500/80 ring-2 ring-sky-500/30 bg-sky-950/20 shadow-lg shadow-sky-950/30'
                      : 'border-white/[0.08] hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Agency Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${agencyStyle.badge}`}>
                        {entry.agency}
                      </span>

                      {/* Standard Code */}
                      <span className="text-[11px] font-mono text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                        {entry.standardCode}
                      </span>

                      {/* Category Label */}
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/50">
                        {getCategoryLabel(entry.category)}
                      </span>
                    </div>

                    {/* Environment Pills */}
                    <div className="flex items-center gap-1">
                      {entry.applicableEnvironments.map((env) => (
                        <span
                          key={env}
                          className="text-[9px] font-mono px-1 rounded bg-slate-950 border border-slate-800 text-slate-400 uppercase"
                          title={`Aplica en ambiente: ${env}`}
                        >
                          {env === 'microgravity' ? '0g' : env}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Title & Short Summary */}
                  <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-tight mb-1">
                    {entry.title}
                  </h3>
                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                    {entry.shortSummary}
                  </p>

                  {/* Clinical Threshold Box (Dark Cockpit Ergonomics) */}
                  <div className="bg-slate-950/80 border border-white/[0.06] rounded-lg p-3 my-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-sky-400" />
                        Parámetro Clínico Clave
                      </span>
                      <span className="text-slate-200 font-semibold">{entry.thresholdSpec.parameter}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[10px] font-mono">
                      {/* Nominal */}
                      <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                        <div className="flex items-center gap-1 text-emerald-400 font-medium mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          NOMINAL
                        </div>
                        <div className="text-slate-200 tabular-telemetry">{entry.thresholdSpec.nominalRange}</div>
                      </div>

                      {/* Caution */}
                      <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                        <div className="flex items-center gap-1 text-amber-400 font-medium mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          PRECAUCIÓN
                        </div>
                        <div className="text-slate-200 tabular-telemetry">{entry.thresholdSpec.cautionRange}</div>
                      </div>

                      {/* Critical */}
                      <div className="bg-slate-900/60 p-2 rounded border border-rose-950/60">
                        <div className="flex items-center gap-1 text-rose-400 font-medium mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          CRÍTICO
                        </div>
                        <div className="text-slate-200 tabular-telemetry">{entry.thresholdSpec.criticalThreshold}</div>
                      </div>
                    </div>
                  </div>

                  {/* Pathophysiology & Countermeasures */}
                  <div className="space-y-2 text-xs text-slate-300 mt-3 pt-2 border-t border-slate-800/70">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                        Fisiopatología en Vuelo Espacial:
                      </span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{entry.spaceflightContext}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                        Impacto Operacional de Misión:
                      </span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{entry.operationalImpact}</p>
                    </div>

                    <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1 mb-0.5">
                        <Shield className="w-3 h-3 text-sky-400" />
                        Protocolo de Contramedida:
                      </span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{entry.countermeasureProtocol}</p>
                    </div>
                  </div>

                  {/* Publication Reference & Citation Tools */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="text-[11px] text-slate-400 leading-snug flex-1">
                      <div className="font-mono text-slate-300 line-clamp-1">{entry.publicationDetails.title}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">
                        {entry.publicationDetails.authors} ({entry.publicationDetails.year}) — {entry.publicationDetails.journalOrSource}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Copy APA */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCitation(entry, 'apa');
                        }}
                        className="px-2 py-1 rounded bg-slate-950 border border-slate-700/80 hover:border-slate-600 text-[10px] font-mono text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                        title="Copiar cita en formato APA"
                      >
                        {copiedId === entry.id && copiedType === 'apa' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copiado</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>APA</span>
                          </>
                        )}
                      </button>

                      {/* Copy BibTeX */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCitation(entry, 'bibtex');
                        }}
                        className="px-2 py-1 rounded bg-slate-950 border border-slate-700/80 hover:border-slate-600 text-[10px] font-mono text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                        title="Copiar cita en formato BibTeX"
                      >
                        {copiedId === entry.id && copiedType === 'bibtex' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>BibTeX</span>
                          </>
                        )}
                      </button>

                      {/* Official Link */}
                      <a
                        href={entry.publicationDetails.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded bg-slate-950 border border-slate-700/80 hover:border-sky-500/60 text-slate-400 hover:text-sky-300 transition-colors"
                        title="Abrir enlace oficial de publicación / NTRS"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-2.5 flex items-center gap-1 flex-wrap">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery(tag);
                        }}
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-sky-300 hover:border-slate-700 cursor-pointer transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer with Quick Info */}
        <div className="p-3 bg-slate-950/90 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>AURA-EIMO Nivel IV/V — Exploración del Espacio Profundo</span>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </aside>
    </>
  );
};
