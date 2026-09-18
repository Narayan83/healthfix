import axios from "axios";
import { BASE_URL } from "../../Config";

const base = `${BASE_URL}/api/promotion-stocks`;

const jsonHeaders = { headers: { "Content-Type": "application/json" } };

export const listPromotionStockSummaries = (page, limit, filter) =>
  axios.get(`${base}/summary`, { params: { page, limit, filter } });

export const listPromotionStockEntries = (page, limit, filter) =>
  axios.get(base, { params: { page, limit, filter } });

export const getPromotionStockEntry = (id) => axios.get(`${base}/${id}`);

export const createPromotionStockEntry = (data) => axios.post(base, data, jsonHeaders);

export const updatePromotionStockEntry = (id, data) =>
  axios.put(`${base}/${id}`, data, jsonHeaders);

export const deletePromotionStockEntry = (id) => axios.delete(`${base}/${id}`);
