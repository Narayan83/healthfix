import { useCallback, useEffect, useRef, useState } from "react";
import MasterListShell from "../../components/masters/MasterListShell";
import StatusBadge from "../../components/ui/StatusBadge";
import DoctorForm from "./DoctorForm";
import DoctorSearchBar from "./DoctorSearchBar";
import { deleteDoctor, listDoctors } from "./DoctorMasterService";

const columns = [
  { key: "name", label: "Doctor Name" },
  { key: "area", label: "Head Quarter" },
  { key: "mobile", label: "Mobile" },
  { key: "city", label: "Area" },
  { key: "visits", label: "Visits" },
  { key: "department", label: "Department" },
  { key: "status", label: "Status" },
];

export default function DoctorMaster() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setTableLoading(true);
    try {
      const res = await listDoctors(page, limit, filter);
      if (seq !== loadSeq.current) return;
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      if (seq === loadSeq.current) {
        setRows([]);
        setTotal(0);
      }
    } finally {
      if (seq === loadSeq.current) setTableLoading(false);
    }
  }, [page, limit, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this doctor?")) return;
    await deleteDoctor(id);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  const applySearch = () => {
    const next = searchInput.trim();
    if (next === filter && page === 1) return;
    setFilter(next);
    setPage(1);
  };

  const openDoctor = (doctor) => {
    setSearchInput(doctor.full_name || "");
    setFilter(doctor.full_name || "");
    setPage(1);
    setSelectedId(doctor.id);
    setShowForm(true);
  };

  return (
    <MasterListShell
      title="Doctor Master"
      subtitle="Register doctors, specialties, and contact information."
      searchInHeader
      headerSearch={
        <DoctorSearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
          onPickDoctor={openDoctor}
        />
      }
      tableLoading={tableLoading}
      addLabel="+ Add Doctor"
      onAdd={() => {
        setSelectedId(null);
        setShowForm(true);
      }}
      showForm={showForm}
      form={
        <DoctorForm
          selectedId={selectedId}
          onSuccess={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
          onExistingDoctorPick={openDoctor}
        />
      }
      columns={columns}
      rows={rows}
      emptyMessage={
        filter
          ? "No doctors match your search. Check spelling or pick a name from suggestions above."
          : "No doctors found. Add a doctor to get started."
      }
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
          <td className="fw-semibold">{row.full_name}</td>
          <td>{row.area?.name || "—"}</td>
          <td>{row.mobile || "—"}</td>
          <td>{row.city || "—"}</td>
          <td>{row.number_of_visits ?? 0}</td>
          <td>{row.department || "—"}</td>
          <td>
            <StatusBadge active={row.status === "active"} />
          </td>
        </>
      )}
    />
  );
}
