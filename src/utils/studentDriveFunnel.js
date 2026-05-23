const ROUND_LABEL_TO_FIELD = {
  registration: 'approved_status',
  approved: 'approved_status',
  oa: 'oa_status',
  'online assessment': 'oa_status',
  'coding test': 'oa_status',
  gd: 'gd_status',
  'group discussion': 'gd_status',
  technical: 'technical_round_status',
  'technical round': 'technical_round_status',
  interview: 'interview_status',
  'hr round': 'hr_round_status',
  hr: 'hr_round_status',
  final: 'final_select_status',
  'final selection': 'final_select_status',
};

function roundLabelToField(roundName) {
  const key = String(roundName || '').toLowerCase().trim();
  return ROUND_LABEL_TO_FIELD[key] || null;
}

function isRegistered(process) {
  return String(process?.registration_status || '').toLowerCase() === 'registered';
}

/** Personal round funnel for one student on one drive (each stage count is 0 or 1). */
export function buildStudentDriveFunnel(process, processRounds) {
  const rounds = (Array.isArray(processRounds) ? processRounds : []).filter((r) => {
    const s = String(r || '').trim();
    return s !== '' && !/^aptitude$/i.test(s);
  });

  const stages = [];
  const registered = isRegistered(process);
  stages.push({
    label: 'Registered',
    count: registered ? 1 : 0,
    status: registered ? 'passed' : 'not_registered',
    key: 'registered',
  });

  let pipelineOpen = registered;
  const qualified = registered && process?.approved_status === 'Qualified';
  let qualifiedStatus = 'not_reached';
  if (!registered) qualifiedStatus = 'not_reached';
  else if (process?.approved_status === 'Not Qualified') qualifiedStatus = 'failed';
  else if (qualified) qualifiedStatus = 'passed';
  else qualifiedStatus = 'pending';

  stages.push({
    label: 'Qualified',
    count: qualified ? 1 : 0,
    status: qualifiedStatus,
    key: 'qualified',
  });
  pipelineOpen = qualified;

  const seenFields = new Set(['approved_status']);
  for (const roundName of rounds) {
    const field = roundLabelToField(roundName);
    if (!field || field === 'approved_status' || field === 'final_select_status') continue;
    if (seenFields.has(field)) continue;
    seenFields.add(field);

    let status = 'not_reached';
    let count = 0;
    if (pipelineOpen) {
      if (process[field] === true) {
        status = 'passed';
        count = 1;
      } else if (process[field] === false) {
        status = 'failed';
        pipelineOpen = false;
      } else {
        status = 'pending';
        pipelineOpen = false;
      }
    }

    stages.push({
      label: String(roundName).trim(),
      count,
      status,
      key: field,
    });
  }

  const selected = process?.final_select_status === true;
  let finalStatus = 'not_reached';
  if (selected) finalStatus = 'passed';
  else if (process?.final_select_status === false) finalStatus = 'failed';
  else if (pipelineOpen) finalStatus = 'pending';

  stages.push({
    label: 'Final Selection',
    count: selected ? 1 : 0,
    status: finalStatus,
    key: 'final_select_status',
  });

  return stages;
}

export function buildStudentDriveSummaries(processRecords) {
  return (processRecords || []).map((p) => {
    const drive = p.drive || {};
    const companyName = drive.company?.company_name || p.company?.company_name || 'Company';
    const jobType = drive.job_type || drive.job_role || 'Role';
    const processRounds = drive.process_rounds || [];
    return {
      id: p.placement_drive_id ?? drive.id,
      title: `${companyName} · ${jobType}`,
      status: drive.placement_status,
      round_funnel: buildStudentDriveFunnel(p, processRounds),
    };
  });
}

export const STUDENT_FUNNEL_PALETTE = ['#64748b', '#6366f1', '#3b82f6', '#d4a960', '#eab308', '#22c55e', '#16a34a'];

export function buildAllDrivesStackedChart(drives) {
  if (!drives?.length) return { labels: [], datasets: [], stageOrder: [] };

  const stageOrder = [];
  const seen = new Set();
  drives.forEach((d) => {
    (d.round_funnel || []).forEach((s) => {
      if (!seen.has(s.key)) {
        seen.add(s.key);
        stageOrder.push({ key: s.key, label: s.label });
      }
    });
  });

  const labels = drives.map((d) => {
    const name = (d.title || '').split(' · ')[0] || 'Drive';
    return name.length > 14 ? `${name.slice(0, 13)}…` : name;
  });

  const datasets = stageOrder.map((stage, idx) => ({
    label: stage.label,
    data: drives.map((d) => {
      const step = (d.round_funnel || []).find((s) => s.key === stage.key);
      return step?.status === 'passed' ? 1 : 0;
    }),
    backgroundColor: STUDENT_FUNNEL_PALETTE[idx % STUDENT_FUNNEL_PALETTE.length],
    borderWidth: 0,
    maxBarThickness: 48,
  }));

  return { labels, datasets, stageOrder };
}

export function buildStudentRoundOutcomes(drives) {
  const totals = { passed: 0, failed: 0, pending: 0, not_reached: 0 };
  (drives || []).forEach((d) => {
    (d.round_funnel || []).forEach((s) => {
      if (s.key === 'registered') return;
      const st = s.status || 'not_reached';
      if (Object.prototype.hasOwnProperty.call(totals, st)) totals[st] += 1;
      else totals.not_reached += 1;
    });
  });
  return totals;
}

/** Doughnut data: mutually exclusive round checkpoint outcomes across all drives. */
export function buildStudentRoundOutcomesDoughnut(drives) {
  const totals = buildStudentRoundOutcomes(drives);
  const segments = [
    { key: 'passed', label: 'Rounds cleared', color: '#22c55e' },
    { key: 'failed', label: 'Rounds failed', color: '#ef4444' },
    { key: 'pending', label: 'Awaiting result', color: '#fbbf24' },
    { key: 'not_reached', label: 'Not reached yet', color: '#cbd5e1' },
  ].filter((s) => totals[s.key] > 0);

  const decided = totals.passed + totals.failed;
  const passRate = decided > 0 ? Math.round((totals.passed / decided) * 100) : 0;
  const totalCheckpoints = segments.reduce((sum, s) => sum + totals[s.key], 0);

  if (!segments.length) {
    return {
      labels: [],
      datasets: [],
      totals,
      passRate: 0,
      totalCheckpoints: 0,
      empty: true,
    };
  }

  return {
    labels: segments.map((s) => s.label),
    datasets: [
      {
        data: segments.map((s) => totals[s.key]),
        backgroundColor: segments.map((s) => s.color),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8,
      },
    ],
    totals,
    passRate,
    totalCheckpoints,
    empty: false,
    segmentMeta: segments.map((s) => ({ ...s, value: totals[s.key] })),
  };
}

export const STUDENT_FUNNEL_STATUS_LABELS = {
  passed: 'Passed',
  failed: 'Failed',
  pending: 'Pending',
  not_reached: 'Not reached',
  not_registered: 'Not registered',
};
