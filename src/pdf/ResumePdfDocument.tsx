import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'

export interface LocalizedResumeEntry {
  period: string
  title: string
  organization: string
  description?: string
  grade?: string
  logoDataUrl?: string
}

export interface ResumeLanguageRow {
  name: string
  level: string
}

export interface ResumePdfLabels {
  documentTitle: string
  experience: string
  education: string
  skills: string
  languages: string
  architectureSkills: string
  softwareSkills: string
}

export interface ResumePdfDocumentProps {
  name: string
  role: string
  bio: string
  photoDataUrl?: string
  labels: ResumePdfLabels
  experience: LocalizedResumeEntry[]
  education: LocalizedResumeEntry[]
  architectureSkills: string[]
  softwareSkills: string[]
  languageRows: ResumeLanguageRow[]
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontSize: 10,
    lineHeight: 1.45,
    color: '#1a1a1a',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 24,
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: 6,
    fontFamily: 'Helvetica-Bold',
  },
  name: {
    fontSize: 22,
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  role: {
    fontSize: 11,
    marginBottom: 10,
    color: '#333',
  },
  bio: {
    fontSize: 10,
    color: '#444',
    lineHeight: 1.55,
  },
  photo: {
    width: 96,
    height: 130,
    objectFit: 'contain',
    objectPosition: 'bottom',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    fontFamily: 'Helvetica-Bold',
  },
  entry: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 16,
  },
  entryPeriod: {
    width: 72,
    fontSize: 9,
    color: '#666',
  },
  entryBody: {
    flex: 1,
    minWidth: 0,
  },
  entryIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  entryLogo: {
    width: 28,
    height: 28,
    objectFit: 'contain',
  },
  entryTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  entryOrg: {
    fontSize: 9,
    color: '#666',
    flex: 1,
  },
  entryGrade: {
    fontSize: 9,
    color: '#666',
  },
  entryDesc: {
    marginTop: 4,
    fontSize: 9.5,
    color: '#444',
    lineHeight: 1.55,
    paddingLeft: 38,
  },
  entryDescNoLogo: {
    paddingLeft: 0,
  },
  skillsGrid: {
    flexDirection: 'row',
    gap: 28,
  },
  skillsColumn: {
    flex: 1,
  },
  skillsHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  skillItem: {
    fontSize: 9.5,
    color: '#444',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 9.5,
  },
  languageLevel: {
    color: '#666',
  },
})

function ResumePdfEntry({ entry }: { entry: LocalizedResumeEntry }) {
  const hasLogo = Boolean(entry.logoDataUrl)

  return (
    <View style={styles.entry} wrap={false}>
      <Text style={styles.entryPeriod}>{entry.period}</Text>
      <View style={styles.entryBody}>
        <View style={styles.entryIdentity}>
          {entry.logoDataUrl ? (
            <Image src={entry.logoDataUrl} style={styles.entryLogo} />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.entryTitle}>{entry.title}</Text>
            <View style={styles.entryMeta}>
              <Text style={styles.entryOrg}>{entry.organization}</Text>
              {entry.grade ? <Text style={styles.entryGrade}>{entry.grade}</Text> : null}
            </View>
          </View>
        </View>
        {entry.description ? (
          <Text style={[styles.entryDesc, !hasLogo ? styles.entryDescNoLogo : undefined]}>
            {entry.description}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

function ResumePdfSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

export function ResumePdfDocument({
  name,
  role,
  bio,
  photoDataUrl,
  labels,
  experience,
  education,
  architectureSkills,
  softwareSkills,
  languageRows,
}: ResumePdfDocumentProps) {
  return (
    <Document title={labels.documentTitle} author={name}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{labels.documentTitle}</Text>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>{role}</Text>
            <Text style={styles.bio}>{bio}</Text>
          </View>
          {photoDataUrl ? <Image src={photoDataUrl} style={styles.photo} /> : null}
        </View>

        <ResumePdfSection title={labels.experience}>
          {experience.map((entry) => (
            <ResumePdfEntry key={`${entry.period}-${entry.title}`} entry={entry} />
          ))}
        </ResumePdfSection>

        <ResumePdfSection title={labels.education}>
          {education.map((entry) => (
            <ResumePdfEntry key={`${entry.period}-${entry.title}`} entry={entry} />
          ))}
        </ResumePdfSection>

        <ResumePdfSection title={labels.skills}>
          <View style={styles.skillsGrid}>
            <View style={styles.skillsColumn}>
              <Text style={styles.skillsHeading}>{labels.architectureSkills}</Text>
              {architectureSkills.map((skill) => (
                <Text key={skill} style={styles.skillItem}>
                  {skill}
                </Text>
              ))}
            </View>
            <View style={styles.skillsColumn}>
              <Text style={styles.skillsHeading}>{labels.softwareSkills}</Text>
              {softwareSkills.map((skill) => (
                <Text key={skill} style={styles.skillItem}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        </ResumePdfSection>

        <ResumePdfSection title={labels.languages}>
          {languageRows.map((row) => (
            <View key={row.name} style={styles.languageRow}>
              <Text>{row.name}</Text>
              <Text style={styles.languageLevel}>{row.level}</Text>
            </View>
          ))}
        </ResumePdfSection>
      </Page>
    </Document>
  )
}
