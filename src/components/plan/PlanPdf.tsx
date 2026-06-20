import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PdfDocumentModel } from "@/lib/plan/pdf-data";

/**
 * Branded PDF document for a workout plan ("Volt Athletic" theme: near-black
 * canvas, electric-lime accent). Rendered on demand to a Blob from the client —
 * it is never mounted into the React tree, so it carries no `"use client"`. It
 * consumes the pre-flattened {@link PdfDocumentModel} from `pdf-data.ts`; all the
 * shaping logic (and the mandatory disclaimer) lives there.
 */

const INK = "#0a0a0a";
const SURFACE = "#161616";
const LINE = "#2b2b2b";
const BONE = "#f1f1ea";
const BONE_DIM = "#9b9b90";
const VOLT = "#d7ff3e";

const styles = StyleSheet.create({
  page: {
    backgroundColor: INK,
    color: BONE,
    paddingVertical: 36,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  brand: {
    fontSize: 9,
    letterSpacing: 2,
    color: VOLT,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: { fontSize: 26, fontFamily: "Helvetica-Bold", color: BONE, marginBottom: 8 },
  summary: { color: BONE_DIM, marginBottom: 12, maxWidth: 440 },
  tags: { flexDirection: "row", gap: 6, marginBottom: 16 },
  tag: {
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: BONE_DIM,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 2,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  strategyBox: {
    borderLeftWidth: 2,
    borderLeftColor: VOLT,
    backgroundColor: SURFACE,
    padding: 10,
    marginBottom: 20,
  },
  kicker: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: VOLT,
    marginBottom: 4,
  },
  kickerDim: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BONE_DIM,
    marginBottom: 4,
  },
  day: { marginBottom: 18 },
  dayHeading: { fontSize: 15, fontFamily: "Helvetica-Bold", color: BONE, marginBottom: 2 },
  dayMeta: { fontSize: 8, color: BONE_DIM, textTransform: "uppercase", letterSpacing: 1 },
  rationaleBox: { backgroundColor: SURFACE, padding: 8, marginTop: 8, marginBottom: 8 },
  rationaleText: { color: BONE, fontSize: 9 },
  warmupItem: { color: BONE_DIM, fontSize: 9, marginBottom: 1 },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingVertical: 6,
  },
  exerciseName: { fontFamily: "Helvetica-Bold", color: BONE, fontSize: 10 },
  exerciseMuscles: { color: BONE_DIM, fontSize: 8, marginTop: 1 },
  exerciseCue: { color: BONE_DIM, fontSize: 8, fontStyle: "italic", marginTop: 1 },
  metrics: { flexDirection: "row", gap: 12 },
  metricLabel: { fontSize: 6, letterSpacing: 1, color: BONE_DIM, textTransform: "uppercase" },
  metricValue: { color: VOLT, fontSize: 11, fontFamily: "Helvetica-Bold" },
  progression: { borderTopWidth: 1, borderTopColor: LINE, paddingTop: 12, marginTop: 4 },
  progressionStrategy: { fontFamily: "Helvetica-Bold", color: BONE, fontSize: 12, marginBottom: 4 },
  bullet: { color: BONE_DIM, fontSize: 9, marginBottom: 1 },
  disclaimer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: LINE,
    color: BONE_DIM,
    fontSize: 7.5,
    lineHeight: 1.4,
  },
});

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export function PlanPdf({ model }: { model: PdfDocumentModel }) {
  return (
    <Document title={model.title} author="Reps">
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>Reps · Volt Athletic</Text>
        <Text style={styles.title}>{model.title}</Text>
        <Text style={styles.summary}>{model.summary}</Text>
        <View style={styles.tags}>
          {model.tags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>

        <View style={styles.strategyBox}>
          <Text style={styles.kicker}>The strategy</Text>
          <Text style={styles.rationaleText}>{model.rationale}</Text>
        </View>

        {model.days.map((day) => (
          <View key={day.heading} style={styles.day} wrap={false}>
            <Text style={styles.dayHeading}>{day.heading}</Text>
            <Text style={styles.dayMeta}>{day.meta}</Text>

            <View style={styles.rationaleBox}>
              <Text style={styles.kickerDim}>Why this day</Text>
              <Text style={styles.rationaleText}>{day.rationale}</Text>
            </View>

            {day.warmup.length > 0 ? (
              <View>
                <Text style={styles.kickerDim}>Warm-up</Text>
                {day.warmup.map((step) => (
                  <Text key={step} style={styles.warmupItem}>
                    › {step}
                  </Text>
                ))}
              </View>
            ) : null}

            {day.exercises.map((ex) => (
              <View key={`${ex.name}-${ex.prescription}`} style={styles.exerciseRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseMuscles}>{ex.targetMuscles}</Text>
                  {ex.cue ? <Text style={styles.exerciseCue}>“{ex.cue}”</Text> : null}
                </View>
                <View style={styles.metrics}>
                  <Metric label="Sets×Reps" value={ex.prescription} />
                  <Metric label="Rest" value={ex.rest} />
                  {ex.intensity ? <Metric label="Intensity" value={ex.intensity} /> : null}
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.progression} wrap={false}>
          <Text style={styles.kicker}>Progression</Text>
          <Text style={styles.progressionStrategy}>{model.progression.strategy}</Text>
          <Text style={[styles.rationaleText, { marginBottom: 6 }]}>
            {model.progression.description}
          </Text>
          {model.progression.weeklyAdjustments.map((step) => (
            <Text key={step} style={styles.bullet}>
              › {step}
            </Text>
          ))}
          {model.progression.deloadGuidance ? (
            <Text style={[styles.bullet, { marginTop: 4 }]}>
              Deload: {model.progression.deloadGuidance}
            </Text>
          ) : null}
        </View>

        <Text style={styles.disclaimer}>{model.disclaimer}</Text>
      </Page>
    </Document>
  );
}
