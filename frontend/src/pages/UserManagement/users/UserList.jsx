import { useEffect, useState } from "react";
import MasterListShell from "../../../components/masters/MasterListShell";
import StatusBadge from "../../../components/ui/StatusBadge";
import UserForm from "./UserForm";
import { deleteUser, getUsers } from "./userService";

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Mobile" },
  { key: "representative", label: "Representative" },
  { key: "status", label: "Status" },
];

export default function UserList() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    getUsers(filter).then((res) => {
      setRows(Array.isArray(res.data) ? res.data : res.data?.data || []);
    });
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await deleteUser(id);
    load();
  };

  const filtered = rows;

  return (
    <MasterListShell
      title="User Accounts"
      subtitle="Create users and map them to field representatives."
      searchPlaceholder="Search by name, email, or mobile..."
      searchValue={filter}
      onSearchChange={setFilter}
      addLabel="+ Add User"
      onAdd={() => {
        setSelectedUser(null);
        setShowForm(true);
      }}
      showForm={showForm}
      form={
        <UserForm
          user={selectedUser}
          onSuccess={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      }
      columns={columns}
      rows={filtered}
      emptyMessage="No users found. Add a user to get started."
      page={1}
      totalPages={1}
      total={filtered.length}
      limit={filtered.length || 10}
      onPrev={() => {}}
      onNext={() => {}}
      onEdit={(row) => {
        setSelectedUser(row);
        setShowForm(true);
      }}
      onDelete={handleDelete}
      renderCells={(row) => (
        <>
          <td className="fw-semibold">
            {[row.firstname, row.lastname].filter(Boolean).join(" ") || "—"}
          </td>
          <td>{row.email}</td>
          <td>{row.mobile_number || "—"}</td>
          <td>{row.representative?.name || "—"}</td>
          <td>
            <StatusBadge active={row.active !== false} />
          </td>
        </>
      )}
    />
  );
}
