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
    lineHeight: 1.35,
    color: "#000000",
    backgroundColor: "#ffffff",
  },
  headerName: {
    fontSize: 11.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  contactLine: {
    fontSize: 10.5,
    marginBottom: 14,
  },
  metaBlock: {
    marginBottom: 14,
  },
  metaLine: {
    marginBottom: 2,
  },
  salutation: {
    marginBottom: 10,
  },
  paragraph: {
    marginBottom: 10,
    textAlign: "left",
  },
  signOffBlock: {
    marginTop: 4,
  },
  signOff: {
    marginBottom: 18,
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
      author={applicantName}
      subject={`Cover Letter for ${position} at ${company}`}
      creator="JobFind"
    >
      <Page size="LETTER" style={styles.page} wrap={false}>
        <Text style={styles.headerName}>{applicantName}</Text>
        <Text style={styles.contactLine}>{contactLine}</Text>

        <View style={styles.metaBlock}>
          <Text style={styles.metaLine}>{dateLabel}</Text>
          <Text style={styles.metaLine}>{company}</Text>
          <Text style={styles.metaLine}>{position}</Text>
          {location ? <Text style={styles.metaLine}>{location}</Text> : null}
        </View>

        <Text style={styles.salutation}>{letter.salutation}</Text>

        {letter.paragraphs.map((paragraph, index) => (
          <Text key={`paragraph-${index}`} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        <View style={styles.signOffBlock}>
          <Text style={styles.signOff}>{letter.signOff}</Text>
          <Text>{letter.applicantName}</Text>
        </View>
      </Page>
    </Document>
  );
}
