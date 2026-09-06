import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Building2,
  Search,
} from 'lucide-react';
import {
  RecruiterDashboardProps,
  EnrichedCandidate,
  getCandidateTimestamp,
  ExperienceBreakdownItem,
  ExperienceTier,
  EXPERIENCE_TIERS,
  getExperienceTier,
} from './types';
import { ALL_INTERVIEWERS } from '../../data/interviewers';
import { INTERVIEW_SCENARIOS } from '../../data/scenarios';
import { createDefaultCandidateResume } from '../../data/resumes';
import { RubricImporterModal } from '../RubricImporterModal';
import { ENTERPRISE_RUBRIC_TEMPLATES } from '../../utils/rubricParser';
import { sessionHistoryService } from '../../services/sessionHistoryService';
import { DEMO_ENRICHED_CANDIDATES } from './demoCandidates';
import { computeCohortAnalytics } from '../../services/recruiterPipelineService';
import { RecruiterHeaderStats } from './RecruiterHeaderStats';
import { RecruiterFilterSortToolbar } from './RecruiterFilterSortToolbar';
import { StateProportionVisualizer } from './StateProportionVisualizer';
import { CandidatePipelineTable } from './CandidatePipelineTable';
import { CandidateScorecardDrawer } from './CandidateScorecardDrawer';
import { TopPerformersShowcase } from './TopPerformersShowcase';
import { CommitteeRubricsManager } from './CommitteeRubricsManager';
import { DemographicTransparencyModal } from './DemographicTransparencyModal';
import { ParityShortlistModal } from './ParityShortlistModal';
import { CustomCompanyRubric, DifficultyLevel } from '../../types';

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({
  onStartInterview,
  onOpenResumeDrawer: _onOpenResumeDrawer,
  activeTab: controlledActiveTab,
  onTabChange,
  currentUser,
  onOpenDemographicAudit: externalOpenDemographicAudit,
  onOpenParityShortlist: externalOpenParityShortlist,
  isDemographicAuditOpen: externalIsDemographicAuditOpen,
  onCloseDemographicAudit: externalOnCloseDemographicAudit,
  isParityShortlistOpen: externalIsParityShortlistOpen,
  onCloseParityShortlist: externalOnCloseParityShortlist,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<
    'analytics' | 'candidates' | 'requisitions'
  >('candidates');

  const activeTab = controlledActiveTab ?? internalActiveTab;
  const handleTabSwitch = (tab: 'analytics' | 'candidates' | 'requisitions') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const [internalDemographicAuditOpen, setInternalDemographicAuditOpen] = useState(false);
  const [internalParityShortlistOpen, setInternalParityShortlistOpen] = useState(false);

  const isDemographicAuditOpen = externalIsDemographicAuditOpen !== undefined
    ? externalIsDemographicAuditOpen
    : internalDemographicAuditOpen;

  const isParityShortlistOpen = externalIsParityShortlistOpen !== undefined
    ? externalIsParityShortlistOpen
    : internalParityShortlistOpen;

  const handleOpenDemographicAudit = () => {
    if (externalOpenDemographicAudit) externalOpenDemographicAudit();
    setInternalDemographicAuditOpen(true);
  };

  const handleCloseDemographicAudit = () => {
    if (externalOnCloseDemographicAudit) externalOnCloseDemographicAudit();
    setInternalDemographicAuditOpen(false);
  };

  const handleOpenParityShortlist = () => {
    if (externalOpenParityShortlist) externalOpenParityShortlist();
    setInternalParityShortlistOpen(true);
  };

  const handleCloseParityShortlist = () => {
    if (externalOnCloseParityShortlist) externalOnCloseParityShortlist();
    setInternalParityShortlistOpen(false);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'all' | 'Female' | 'Male'>('all');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [selectedRecommendationFilter, setSelectedRecommendationFilter] = useState<string>('all');
  const [selectedDateRangeFilter, setSelectedDateRangeFilter] = useState<'all' | 'new' | 'week'>('all');
  const [selectedExperienceFilter, setSelectedExperienceFilter] = useState<string>('all');
  const [hoveredTier, setHoveredTier] = useState<ExperienceTier | null>(null);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'score-desc' | 'score-asc' | 'name-asc'>('date-desc');
  const [showStateCharts, setShowStateCharts] = useState(true);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedScorecardCandidate, setSelectedScorecardCandidate] = useState<EnrichedCandidate | null>(null);
  const [scorecardModalTab, setScorecardModalTab] = useState<'qa' | 'overview' | 'barRaiser'>('qa');
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [selectedEditingRubric, setSelectedEditingRubric] = useState<CustomCompanyRubric | null>(null);
  const [customRubrics, setCustomRubrics] = useState<CustomCompanyRubric[]>(() => ENTERPRISE_RUBRIC_TEMPLATES);

  // Integrate live stored sessions into pipeline
  const [candidatePipeline] = useState<EnrichedCandidate[]>(() => {
    try {
      const stored = sessionHistoryService.getStoredSessions();
      if (stored && stored.length > 0) {
        const mappedReal: EnrichedCandidate[] = stored.map((s, idx) => {
          const isRiyanshi = Boolean(s.candidateName && s.candidateName.toLowerCase().includes('riyanshi'));
          const inferredGender: 'Female' | 'Male' = isRiyanshi ? 'Female' : idx % 2 === 0 ? 'Female' : 'Male';
          const indianCities = [
            { city: 'Bengaluru', state: 'Karnataka' },
            { city: 'Hyderabad', state: 'Telangana' },
            { city: 'Mumbai', state: 'Maharashtra' },
            { city: 'Gurugram', state: 'Delhi-NCR' },
            { city: 'Pune', state: 'Maharashtra' },
          ];

          let candCity = s.city;
          let candState = s.state;
          let candCountry = s.country || 'India';

          if (!candCity && s.location && s.location !== 'Remote') {
            const locParts = s.location.split(',');
            if (locParts.length >= 2) {
              candCity = locParts[0].trim();
              candState = locParts[1].trim();
            } else {
              candCity = locParts[0].trim();
            }
          }

          if (!candCity) {
            const fallback = isRiyanshi
              ? { city: 'Meerut', state: 'Uttar Pradesh' }
              : indianCities[idx % indianCities.length];
            candCity = fallback.city;
            candState = candState || fallback.state;
          }

          const defaultExpByDiff: Record<DifficultyLevel, number> = {
            Foundational: 0.5,
            Intermediate: 2,
            Senior: 6,
            'Staff/Principal': 11,
          };
          const years = s.yearsOfExperience ?? (s.difficultyLevel ? defaultExpByDiff[s.difficultyLevel] : [0.5, 2, 5, 8, 12][idx % 5]);
          const expTier = getExperienceTier(years);
          const companies = ['Flipkart', 'Paytm', 'Zomato', 'Ola', 'InMobi', 'Jio Platforms'];
          const workModes: Array<'Remote' | 'Onsite' | 'Hybrid'> = ['Remote', 'Onsite', 'Hybrid'];
          const prevComp = expTier === 'fresher' ? 'None (Fresher / Campus Graduate)' : (s.previousCompany || companies[idx % companies.length]);
          const wMode = expTier === 'fresher' ? 'Onsite' : (s.workMode || workModes[idx % workModes.length]);

          return {
            id: s.id || `cand-session-${idx}`,
            name: s.candidateName || 'Candidate',
            gender: inferredGender,
            city: candCity,
            state: candState || 'Karnataka',
            country: candCountry,
            role: s.targetRole || 'Software Engineer',
            targetRole: s.targetRole,
            yearsOfExperience: years,
            experienceTier: expTier,
            previousCompany: prevComp,
            workMode: wMode,
            date: s.dateFormatted || 'Recent Session',
            timestamp: s.timestamp || (Date.now() - idx * 60000),
            overallScore: s.overallScore || 85,
            recommendation: s.hiringRecommendation || 'Hire',
            panelUsed: ALL_INTERVIEWERS,
            technicalScore: s.competencyScores?.technicalArchitecture || 88,
            problemSolvingScore: s.competencyScores?.problemSolvingAndAgility || 86,
            leadershipScore: s.competencyScores?.leadershipAndOwnership || 84,
            businessScore: s.competencyScores?.businessAndCustomerImpact || 82,
            communicationScore: s.competencyScores?.communicationAndClarity || 85,
            keyStrengths: s.keyStrengths && s.keyStrengths.length > 0 ? s.keyStrengths : ['System Architecture', 'Latency Optimization'],
            quoteEvidence: s.fullAssessment?.executiveSummary ? `"${s.fullAssessment.executiveSummary}"` : '"Candidate demonstrated solid architectural depth and rigorous problem solving under pressure."',
            status: 'Evaluated',
            jargonAudit: s.fullAssessment?.jargonAudit || {
              practicalDepthRatio: 88,
              buzzwordDensity: 'Low (12%)',
              verifiedConcreteMetricsCount: 6,
              auditSummary: s.fullAssessment?.calibrationRationale || 'Candidate articulated architectural decisions with concrete metrics.',
              scrutinizedTerms: ['Microservices', 'Distributed Cache', 'Concurrency'],
            },
            competencies: s.fullAssessment?.competencyBreakdown && s.fullAssessment.competencyBreakdown.length > 0
              ? s.fullAssessment.competencyBreakdown.map((cb, cIdx) => ({
                  name: cb.name,
                  score: cb.score,
                  weight: cb.weight,
                  verdict: cb.verdict,
                  color: ['indigo', 'purple', 'blue', 'emerald', 'amber'][cIdx % 5],
                }))
              : [
                  { name: 'Distributed Architecture & System Design', score: s.competencyScores?.technicalArchitecture || 88, weight: '30%', verdict: 'Meets Bar', color: 'indigo' },
                  { name: 'Product Trade-offs & Customer Empathy', score: s.competencyScores?.businessAndCustomerImpact || 82, weight: '20%', verdict: 'Meets Bar', color: 'purple' },
                  { name: 'Engineering Leadership & Velocity', score: s.competencyScores?.leadershipAndOwnership || 84, weight: '20%', verdict: 'Meets Bar', color: 'blue' },
                  { name: 'Enterprise SLA Reliability & Security', score: s.competencyScores?.problemSolvingAndAgility || 86, weight: '15%', verdict: 'Meets Bar', color: 'emerald' },
                  { name: 'Behavioral Dynamics & STAR Methodology', score: s.competencyScores?.communicationAndClarity || 85, weight: '15%', verdict: 'Meets Bar', color: 'amber' },
                ],
            sampleQA: s.fullAssessment?.roleByRoleFeedback && s.fullAssessment.roleByRoleFeedback.length > 0
              ? s.fullAssessment.roleByRoleFeedback.map((rf, fIdx) => ({
                  interviewerIndex: fIdx,
                  interviewerName: rf.interviewerName,
                  interviewerTitle: rf.interviewerRole === 'technical' ? 'Lead Systems Architect' : rf.interviewerRole === 'product' ? 'Principal Product Manager' : 'Engineering Leader',
                  roleBadge: String(rf.interviewerRole).toUpperCase(),
                  score: rf.score || s.overallScore || 85,
                  verdict: rf.verdict || 'Meets Bar',
                  question: rf.commentary || 'Technical competency and behavioral alignment assessment.',
                  answer: rf.keyObservationQuote || s.fullAssessment?.executiveSummary || 'Demonstrated practical depth.',
                  feedback: rf.commentary || 'Solid engineering execution.',
                }))
              : [
                  {
                    interviewerIndex: 0,
                    interviewerName: 'Rohan Sharma',
                    interviewerTitle: 'Lead Systems Architect',
                    roleBadge: 'Distributed Systems & Concurrency',
                    score: s.overallScore || 85,
                    verdict: s.hiringRecommendation || 'Strong Endorsement',
                    question: 'How do you structure data consistency and cache invalidation under high concurrency?',
                    answer: s.fullAssessment?.executiveSummary || 'We used transactional outbox patterns with deterministic partition key routing.',
                    feedback: 'Demonstrated solid understanding of consistency models and failure boundaries.',
                  },
                ],
          };
        });
        return [...mappedReal, ...DEMO_ENRICHED_CANDIDATES];
      }
    } catch (e) {
      console.warn('[RecruiterDashboard] Failed to load stored sessions into pipeline:', e);
    }
    return DEMO_ENRICHED_CANDIDATES;
  });

  // Shortlist by Gender Ratio filter state directly in table toolbar
  const [selectedRatioFilter, setSelectedRatioFilter] = useState<string>('all');
  const [customFemaleRatio, setCustomFemaleRatio] = useState<number>(50);
  const [cohortLimit, setCohortLimit] = useState<number>(10);

  const analytics = useMemo(() => computeCohortAnalytics(candidatePipeline), [candidatePipeline]);

  // Filtered and sorted candidates for table
  const filteredCandidates = useMemo(() => {
    const list = candidatePipeline.filter((cand) => {
      const matchesSearch =
        cand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cand.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cand.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cand.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cand.previousCompany && cand.previousCompany.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cand.workMode && cand.workMode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        cand.keyStrengths.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGender = selectedGenderFilter === 'all' || cand.gender === selectedGenderFilter;
      const matchesState = selectedStateFilter === 'all' || cand.state === selectedStateFilter;
      const matchesRec = selectedRecommendationFilter === 'all' || cand.recommendation === selectedRecommendationFilter;

      const matchesExperience = (() => {
        if (selectedExperienceFilter === 'all') return true;
        const candTier = cand.experienceTier || getExperienceTier(cand.yearsOfExperience ?? 0);
        return candTier === selectedExperienceFilter;
      })();

      const matchesDateRange = (() => {
        if (selectedDateRangeFilter === 'all') return true;
        const lower = (cand.date || '').toLowerCase();
        if (selectedDateRangeFilter === 'new') {
          return lower.includes('today') || lower.includes('yesterday');
        }
        if (selectedDateRangeFilter === 'week') {
          if (lower.includes('today') || lower.includes('yesterday')) return true;
          const ts = getCandidateTimestamp(cand);
          return Math.abs(Date.now() - ts) <= 7 * 86400 * 1000;
        }
        return true;
      })();

      return matchesSearch && matchesGender && matchesState && matchesRec && matchesDateRange && matchesExperience;
    });

    // If Shortlist by Gender Ratio is active, curate top performers matching the ratio
    if (selectedRatioFilter !== 'all') {
      const femaleRatio = customFemaleRatio;
      const targetFemaleCount = Math.round((cohortLimit * femaleRatio) / 100);
      const targetMaleCount = Math.max(0, cohortLimit - targetFemaleCount);

      const meritSort = (a: EnrichedCandidate, b: EnrichedCandidate) => {
        if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore;
        const bTech = b.technicalScore ?? 0;
        const aTech = a.technicalScore ?? 0;
        if (bTech !== aTech) return bTech - aTech;
        return (b.timestamp ?? 0) - (a.timestamp ?? 0);
      };

      const females = list.filter((c) => c.gender === 'Female').sort(meritSort).slice(0, targetFemaleCount);
      const males = list.filter((c) => c.gender === 'Male').sort(meritSort).slice(0, targetMaleCount);

      return [...females, ...males].sort(meritSort);
    }

    return list.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return getCandidateTimestamp(b) - getCandidateTimestamp(a);
      }
      if (sortBy === 'date-asc') {
        return getCandidateTimestamp(a) - getCandidateTimestamp(b);
      }
      if (sortBy === 'score-desc') {
        return b.overallScore - a.overallScore;
      }
      if (sortBy === 'score-asc') {
        return a.overallScore - b.overallScore;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [
    candidatePipeline,
    searchQuery,
    selectedGenderFilter,
    selectedStateFilter,
    selectedRecommendationFilter,
    selectedDateRangeFilter,
    selectedExperienceFilter,
    selectedRatioFilter,
    customFemaleRatio,
    cohortLimit,
    sortBy,
  ]);

  const handleApplyCustomRubric = (newRubric: CustomCompanyRubric, launchImmediately?: boolean) => {
    setCustomRubrics((prev) => {
      const exists = prev.some((r) => r.id === newRubric.id || r.companyName === newRubric.companyName);
      if (exists) {
        return prev.map((r) => (r.id === newRubric.id || r.companyName === newRubric.companyName ? newRubric : r));
      }
      return [newRubric, ...prev];
    });

    if (launchImmediately) {
      const defaultDiff: DifficultyLevel = newRubric.strictnessRating === 'Exacting' ? 'Staff/Principal' : 'Senior';
      onStartInterview({
        scenario: {
          ...INTERVIEW_SCENARIOS[0],
          id: `custom-req-${newRubric.id}`,
          title: `${newRubric.companyName} - ${newRubric.targetLevel}`,
          targetRole: newRubric.targetLevel,
          context: `Target Level: ${newRubric.targetLevel} at ${newRubric.companyName}. Evaluation strictly calibrated to custom rubric.`,
          customConstraints: `Strictness: ${newRubric.strictnessRating}. Key signals: ${(newRubric.keySignals || []).join('; ')}`,
          customRubric: newRubric,
        },
        activePanel: ALL_INTERVIEWERS.slice(0, 3),
        candidateName: 'Candidate',
        targetRole: newRubric.targetLevel,
        initialDifficulty: defaultDiff,
        candidateResume: createDefaultCandidateResume('Candidate', newRubric.targetLevel),
        customRubric: newRubric,
      });
    }
  };

  const hasActiveFilters =
    selectedGenderFilter !== 'all' ||
    selectedStateFilter !== 'all' ||
    selectedRecommendationFilter !== 'all' ||
    selectedDateRangeFilter !== 'all' ||
    selectedExperienceFilter !== 'all' ||
    selectedRatioFilter !== 'all' ||
    Boolean(searchQuery) ||
    sortBy !== 'date-desc';

  const handleClearFilters = () => {
    setSelectedGenderFilter('all');
    setSelectedStateFilter('all');
    setSelectedRecommendationFilter('all');
    setSelectedDateRangeFilter('all');
    setSelectedExperienceFilter('all');
    setSelectedRatioFilter('all');
    setSearchQuery('');
    setSortBy('date-desc');
  };

  const handleExportCSV = () => {
    const headers = [
      'Name',
      'Gender',
      'Role',
      'Experience (Years)',
      'Experience Tier',
      'Previous Company',
      'Work Mode',
      'City',
      'State',
      'Date',
      'Score',
      'Recommendation',
      'Strengths',
    ];
    const rows = filteredCandidates.map((c) => {
      const tierKey = c.experienceTier || getExperienceTier(c.yearsOfExperience ?? 0);
      const tierInfo = EXPERIENCE_TIERS[tierKey];
      return [
        `"${c.name}"`,
        `"${c.gender}"`,
        `"${c.role}"`,
        c.yearsOfExperience ?? 0,
        `"${tierInfo.range} (${tierInfo.label})"`,
        `"${c.previousCompany || 'None (Fresher / Campus Graduate)'}"`,
        `"${c.workMode || 'N/A'}"`,
        `"${c.city}"`,
        `"${c.state}"`,
        `"${c.date}"`,
        c.overallScore,
        `"${c.recommendation}"`,
        `"${c.keyStrengths.join('; ')}"`,
      ];
    });
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VocalisAI_Candidate_Pipeline_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full py-2 px-1 sm:px-2 space-y-4 text-slate-900 font-sans animate-in fade-in duration-200">
      {/* ── HEADER STATS BANNER ── */}
      <RecruiterHeaderStats
        totalEvaluated={analytics.total}
        femalePct={analytics.femalePct}
        malePct={analytics.malePct}
        femaleCount={analytics.femaleCount}
        maleCount={analytics.maleCount}
        overallAvgScore={analytics.overallAvgScore}
        passRate={analytics.passRate}
        strongHireCount={analytics.strongHireCount}
        currentUser={currentUser}
        onOpenRubricModal={() => {
          setSelectedEditingRubric(null);
          setIsRubricModalOpen(true);
        }}
        onOpenDemographicAudit={handleOpenDemographicAudit}
        onOpenParityShortlist={handleOpenParityShortlist}
      />

      {/* ── SECTION HEADER & SEARCH (Tab navigation is handled directly in sidebar to avoid duplicate controls) ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 shadow-2xs">
            {activeTab === 'analytics' && <BarChart3 className="w-5 h-5" />}
            {activeTab === 'candidates' && <Users className="w-5 h-5" />}
            {activeTab === 'requisitions' && <Building2 className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {activeTab === 'analytics' && 'Talent Demographics & Top Performers'}
              {activeTab === 'candidates' && `Candidate Pipeline & Reports (${filteredCandidates.length})`}
              {activeTab === 'requisitions' && 'Job Openings & Committee Rubrics'}
            </h2>
            <p className="text-xs text-slate-500">
              {activeTab === 'analytics' && 'Demographic parity, experience tier ratios (0–1y, 1–3y, 4–8y, 8–10y, 10+y), and verified top performers.'}
              {activeTab === 'candidates' && 'Search, filter, and inspect detailed 360° AI interview assessments and work histories.'}
              {activeTab === 'requisitions' && 'Calibrated hiring criteria, company rubrics, and bar-raiser strictness profiles.'}
            </p>
          </div>
        </div>

        {/* Global Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate, company, role, city..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: TALENT DEMOGRAPHICS & TOP PERFORMERS ── */}
      {activeTab === 'analytics' && (
        <TopPerformersShowcase
          analytics={analytics}
          onSelectCandidate={setSelectedScorecardCandidate}
          onSelectStateAndSwitchToCandidates={(st) => {
            setSelectedStateFilter(st);
            handleTabSwitch('candidates');
          }}
          onSelectExperienceAndSwitchToCandidates={(tier) => {
            setSelectedExperienceFilter(tier);
            handleTabSwitch('candidates');
          }}
          hoveredState={hoveredState}
          onHoverState={setHoveredState}
          hoveredTier={hoveredTier}
          onHoverTier={setHoveredTier}
          selectedExperienceFilter={selectedExperienceFilter}
          currentUser={currentUser}
          onOpenDemographicAudit={handleOpenDemographicAudit}
          onOpenParityShortlist={handleOpenParityShortlist}
        />
      )}

      {/* ── TAB 2: CANDIDATE PIPELINE & REPORTS ── */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {/* Dropdown Filters & Sort Toolbar */}
          <RecruiterFilterSortToolbar
            totalCount={candidatePipeline.length}
            filteredCount={filteredCandidates.length}
            femaleCount={analytics.femaleCount}
            maleCount={analytics.maleCount}
            stateBreakdown={analytics.stateBreakdown}
            selectedGenderFilter={selectedGenderFilter}
            onGenderFilterChange={setSelectedGenderFilter}
            selectedStateFilter={selectedStateFilter}
            onStateFilterChange={setSelectedStateFilter}
            selectedRecommendationFilter={selectedRecommendationFilter}
            onRecommendationFilterChange={setSelectedRecommendationFilter}
            selectedDateRangeFilter={selectedDateRangeFilter}
            onDateRangeFilterChange={setSelectedDateRangeFilter}
            selectedExperienceFilter={selectedExperienceFilter}
            onExperienceFilterChange={setSelectedExperienceFilter}
            experienceCounts={analytics.experienceCounts}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            showStateCharts={showStateCharts}
            onToggleStateCharts={() => setShowStateCharts((prev) => !prev)}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            onOpenDemographicAudit={handleOpenDemographicAudit}
            onOpenParityShortlist={handleOpenParityShortlist}
            selectedRatioFilter={selectedRatioFilter}
            onRatioFilterChange={setSelectedRatioFilter}
            customFemaleRatio={customFemaleRatio}
            onCustomFemaleRatioChange={setCustomFemaleRatio}
            cohortLimit={cohortLimit}
            onCohortLimitChange={setCohortLimit}
          />

          {/* Interactive State Proportion Chart */}
          {showStateCharts && (
            <StateProportionVisualizer
              total={analytics.total}
              stateBreakdown={analytics.stateBreakdown}
              selectedStateFilter={selectedStateFilter}
              onSelectState={setSelectedStateFilter}
              hoveredState={hoveredState}
              onHoverState={setHoveredState}
            />
          )}

          {/* Candidate Table Report */}
          <CandidatePipelineTable
            candidates={filteredCandidates}
            totalPipelineCount={candidatePipeline.length}
            sortBy={sortBy}
            onToggleDateSort={() =>
              setSortBy((prev) => (prev === 'date-desc' ? 'date-asc' : 'date-desc'))
            }
            onToggleScoreSort={() =>
              setSortBy((prev) => (prev === 'score-desc' ? 'score-asc' : 'score-desc'))
            }
            onSelectScorecardCandidate={setSelectedScorecardCandidate}
            onClearFilters={handleClearFilters}
            onExportCSV={handleExportCSV}
            isRatioFilterActive={selectedRatioFilter !== 'all'}
            ratioFilterLabel={`${customFemaleRatio}% ♀ : ${100 - customFemaleRatio}% ♂ (Top ${cohortLimit})`}
            onResetRatioFilter={() => setSelectedRatioFilter('all')}
          />
        </div>
      )}


      {/* ── TAB 3: JOB REQUISITIONS & COMMITTEE RUBRICS ── */}
      {activeTab === 'requisitions' && (
        <CommitteeRubricsManager
          customRubrics={customRubrics}
          currentUser={currentUser}
          onOpenRubricModal={(rubric) => {
            setSelectedEditingRubric(rubric || null);
            setIsRubricModalOpen(true);
          }}
          onApplyCustomRubric={handleApplyCustomRubric}
          onStartInterview={onStartInterview}
        />
      )}

      {/* ── CANDIDATE SCORECARD 360° DRAWER / MODAL ── */}
      {selectedScorecardCandidate && (
        <CandidateScorecardDrawer
          candidate={selectedScorecardCandidate}
          scorecardModalTab={scorecardModalTab}
          onTabChange={setScorecardModalTab}
          onClose={() => setSelectedScorecardCandidate(null)}
        />
      )}

      {/* ── RUBRIC IMPORTER MODAL ── */}
      {isRubricModalOpen && (
        <RubricImporterModal
          isOpen={isRubricModalOpen}
          onClose={() => {
            setIsRubricModalOpen(false);
            setSelectedEditingRubric(null);
          }}
          onApplyRubric={(newRubric, launchImmediately) => {
            handleApplyCustomRubric(newRubric, Boolean(launchImmediately));
            setIsRubricModalOpen(false);
            setSelectedEditingRubric(null);
          }}
          initialRubric={selectedEditingRubric || undefined}
        />
      )}

      {/* ── DEMOGRAPHIC TRANSPARENCY & PARITY AUDIT MODAL ── */}
      <DemographicTransparencyModal
        isOpen={isDemographicAuditOpen}
        onClose={handleCloseDemographicAudit}
        analytics={analytics}
        candidates={candidatePipeline}
        currentUser={currentUser}
        onSelectCandidate={(cand) => setSelectedScorecardCandidate(cand)}
        onOpenParityShortlist={handleOpenParityShortlist}
      />

      {/* ── SIDE-BY-SIDE TARGET PARITY SHORTLIST MODAL ── */}
      <ParityShortlistModal
        isOpen={isParityShortlistOpen}
        onClose={handleCloseParityShortlist}
        candidates={candidatePipeline}
        currentUser={currentUser}
        onSelectCandidate={(cand) => setSelectedScorecardCandidate(cand)}
      />
    </div>
  );
};
