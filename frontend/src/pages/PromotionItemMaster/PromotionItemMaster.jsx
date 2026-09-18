import { useEffect, useState } from "react";
import MasterListShell from "../../components/masters/MasterListShell";
import StatusBadge from "../../components/ui/StatusBadge";
import PromotionItemForm from "./PromotionItemForm";
import { deletePromotionItem, listPromotionItems } from "./PromotionItemMasterService";

const columns = [
  { key: "item_name", label: "Item Name" },
  { key: "status", label: "Status" },
];

export default function PromotionItemMaster() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filter, setFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    listPromotionItems(page, limit, filter).then((res) => {
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    });
  };

  useEffect(() => {
    load();
  }, [page, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this promotion item?")) return;
    try {
      await deletePromotionItem(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete promotion item");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  return (
    <MasterListShell
      title="Promotion Item Master"
      subtitle="Create promotion items used for stock and distribution."
      searchPlaceholder="Search promotion items..."
      searchValue={filter}
      onSearchChange={(v) => {
        setFilter(v);
        setPage(1);
      }}
      addLabel="+ Add Promotion Item"
      onAdd={() => {
        setSelectedId(null);
        setShowForm(true);
      }}
      showForm={showForm}
      form={
        <PromotionItemForm
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
      emptyMessage="No promotion items found. Add an item to get started."
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
          <td className="fw-semibold">{row.item_name}</td>
          <td>
            <StatusBadge active={row.status === "active"} />
          </td>
        </>
      )}
    />
  );
}
