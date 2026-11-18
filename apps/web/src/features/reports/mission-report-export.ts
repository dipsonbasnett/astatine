import { formatDateTime, formatDecimal } from "@/lib/format";

import {
  formatReportPeriod,
  type MissionReport,
  type ReportVitalTrend,
} from "./mission-report-engine";

export type ReportExportFormat = "markdown" | "json";

function text(value: string): string {
  return value.replace(/\r?\n/g, " ").trim();
}

function cell(value: string): string {
  return text(value).replace(/\|/g, "\\|");
}

function bulletList(items: readonly string[], emptyText: string): string[] {
  return items.length > 0 ? items.map((item) => `- ${text(item)}`) : [`- ${emptyText}`];
}

function vitalValue(trend: ReportVitalTrend): string {
  return `${formatDecimal(trend.latestValue, trend.decimals)} ${trend.unit}`;
}

export function reportToMarkdown(report: MissionReport): string {
  const lines: string[] = [
    `# ${report.title}`,
    "",
    `**Report ID:** ${report.id}`,
    `**Generated:** ${formatDateTime(report.generatedAt)} (${report.generatedAt})`,
    `**Selected period:** ${formatReportPeriod(
      report.windowDays,
      report.periodStart,
      report.periodEnd,
    )}`,
    `**Recorded check-ins:** ${report.checkInCount}`,
    `**Data class:** Recorded only`,
    "",
    `> ${text(report.disclaimer)}`,
    ">",
    `> ${text(report.privacyNotice)}`,
    "",
    "## Data sources",
    "",
    "| Source | Status | Scope |",
    "| --- | --- | --- |",
    ...report.sourceSummary.map(
      (source) =>
        `| ${cell(source.label)} | ${source.status === "included" ? "Included" : "Excluded"} | ${cell(source.note)} |`,
    ),
    "",
    "## Executive summary",
    "",
    report.executiveSummary,
    "",
    "## Recovery readiness",
    "",
    `**Band:** ${report.readiness.bandLabel}`,
    `**Weighted recorded score:** ${
      report.readiness.score === null ? "Not available" : `${report.readiness.score}/100`
    }`,
    `**Coverage:** ${report.readiness.coverage}% of rubric inputs`,
    `**Confidence:** ${report.readiness.confidenceLabel}`,
    "",
    report.readiness.explanation,
    "",
    "### Contributing factors",
    "",
    "| Factor | Recorded value | Score | Band weight | Status | Source |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.readiness.factors.map(
      (factor) =>
        `| ${cell(`${factor.label}: ${factor.explanation}`)} | ${cell(factor.valueLabel)} | ${
          factor.score === null ? "Not available" : `${factor.score}/100`
        } | ${
          factor.affectsBand ? `${Math.round(factor.weight * 100)}%` : "Context only"
        } | ${cell(factor.statusLabel)} | ${cell(factor.sourceLabel)} |`,
    ),
    "",
    "### Missing readiness data",
    "",
    ...bulletList(
      report.readiness.missingData,
      "No gaps were recorded in the readiness inputs.",
    ),
    "",
    "## Countermeasure adherence",
    "",
    report.adherence.summary,
    "",
    "| Area | Status | Current recorded picture | Source |",
    "| --- | --- | --- | --- |",
    ...report.adherence.items.map(
      (item) =>
        `| ${cell(item.title)} | ${cell(item.statusLabel)} | ${cell(item.currentStatus)} | ${cell(item.sourceLabel)} |`,
    ),
    "",
    report.adherence.basis,
    "",
    "### Adherence detail",
    "",
    ...report.adherence.items.map(
      (item) =>
        `- **${text(item.title)}:** ${text(item.suggestion)} Caution: ${text(item.caution)}${
          item.missingData ? ` Missing: ${text(item.missingData)}` : ""
        }`,
    ),
    "",
    "### Suggested focus areas",
    "",
    report.adherence.focusNote,
    "",
    ...bulletList(
      report.adherence.focus.map(
        (item) =>
          `${item.title} (${item.priority}): ${item.rationale} Caution: ${item.caution}`,
      ),
      "No focus area is indicated by the fixed rubric.",
    ),
    "",
    "## Mission health brief",
    "",
    report.brief.headline,
    "",
    `**Latest self-report:** ${formatDateTime(report.brief.latestObservedAt)}`,
    "",
    "| Self-report field | Value |",
    "| --- | --- |",
    ...report.brief.observations.map(
      (line) => `| ${cell(line.label)} | ${cell(line.value)} |`,
    ),
    "",
    "### Brief missing data",
    "",
    ...bulletList(report.brief.missingData, "No gaps were recorded for this brief."),
    "",
    "## Vitals trends",
    "",
    report.vitals.note,
    "",
  ];

  if (report.vitals.trends.length > 0) {
    lines.push(
      "| Trend | Latest recorded value | Latest observed | Direction | Coverage | Source |",
      "| --- | --- | --- | --- | --- | --- |",
      ...report.vitals.trends.map(
        (trend) =>
          `| ${cell(trend.label)} | ${cell(vitalValue(trend))} | ${cell(
            formatDateTime(trend.latestObservedAt),
          )} | ${cell(`${trend.trendLabel}. ${trend.trendDetail}`)} | ${cell(
            trend.coverageText,
          )} | ${cell(trend.sourceLabel)} |`,
      ),
      "",
      ...report.vitals.trends.map(
        (trend) => `- **${text(trend.label)}:** ${text(trend.note)}`,
      ),
    );
  } else {
    lines.push(
      "No recorded sleep, exercise, hydration, or nutrition trend can be described for this period.",
    );
  }

  lines.push(
    "",
    "## Data gaps",
    "",
    ...bulletList(report.dataGaps, "No data gap was detected for this period."),
    "",
    "## Non-diagnostic escalation",
    "",
    ...report.escalation.map((item) => `- ${text(item)}`),
    "",
    "## Disclaimer and limitations",
    "",
    report.disclaimer,
    "",
    ...report.limits.map((limit) => `- ${text(limit)}`),
    "",
    "## Privacy notice",
    "",
    report.privacyNotice,
    "",
    `**Private notes:** ${
      report.privateNotes.included
        ? "Included by explicit consent"
        : "Excluded by default"
    }`,
    "",
    report.privateNotes.note,
  );

  if (report.privateNotes.included) {
    lines.push(
      "",
      "## Private notes",
      "",
      "Included by explicit consent: Yes",
      "",
      report.privateNotes.note,
      ...(report.privateNotes.items.length > 0
        ? report.privateNotes.items.map((item) => `- ${text(item)}`)
        : ["- No private note content is stored for this period."]),
    );
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export function reportToJson(report: MissionReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function reportFilename(
  report: MissionReport,
  format: ReportExportFormat,
): string {
  const extension = format === "markdown" ? "md" : "json";
  return `astatine-mission-report-${report.id.toLowerCase()}.${extension}`;
}
