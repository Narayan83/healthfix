import axios from "axios";

import { BASE_URL } from "../../../Config"; // adjust base URL

export const getRoles = (page, limit, filter) =>
  axios.get(`${BASE_URL}/api/roles`, { params: { page, limit, filter } });

export const getRole = (id) => axios.get(`${BASE_URL}/api/roles/${id}`); 

export const createRole = (data) => axios.post(`${BASE_URL}/api/roles/`, data);

export const updateRole = (id, data) => axios.put(`${BASE_URL}/api/roles/${id}`, data);

export const deleteRole = (id) => axios.delete(`${BASE_URL}/api/roles/${id}`);