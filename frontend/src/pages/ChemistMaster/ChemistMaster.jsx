import { useEffect, useState } from "react";
import MasterListShell from "../../components/masters/MasterListShell";
import StatusBadge from "../../components/ui/StatusBadge";
import ChemistForm from "./ChemistForm";
import { deleteChemist, listChemists } from "./ChemistMasterService";

const columns = [
  { key: "name", label: "Chemist Name" },
  { key: "hq", label: "Head Quarter" },
  { key: "place", label: "Area" },
  { key: "mobile", label: "Mobile" },
  { key: "status", label: "Status" },
];

export default function ChemistMaster() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filter, setFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    listChemists(page, limit, filter).then((res) => {
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    });
  };

  useEffect(() => {
    load();
  }, [page, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this chemist?")) return;
    await deleteChemist(id);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  return (
    <MasterListShell
      title="Chemist Master"
      subtitle="Manage chemist profiles, addresses, and contact details."
      searchPlaceholder="Search chemists..."
      searchValue={filter}
      onSearchChange={(v) => {
        setFilter(v);
        setPage(1);
      }}
      addLabel="+ Add Chemist"
      onAdd={() => {
        setSelectedId(null);
        setShowForm(true);
      }}
      showForm={showForm}
      form={
        <ChemistForm
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
      emptyMessage="No chemists found. Add a chemist to get started."
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
          <td>{row.search_place || "—"}</td>
          <td>{row.mobile || "—"}</td>
          <td>
            <StatusBadge active={row.status === "active"} />
          </td>
        </>
      )}
    />
  );
}
