import axios from "axios";
import { BASE_URL } from "../../Config";

const base = `${BASE_URL}/api/head-quarter-masters`;

const jsonHeaders = { headers: { "Content-Type": "application/json" } };

export const listAreas = (page, limit, filter) =>
  axios.get(base, { params: { page, limit, filter } });

export const listAreaOptions = () => axios.get(`${base}/options`);

export const getArea = (id) => axios.get(`${base}/${id}`);

export const createArea = (data) => axios.post(base, data, jsonHeaders);

export const updateArea = (id, data) => axios.put(`${base}/${id}`, data, jsonHeaders);

export const deleteArea = (id) => axios.delete(`${base}/${id}`);

// Aliases for Head Quarter naming
export const listHeadQuarters = listAreas;
export const listHeadQuarterOptions = listAreaOptions;
export const getHeadQuarter = getArea;
export const createHeadQuarter = createArea;
export const updateHeadQuarter = updateArea;
export const deleteHeadQuarter = deleteArea;
