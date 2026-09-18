import { useEffect, useState } from "react";
import MasterListShell from "../../components/masters/MasterListShell";
import StatusBadge from "../../components/ui/StatusBadge";
import AreaForm from "./AreaForm";
import { deleteArea, listAreas } from "./AreaMasterService";

const columns = [
  { key: "name", label: "Head Quarter" },
  { key: "status", label: "Status" },
];

export default function AreaMaster() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filter, setFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    listAreas(page, limit, filter).then((res) => {
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    });
  };

  useEffect(() => {
    load();
  }, [page, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this head quarter?")) return;
    try {
      await deleteArea(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete head quarter");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  return (
    <MasterListShell
      title="Head Quarter Master"
      subtitle="Manage head quarters used for doctors, chemists, and stockists."
      searchPlaceholder="Search head quarters..."
      searchValue={filter}
      onSearchChange={(v) => {
        setFilter(v);
        setPage(1);
      }}
      addLabel="+ Add Head Quarter"
      onAdd={() => {
        setSelectedId(null);
        setShowForm(true);
      }}
      showForm={showForm}
      form={
        <AreaForm
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
      emptyMessage="No head quarters found. Add a head quarter to get started."
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
          <td>
            <StatusBadge active={row.status === "active"} />
          </td>
        </>
      )}
    />
  );
}
