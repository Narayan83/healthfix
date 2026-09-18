import axios from "axios";
import { BASE_URL } from "../../Config";

const base = `${BASE_URL}/api/reports`;

export const fetchDailyCallRepresentatives = (date) =>
  axios.get(`${base}/daily-call/representatives`, { params: { date } });

export const fetchDailyCallDetails = (date, userId) =>
  axios.get(`${base}/daily-call/details`, { params: { date, user_id: userId } });

export const fetchOrderProductsReport = (date) =>
  axios.get(`${base}/order-products`, { params: { date } });

export const fetchDoctorVisitsReport = (date, representativeId) =>
  axios.get(`${base}/doctor-visits`, {
    params: { date, ...(representativeId ? { representative_id: representativeId } : {}) },
  });

export const fetchPromotionStockReport = (filter = "") =>
  axios.get(`${base}/promotion-stock`, { params: { filter } });
