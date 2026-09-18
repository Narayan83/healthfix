import axios from "axios";
import { BASE_URL } from "../../Config";

const base = `${BASE_URL}/api/designation-masters`;

export const listDesignations = (page, limit, filter) =>
  axios.get(base, { params: { page, limit, filter } });

export const getDesignation = (id) => axios.get(`${base}/${id}`);

export const createDesignation = (data) => axios.post(base, data);

export const updateDesignation = (id, data) => axios.put(`${base}/${id}`, data);

export const deleteDesignation = (id) => axios.delete(`${base}/${id}`);
