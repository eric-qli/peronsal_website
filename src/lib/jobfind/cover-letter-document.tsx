import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { type AssembledCoverLetter } from "@/lib/jobfind/cover-letter-validation";

const MARGIN = 54;

const styles = StyleSheet.create({
  page: {
    paddingTop: MARGIN,
    paddingBottom: MARGIN,
    paddingHorizontal: MARGIN,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.45,
    color: "#000000",
    backgroundColor: "#ffffff",
  },
  headerName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  contactLine: {
    fontSize: 10.5,
    marginBottom: 18,
  },
  metaLine: {
    marginBottom: 4,
  },
  subjectLine: {
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 14,
  },
  salutation: {
    marginBottom: 12,
  },
  paragraph: {
    marginBottom: 12,
    textAlign: "justify",
  },
  signOff: {
    marginTop: 8,
    marginBottom: 24,
  },
});

export interface CoverLetterDocumentProps {
  letter: AssembledCoverLetter;
  company: string;
  position: string;
  location: string | null;
  dateLabel: string;
  contactLine: string;
  applicantName: string;
}

export function CoverLetterDocument({
  letter,
  company,
  position,
  location,
  dateLabel,
  contactLine,
  applicantName,
}: CoverLetterDocumentProps) {
  return (
    <Document
      title={`${company} - ${position} - Cover Letter`}
      author="Eric Li"
      subject={`Cover Letter for ${position} at ${company}`}
      creator="JobFind"
    >
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.headerName}>{applicantName}</Text>
        <Text style={styles.contactLine}>{contactLine}</Text>

        <View>
          <Text style={styles.metaLine}>{dateLabel}</Text>
          <Text style={styles.metaLine}>{company}</Text>
          <Text style={styles.metaLine}>{position}</Text>
          {location ? <Text style={styles.metaLine}>{location}</Text> : null}
        </View>

        <Text style={styles.subjectLine}>{letter.subjectLine}</Text>
        <Text style={styles.salutation}>{letter.salutation}</Text>

        {letter.paragraphs.map((paragraph, index) => (
          <Text key={`paragraph-${index}`} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        <Text style={styles.signOff}>{letter.signOff}</Text>
        <Text>{letter.applicantName}</Text>
      </Page>
    </Document>
  );
}
