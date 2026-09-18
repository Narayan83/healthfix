import { useEffect, useState } from "react";
import MasterListShell from "../../components/masters/MasterListShell";
import StatusBadge from "../../components/ui/StatusBadge";
import StockistForm from "./StockistForm";
import { deleteStockist, listStockists } from "./StockistMasterService";

const columns = [
  { key: "name", label: "Stockist Name" },
  { key: "hq", label: "Head Quarter" },
  { key: "place", label: "Place" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
];

export default function StockistMaster() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filter, setFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    listStockists(page, limit, filter).then((res) => {
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    });
  };

  useEffect(() => {
    load();
  }, [page, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this stockist?")) return;
    try {
      await deleteStockist(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete stockist");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  return (
    <MasterListShell
      title="Stockist Master"
      subtitle="Manage stockists mapped to each head quarter."
      searchPlaceholder="Search stockists..."
      searchValue={filter}
      onSearchChange={(v) => {
        setFilter(v);
        setPage(1);
      }}
      addLabel="+ Add Stockist"
      onAdd={() => {
        setSelectedId(null);
        setShowForm(true);
      }}
      showForm={showForm}
      form={
        <StockistForm
          selectedId={selectedId}
          onSuccess={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      }
      columns={columns}
      rows={rows}
      emptyMessage="No stockists found. Add a stockist to get started."
      page={page}
      totalPages={totalPages}
      total={total}
      limit={limit}
      onPrev={() => setPage(page - 1)}
      onNext={() => setPage(page + 1)}
      onEdit={(row) => {
        setSelectedId(row.id);
        setShowForm(true);
      }}
      onDelete={handleDelete}
      renderCells={(row) => (
        <>
          <td className="fw-semibold">{row.name}</td>
          <td>{row.area?.name || "—"}</td>
          <td>{row.place || "—"}</td>
          <td>{row.email || "—"}</td>
          <td>
            <StatusBadge active={row.status === "active"} />
          </td>
        </>
      )}
    />
  );
}
