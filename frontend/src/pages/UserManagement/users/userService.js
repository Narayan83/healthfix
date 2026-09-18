import axios from "axios";

import { BASE_URL } from "../../../Config"; // adjust base URL

export const getUsers = (search = "") =>
  axios.get(`${BASE_URL}/api/users`, { params: { search } });

export const getUserById = (id) =>
  axios.get(`${BASE_URL}/api/users/${id}`);

export const createUser = (data) =>
  axios.post(`${BASE_URL}/api/users`, data);

export const updateUser = (id, data) =>
  axios.put(`${BASE_URL}/api/users/${id}`, data);

export const changeUserPassword = (id, data) =>
  axios.put(`${BASE_URL}/api/users/${id}/password`, data);

export const changeMyPassword = (data) =>
  axios.put(`${BASE_URL}/api/change-password`, data, {
    headers: { "Content-Type": "application/json" },
  });

export const deleteUser = (id) =>
  axios.delete(`${BASE_URL}/api/users/${id}`);

export const restoreUser = (id) =>
  axios.put(`${BASE_URL}/api/users/restore/${id}`);

export const forceDeleteUser = (id) =>
  axios.delete(`${BASE_URL}/api/users/force/${id}`);
