import axios from "axios";

import { BASE_URL } from "../../../Config";

const userRoleService = { 
  
  getUserRoles(userId) {
    return axios.get(`${BASE_URL}/api/user-role`, {
      params: { user_id: userId }
    });
  },


  assignRole(data) {
    // data = { user_id, role_id, priority }
    return axios.post(`${BASE_URL}/api/user-role`, data);
  },


  removeUserRole(mappingId) {
    return axios.delete(`${BASE_URL}/api/user-role/${mappingId}`);
  },


  getUsers() {
    return axios.get(`${BASE_URL}/api/users`);
  },


  getRoles() {
    return axios.get(`${BASE_URL}/api/roles`);
  },
};

export default userRoleService;
