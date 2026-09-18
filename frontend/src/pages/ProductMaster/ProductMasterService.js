import axios from "axios";
import { BASE_URL } from "../../Config";

const base = `${BASE_URL}/api/product-masters`;

export const listProducts = (page, limit, filter) =>
  axios.get(base, { params: { page, limit, filter } });

export const getProduct = (id) => axios.get(`${base}/${id}`);

export const createProduct = (data) => axios.post(base, data);

export const updateProduct = (id, data) => axios.put(`${base}/${id}`, data);

export const deleteProduct = (id) => axios.delete(`${base}/${id}`);
