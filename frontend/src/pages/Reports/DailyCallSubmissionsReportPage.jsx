import PageLayout from "../../components/layout/PageLayout";
import DailyCallSubmissionsReport from "./DailyCallSubmissionsReport";

export default function DailyCallSubmissionsReportPage() {
  return (
    <PageLayout
      title="Daily Call Submissions"
      subtitle="Representatives who submitted on the selected date, with full visit details."
    >
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <DailyCallSubmissionsReport />
        </div>
      </div>
    </PageLayout>
  );
}
