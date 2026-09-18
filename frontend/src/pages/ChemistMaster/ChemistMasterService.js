import axios from "axios";
import { BASE_URL } from "../../Config";

const base = `${BASE_URL}/api/chemist-masters`;

export const listChemists = (page, limit, filter) =>
  axios.get(base, { params: { page, limit, filter } });

export const getChemist = (id) => axios.get(`${base}/${id}`);

export const createChemist = (data) => axios.post(base, data);

export const updateChemist = (id, data) => axios.put(`${base}/${id}`, data);

export const deleteChemist = (id) => axios.delete(`${base}/${id}`);
