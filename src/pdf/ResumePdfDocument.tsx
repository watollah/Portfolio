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
  documentDate: string
  photoDataUrl?: string
  labels: ResumePdfLabels
  experience: LocalizedResumeEntry[]
  education: LocalizedResumeEntry[]
  architectureSkills: string[]
  softwareSkills: string[]
  languageRows: ResumeLanguageRow[]
}

const BODY = 'Roboto'
const DISPLAY = 'Merriweather'

/** ~16rem photo width on the resume page, scaled for A4 */
const PHOTO_WIDTH = 100
const PHOTO_HEIGHT = Math.round(PHOTO_WIDTH * (1455 / 1081) * (2 / 3))

/** A4 content height minus vertical page padding (842pt − 2×36pt) */
const PAGE_CONTENT_HEIGHT = 770

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontSize: 10,
    lineHeight: 1.45,
    color: '#1a1a1a',
    fontFamily: BODY,
    fontWeight: 300,
  },
  pageShell: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: PAGE_CONTENT_HEIGHT,
  },
  profile: {
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e4',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 22,
  },
  profileContent: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 4,
  },
  eyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#6b6b6b',
    fontFamily: 'Helvetica-Bold',
  },
  eyebrowDate: {
    fontSize: 10.5,
    letterSpacing: 1,
    color: '#6b6b6b',
    fontFamily: 'Helvetica-Bold',
  },
  name: {
    fontSize: 26,
    marginBottom: 12,
    fontFamily: DISPLAY,
    fontWeight: 500,
    lineHeight: 1.2,
    color: '#1a1a1a',
  },
  role: {
    fontSize: 11,
    marginBottom: 12,
    fontFamily: BODY,
    fontWeight: 500,
    color: '#1a1a1a',
  },
  bio: {
    fontSize: 10.5,
    color: '#6b6b6b',
    lineHeight: 1.65,
    fontWeight: 300,
    maxWidth: 380,
  },
  photoFrame: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    flexShrink: 0,
  },
  photo: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    paddingVertical: 16,
  },
  section: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#6b6b6b',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e4',
    fontFamily: 'Helvetica-Bold',
  },
  entry: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 11,
  },
  entryLast: {
    marginBottom: 0,
  },
  entryPeriod: {
    width: 64,
    fontSize: 9.5,
    fontWeight: 500,
    color: '#6b6b6b',
    fontFamily: BODY,
  },
  entryBody: {
    flex: 1,
    minWidth: 0,
  },
  entryIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryLogo: {
    width: 26,
    height: 26,
    objectFit: 'contain',
  },
  entryTitle: {
    fontSize: 13,
    fontFamily: DISPLAY,
    fontWeight: 500,
    marginBottom: 2,
    color: '#1a1a1a',
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  entryOrg: {
    fontSize: 10,
    fontWeight: 500,
    color: '#6b6b6b',
    flex: 1,
    fontFamily: BODY,
  },
  entryGrade: {
    fontSize: 10,
    fontWeight: 500,
    color: '#6b6b6b',
    fontFamily: BODY,
  },
  entryDesc: {
    marginTop: 4,
    fontSize: 9.5,
    color: '#6b6b6b',
    lineHeight: 1.55,
    paddingLeft: 34,
    fontWeight: 300,
  },
  entryDescNoLogo: {
    paddingLeft: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 28,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  bottomColumn: {
    flex: 1,
    minWidth: 0,
  },
  skillsHeading: {
    fontSize: 10,
    fontFamily: BODY,
    fontWeight: 600,
    marginBottom: 5,
    color: '#1a1a1a',
  },
  skillItem: {
    fontSize: 9.5,
    color: '#6b6b6b',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e4',
    fontWeight: 300,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e4',
    fontSize: 9.5,
    fontWeight: 300,
  },
  languageLevel: {
    color: '#6b6b6b',
  },
})

function ResumePdfEntry({
  entry,
  isLast,
}: {
  entry: LocalizedResumeEntry
  isLast?: boolean
}) {
  const hasLogo = Boolean(entry.logoDataUrl)

  return (
    <View style={isLast ? [styles.entry, styles.entryLast] : styles.entry} wrap={false}>
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
          <Text
            style={[styles.entryDesc, ...(hasLogo ? [] : [styles.entryDescNoLogo])]}
          >
            {entry.description}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

function ResumePdfSection({ title, children }: { title: string; children: ReactNode }) {
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
  documentDate,
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
      <Page size="A4" style={styles.page} wrap={false}>
        <View style={styles.pageShell}>
          <View style={styles.profile}>
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>{labels.documentTitle}</Text>
              <Text style={styles.eyebrowDate}>{documentDate}</Text>
            </View>
            <View style={styles.profileRow}>
              <View style={styles.profileContent}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.role}>{role}</Text>
                <Text style={styles.bio}>{bio}</Text>
              </View>
              {photoDataUrl ? (
                <View style={styles.photoFrame}>
                  <Image src={photoDataUrl} style={styles.photo} />
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.body}>
            <ResumePdfSection title={labels.experience}>
              {experience.map((entry, index) => (
                <ResumePdfEntry
                  key={`${entry.period}-${entry.title}`}
                  entry={entry}
                  isLast={index === experience.length - 1}
                />
              ))}
            </ResumePdfSection>

            <ResumePdfSection title={labels.education}>
              {education.map((entry, index) => (
                <ResumePdfEntry
                  key={`${entry.period}-${entry.title}`}
                  entry={entry}
                  isLast={index === education.length - 1}
                />
              ))}
            </ResumePdfSection>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.bottomColumn}>
              <ResumePdfSection title={labels.skills}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.skillsHeading}>{labels.architectureSkills}</Text>
                    {architectureSkills.map((skill) => (
                      <Text key={skill} style={styles.skillItem}>
                        {skill}
                      </Text>
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.skillsHeading}>{labels.softwareSkills}</Text>
                    {softwareSkills.map((skill) => (
                      <Text key={skill} style={styles.skillItem}>
                        {skill}
                      </Text>
                    ))}
                  </View>
                </View>
              </ResumePdfSection>
            </View>
            <View style={styles.bottomColumn}>
              <ResumePdfSection title={labels.languages}>
                {languageRows.map((row) => (
                  <View key={row.name} style={styles.languageRow}>
                    <Text>{row.name}</Text>
                    <Text style={styles.languageLevel}>{row.level}</Text>
                  </View>
                ))}
              </ResumePdfSection>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
