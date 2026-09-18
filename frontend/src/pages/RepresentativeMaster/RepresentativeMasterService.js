import axios from "axios";
import { BASE_URL } from "../../Config";

const base = `${BASE_URL}/api/representative-masters`;

export const listRepresentatives = (page, limit, filter) =>
  axios.get(base, { params: { page, limit, filter } });

export const getRepresentativeOptions = () => axios.get(`${base}/options`);

export const getRepresentative = (id) => axios.get(`${base}/${id}`);

export const createRepresentative = (data) => axios.post(base, data);

export const updateRepresentative = (id, data) => axios.put(`${base}/${id}`, data);

export const deleteRepresentative = (id) => axios.delete(`${base}/${id}`);
