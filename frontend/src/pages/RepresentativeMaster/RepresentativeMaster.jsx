import { useEffect, useState } from "react";
import MasterListShell from "../../components/masters/MasterListShell";
import StatusBadge from "../../components/ui/StatusBadge";
import RepresentativeForm from "./RepresentativeForm";
import { deleteRepresentative, listRepresentatives } from "./RepresentativeMasterService";

const columns = [
  { key: "name", label: "Representative" },
  { key: "code", label: "Code" },
  { key: "mobile", label: "Mobile" },
  { key: "territory", label: "Territory" },
  { key: "status", label: "Status" },
];

export default function RepresentativeMaster() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filter, setFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    listRepresentatives(page, limit, filter).then((res) => {
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    });
  };

  useEffect(() => {
    load();
  }, [page, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this representative?")) return;
    try {
      await deleteRepresentative(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  return (
    <MasterListShell
      title="Representative Master"
      subtitle="Manage field representatives and territories."
      searchPlaceholder="Search representatives..."
      searchValue={filter}
      onSearchChange={(v) => {
        setFilter(v);
        setPage(1);
      }}
      addLabel="+ Add Representative"
      onAdd={() => {
        setSelectedId(null);
        setShowForm(true);
      }}
      showForm={showForm}
      form={
        <RepresentativeForm
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
      emptyMessage="No representatives found. Add a representative to get started."
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
          <td>{row.code || "—"}</td>
          <td>{row.mobile || "—"}</td>
          <td>{row.territory || "—"}</td>
          <td>
            <StatusBadge active={row.status === "active"} />
          </td>
        </>
      )}
    />
  );
}
