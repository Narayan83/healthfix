import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../../styles/user_management.scss";
import { BASE_URL } from "../../../../Config";

const UserMnagement1 = () => {

    const [customer ,setCustomer] = useState(null);
    const [users ,setUsers] = useState(null);
    const[roles,setRoles] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole,setSelectedRole] = useState(null);
    const [menues,setMenus] = useState(null);
    const [selectedMenu,setSelectedMenu] = useState(null);
    const [permissions,setPermissions] = useState(null);
    const [originalPermissions,setOriginalPermissions] = useState(null);

    const [menuList,setMenuList]=useState(null);
   
    const fetchusers =  useCallback(
        async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/users?limit=1000`);
            const userArray = Array.isArray(res.data) ? res.data : res.data.data || [];

            setUsers(userArray);
            
        } catch (err) {
            console.error('UserManagement: failed to fetch menus, falling back to localStorage', err);
        
        }
        }
    );


    const getroles = useCallback( async() => {
        try {
        const res = await axios.get(`${BASE_URL}/api/roles?limit=1000`);
        const rolesArray = Array.isArray(res.data) ? res.data : res.data.data || [];

        setRoles(rolesArray);
        
      } catch (err) {
        console.error('UserManagement: failed to fetch menus, falling back to localStorage', err);
       
      }
    });


      const getMenues = useCallback( async() => {
        try {
        const res = await axios.get(`${BASE_URL}/api/loadMenus?limit=1000`);
        const menusArray = Array.isArray(res.data) ? res.data : res.data.data || [];
        setMenus(menusArray);
        
      } catch (err) {
        console.error('UserManagement: failed to fetch menus, falling back to localStorage', err);
       
      }
    });

    const fetchPermissions = useCallback(
        async (id) =>{
            try {
            const res = await axios.get(`${BASE_URL}/api/roles/${id}/permissions`);
            console.log(res);
            // const permissionsArray = Array.isArray(res.data) ? res.data : res.data.data || [];

              setPermissions(res.data);
              setOriginalPermissions(res.data);
            
            
            } catch (err) {
                console.error('UserManagement: failed to fetch menus, falling back to localStorage', err);
            
            }
        }
    )
    

    useEffect(()=>{
        fetchusers();
        getroles();
        getMenues();
       
    },[]);

    useEffect(()=>{
        console.log(users);
    },[users]);

    useEffect( ()=>{
       if(selectedRole){
        console.log();
        const obj = JSON.parse(selectedRole);
            console.log(obj);
            fetchPermissions(obj.id);

       }
    },[selectedRole]);

    useEffect(()=>{console.log(roles)},[roles]);
    useEffect(()=>{console.log(menues)},[menues]);
    useEffect(()=>{console.log(menuList)},[menuList]);


    useEffect(()=>{
        console.log(permissions)
      //   let menul = []; 
      //  permissions && Object.entries(permissions).map(([menuId, permission]) => {
      //       const menu = menues?.filter( (m) => m.id == menuId  );
      //       console.log(menu);
      //       menul.push({menu:menu,...permission});
      //   });
      //   if(menul.length > 0){
      //       setMenuList(menul);
      //   }

      if(permissions){
        const menus = [...menues];
        const mappedMenus = menus.map(menu => ({
            menu_id: menu.id,
            menu_name: menu.menu_name,
            permissions: permissions.permissions[menu.id] || {}
          }));

          console.log(mappedMenus);
          if(mappedMenus){
            setMenuList(mappedMenus);
          }
      }

    
    },[permissions]);


    const handleOnchangeRole = (e) =>{
            setSelectedRole(e.target.value);            
    }


//   const handleAllChange = (menuId) => {
//   const allChecked = !permissions.permissions[menuId].can_all;
//   console.log(allChecked)

//   //console.log(!permissions.permissions[menuId].can_all)

//   setPermissions(prev => ({
//     ...prev,
//     [menuId]: {
//       ...prev[menuId],
//       can_all: allChecked,
//       can_view: allChecked,
//       can_create: allChecked,
//       can_update: allChecked,
//       can_delete: allChecked
//     }
//   }));
// };
    

 
 const handleAllChange = (menuId) => {
  const prevMenuPermission = permissions.permissions[menuId];
  const allChecked = !prevMenuPermission.can_all;

  // ✅ update permissions state
  setPermissions(prev => ({
    ...prev,
    permissions: {
      ...prev.permissions,
      [menuId]: {
        ...prevMenuPermission,
        can_all: allChecked,
        can_view: allChecked,
        can_create: allChecked,
        can_update: allChecked,
        can_delete: allChecked
      }
    }
  }));

  // ✅ update menuList state (UI is showing this)
  setMenuList(prev =>
    prev.map(menu =>
      menu.menu_id === menuId
        ? {
            ...menu,
            permissions: {
              ...menu.permissions,
              can_all: allChecked,
              can_view: allChecked,
              can_create: allChecked,
              can_update: allChecked,
              can_delete: allChecked
            }
        }
        : menu
    )
  );
};




const handlePermissionToggle = (menuId, key) => {
  const prevMenuPermission = permissions.permissions[menuId];
  const newValue = !prevMenuPermission[key];


  setPermissions(prev => ({
    ...prev,
    permissions: {
      ...prev.permissions,
      [menuId]: {
        ...prevMenuPermission,
        [key]: newValue,
     
        ...(key !== "can_all" && { can_all: false })
      }
    }
  }));

  
  setMenuList(prev =>
    prev.map(menu =>
      menu.menu_id === menuId
        ? {
            ...menu,
            permissions: {
              ...menu.permissions,
              [key]: newValue,
              ...(key !== "can_all" && { can_all: false })
            }
          }
        : menu
    )
  );
};



const handleReset = () => {
  if (!originalPermissions) return;


  setPermissions(originalPermissions);


  const resetMenus = menues.map(menu => ({
    menu_id: menu.id,
    menu_name: menu.menu_name,
    permissions: originalPermissions.permissions[menu.id] || {}
  }));

  setMenuList(resetMenus);

  console.log("Permissions reset to original");
};


  return (
     <div className="user-management-container">
      <div className="user-management-header">User Management</div>
      <div className="user-management-selectors">
        <div>
          <label>Select User</label>
          <select value={selectedUser?selectedUser:''} onChange={e => setSelectedUser(e.target.value)}>
            {users?.map(u => <option key={u.id} value={u}>{u.firstname}</option>)}
          </select>
        </div>
        <div>
          <label>Select Role</label>
          <select value={selectedRole?selectedRole:''} onChange={e => handleOnchangeRole(e)}>
            {roles?.map(r => <option key={r.id} value={JSON.stringify(r)}>{r.role_name}</option>)}
          </select>
        </div>
        <div>
          <label>Select Menu</label>
          <select value={selectedMenu?selectedMenu:''} onChange={e => setSelectedMenu(e.target.value)}>
            {menues?.map(m => <option key={m.id} value={m}>{m.menu_name}</option>)}
          </select>
        </div>
      </div>


       <div className="user-management-permissions">
        <div className="user-management-permissions-title">
          Assign Permissions for: <b>{selectedRole?.role_name}</b>
        </div>
        <div className="permissions-table">
          {
            menuList?.map((item,index)=>(
              <div className={`permissions-row`} key={item.menu_id}>
                <span className="menu-title">{item.menu_name}</span>

                 <label key={'all'+index} className="perm-label">
                  <input
                    type="checkbox"
                    checked={item.permissions.can_all}
                    onChange={()=>handleAllChange(item.menu_id)}
                    
                    
                  />
                  All
                </label>

                 <label key={'cr'+index} className="perm-label">
                  <input
                    type="checkbox"
                    checked={item.permissions.can_create}
                     onChange={() => handlePermissionToggle(item.menu_id, "can_create")}
                  />
                  Create
                </label>


                 <label key={'view'+index} className="perm-label">
                  <input
                    type="checkbox"
                    checked={item.permissions.can_view}
                     onChange={() => handlePermissionToggle(item.menu_id, "can_view")}
                  />
                  View
                </label>


                <label key={ 'up'+index } className="perm-label">
                  <input
                    type="checkbox"
                    checked={item.permissions.can_update}
                    onChange={() => handlePermissionToggle(item.menu_id, "can_update")}
                  />
                  update
                </label>


                 <label key={ 'del'+index } className="perm-label">
                  <input
                    type="checkbox"
                    checked={item.permissions.can_delete}
                    onChange={() => handlePermissionToggle(item.menu_id, "can_delete")}
                  />
                  Delete
                </label>

              
              </div>
            ))
          }

        </div>
       
        <div className="buttons-container">
          <button className="save-button" onClick={handleReset}>
            Reset Permissions
          </button>
          <button className="save-button" onClick={() => {
            localStorage.setItem(`permissions_${selectedUser}_${selectedRole}`, JSON.stringify(permissions));
            console.log('Changes saved for user:', selectedUser, 'role:', selectedRole);
          }}>
            Save Changes
          </button>
        </div>
      </div>
      
    </div>
  )
}

export default UserMnagement1
