const SEVERITIES = ['critical', 'high', 'moderate', 'low', 'info'];

export function validAuditCounts(counts) {
  return Boolean(counts && typeof counts === 'object'
    && SEVERITIES.every((severity) => Number.isSafeInteger(counts[severity]) && counts[severity] >= 0)
    && Number.isSafeInteger(counts.total) && counts.total >= 0
    && counts.total === SEVERITIES.reduce((sum, severity) => sum + counts[severity], 0));
}

export function validateAuditReport(report, label = 'audit') {
  if (!report || typeof report !== 'object' || report.error) return { valid: false, error: `${label}: npm audit returned an error object or non-object` };
  if (!Number.isSafeInteger(report.auditReportVersion) || report.auditReportVersion < 1) return { valid: false, error: `${label}: auditReportVersion is missing or invalid` };
  const vulnerabilities = report.metadata?.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== 'object') return { valid: false, error: `${label}: metadata.vulnerabilities is missing` };
  const counts = {};
  for (const severity of SEVERITIES) {
    const value = vulnerabilities[severity];
    if (!Number.isSafeInteger(value) || value < 0) return { valid: false, error: `${label}: ${severity} count is missing or invalid` };
    counts[severity] = value;
  }
  if (!Number.isSafeInteger(vulnerabilities.total) || vulnerabilities.total < 0) return { valid: false, error: `${label}: total count is missing or invalid` };
  counts.total = vulnerabilities.total;
  if (!validAuditCounts(counts)) return { valid: false, error: `${label}: total does not equal severity sum` };
  if (!report.vulnerabilities || typeof report.vulnerabilities !== 'object') return { valid: false, error: `${label}: top-level vulnerabilities detail is missing` };
  const dependencies = report.metadata?.dependencies;
  if (!dependencies || typeof dependencies !== 'object' || !Number.isSafeInteger(dependencies.total) || dependencies.total < 0) {
    return { valid: false, error: `${label}: metadata.dependencies is missing or invalid` };
  }
  if (counts.total > 0 && Object.keys(report.vulnerabilities).length === 0) return { valid: false, error: `${label}: vulnerability details are empty despite nonzero counts` };
  return { valid: true, counts };
}
