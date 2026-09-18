import axios from "axios";

import { BASE_URL } from "../../../Config"; // adjust base URL

export const getRoles = () => axios.get(`${BASE_URL}/api/roles?limit=100`);
export const getMenuTree = () => axios.get(`${BASE_URL}/api/menu/tree`);
export const getRolePermissions = (roleId) => 
  axios.get(`${BASE_URL}/api/roleManage`, { params: { role_id: roleId } });

export const saveRolePermission = (data) =>
  axios.post(`${BASE_URL}/api/roleManage`, data);

export const deleteRolePermission = (id) =>
  axios.delete(`${BASE_URL}/api/roleManage/${id}`);
