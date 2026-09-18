import PageLayout from "../../components/layout/PageLayout";
import PromotionStockReport from "./PromotionStockReport";

export default function PromotionStockReportPage() {
  return (
    <PageLayout
      title="Promotion Item Stock Report"
      subtitle="Current stock quantity and value per promotion item."
    >
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <PromotionStockReport />
        </div>
      </div>
    </PageLayout>
  );
}
