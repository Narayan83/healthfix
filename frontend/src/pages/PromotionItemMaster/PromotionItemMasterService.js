import axios from "axios";
import { BASE_URL } from "../../Config";

const base = `${BASE_URL}/api/promotion-items`;

const jsonHeaders = { headers: { "Content-Type": "application/json" } };

export const listPromotionItems = (page, limit, filter) =>
  axios.get(base, { params: { page, limit, filter } });

export const listPromotionItemOptions = () => axios.get(`${base}/options`);

export const getPromotionItem = (id) => axios.get(`${base}/${id}`);

export const createPromotionItem = (data) => axios.post(base, data, jsonHeaders);

export const updatePromotionItem = (id, data) => axios.put(`${base}/${id}`, data, jsonHeaders);

export const deletePromotionItem = (id) => axios.delete(`${base}/${id}`);
