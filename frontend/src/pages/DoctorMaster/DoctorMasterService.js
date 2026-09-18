import axios from "axios";
import { BASE_URL } from "../../Config";

const base = `${BASE_URL}/api/doctor-masters`;

export const listDoctors = (page, limit, filter) =>
  axios.get(base, { params: { page, limit, filter } });

/** Lightweight name lookup for duplicate detection while typing Full Name */
export const suggestDoctors = (query, limit = 8) =>
  axios.get(base, { params: { page: 1, limit, filter: query } });

export const getDoctor = (id) => axios.get(`${base}/${id}`);

export const createDoctor = (data) => axios.post(base, data);

export const updateDoctor = (id, data) => axios.put(`${base}/${id}`, data);

export const deleteDoctor = (id) => axios.delete(`${base}/${id}`);
