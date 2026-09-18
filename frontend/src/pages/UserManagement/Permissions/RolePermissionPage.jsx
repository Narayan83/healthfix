import { useEffect, useState } from "react";
import {
  getRoles,
  getMenuTree,
  getRolePermissions,
  saveRolePermission,
  deleteRolePermission,
} from "./RolePermissionService";

const defaultPermission = {
  can_view: false,
  can_create: false,
  can_update: false,
  can_delete: false,
  can_all: false,
};

const RolePermissionPage = () => {
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [roleId, setRoleId] = useState("");
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    getRoles().then((res) => setRoles(res.data.data || res.data));
    getMenuTree().then((res) => setMenus(res.data));
  }, []);

  const loadPermissions = async () => {
    if (!roleId) return;
    const res = await getRolePermissions(roleId);
    let map = {};

    res.data.forEach((m) => {
      map[m.menu_id] = {
        id: m.id,
        ...JSON.parse(m.permissions),
      };
    });

    setPermissions(map);
  };

  useEffect(() => {
    loadPermissions();
  }, [roleId]);

  const togglePermission = async (menuId, perm) => {
    let current = permissions[menuId] || { ...defaultPermission };

    let updated = { ...current, [perm]: !current[perm] };

    // If check "ALL", auto apply all others
    if (perm === "can_all") {
      updated = Object.fromEntries(
        Object.keys(defaultPermission).map((p) => [p, !current.can_all])
      );
    }

    setPermissions({ ...permissions, [menuId]: updated });

    const payload = {
      role_id: Number(roleId),
      menu_id: menuId,
      permissions: JSON.stringify(updated),
    };

    // Upsert
    const res = await saveRolePermission(payload);
    setPermissions({
      ...permissions,
      [menuId]: { id: res.data.id, ...updated },
    });
  };

  const removePermission = async (menuId) => {
    if (!permissions[menuId]?.id) return;
    await deleteRolePermission(permissions[menuId].id);
    let newPerm = { ...permissions };
    delete newPerm[menuId];
    setPermissions(newPerm);
  };

  const renderMenu = (menu, depth = 0) => {
    const perm = permissions[menu.id] || defaultPermission;

    return (
      <div key={menu.id} style={{ marginLeft: depth * 20 }} className="border-bottom py-2">
        <strong>{menu.menu_name}</strong>

        <div className="d-flex gap-3 mt-2">
          {Object.keys(defaultPermission).map((p) => (
            <label key={p}>
              <input
                type="checkbox"
                checked={perm[p] || false}
                onChange={() => togglePermission(menu.id, p)}
              />
              &nbsp;{p.replace("can_", "").toUpperCase()}
            </label>
          ))}

          {permissions[menu.id] && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => removePermission(menu.id)}
            >
              Remove
            </button>
          )}
        </div>

        {menu.children?.map((child) => renderMenu(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="page-content">
       <div className="role-creation-container">
         <h2 className="page-title mb-4">Role Permission Management</h2>

      <select
        className="form-select w-50 mb-3"
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
      >
        <option value="">-- Select Role --</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.role_name}
          </option>
        ))}
      </select>

      {roleId && menus.map((m) => renderMenu(m))}
       </div>
    </div>
  );
};

export default RolePermissionPage;
