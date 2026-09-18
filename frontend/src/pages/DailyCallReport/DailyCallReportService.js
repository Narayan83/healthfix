import axios from "axios";
import { BASE_URL } from "../../Config";

const base = `${BASE_URL}/api/daily-call-reports`;

export const checkYesterdayRequirement = (entryDate) =>
  axios.get(`${base}/yesterday-check`, { params: { entry_date: entryDate } });

export const submitDailyCallReport = (payload) =>
  axios.post(base, payload, { headers: { "Content-Type": "application/json" } });

export const listDoctorsByArea = (areaId, filter = "") =>
  axios.get(`${BASE_URL}/api/doctor-masters`, {
    params: { page: 1, limit: 500, area_id: areaId, filter },
  });

export const listChemistsByArea = (areaId, filter = "") =>
  axios.get(`${BASE_URL}/api/chemist-masters`, {
    params: { page: 1, limit: 500, area_id: areaId, filter },
  });
