import axios from "axios";

import { BASE_URL } from "../../../Config"; // adjust base URL

export const getMenus = (page, limit, filter) =>
  axios.get(`${BASE_URL}/api/menu`, { params: { page, limit, filter } });

export const getMenu = (id) => axios.get(`${BASE_URL}/api/menu/${id}`);

export const createMenu = (data) => axios.post(`${BASE_URL}/api/menu`, data);

export const updateMenu = (id, data) => axios.put(`${BASE_URL}/api/menu/${id}`, data);

export const deleteMenu = (id) => axios.delete(`${BASE_URL}/api/menu/${id}`);

export const getMenuTree = () => axios.get(`${BASE_URL}/api/menu/tree`);
