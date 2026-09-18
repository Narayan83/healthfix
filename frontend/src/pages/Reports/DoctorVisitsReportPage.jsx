import PageLayout from "../../components/layout/PageLayout";
import DoctorVisitsReport from "./DoctorVisitsReport";

export default function DoctorVisitsReportPage() {
  return (
    <PageLayout
      title="Doctor Visits Report"
      subtitle="Doctor visits by date; filter by representative."
    >
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <DoctorVisitsReport />
        </div>
      </div>
    </PageLayout>
  );
}
