import PageLayout from "../../components/layout/PageLayout";
import OrderProductsReport from "./OrderProductsReport";

export default function OrderProductsReportPage() {
  return (
    <PageLayout
      title="Order Products Report"
      subtitle="Products ordered by representatives on the selected date."
    >
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <OrderProductsReport />
        </div>
      </div>
    </PageLayout>
  );
}
