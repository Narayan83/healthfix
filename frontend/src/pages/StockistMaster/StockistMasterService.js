import axios from "axios";
import { BASE_URL } from "../../Config";

const base = `${BASE_URL}/api/stockist-masters`;

const jsonHeaders = { headers: { "Content-Type": "application/json" } };

export const listStockists = (page, limit, filter) =>
  axios.get(base, { params: { page, limit, filter } });

export const getStockist = (id) => axios.get(`${base}/${id}`);

export const createStockist = (data) => axios.post(base, data, jsonHeaders);

export const updateStockist = (id, data) => axios.put(`${base}/${id}`, data, jsonHeaders);

export const deleteStockist = (id) => axios.delete(`${base}/${id}`);
