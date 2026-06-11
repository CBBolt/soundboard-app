use libloading::{Library, Symbol};
use std::ffi::{c_char, c_float, c_long, CStr, CString};

type VBVMRLogin = unsafe extern "C" fn() -> c_long;
type VBVMRLogout = unsafe extern "C" fn() -> c_long;


type VBVMRSetParameterFloat =
    unsafe extern "C" fn(
        *const c_char,
        c_float,
    ) -> c_long;

type VBVMRGetParameterFloat =
    unsafe extern "C" fn(
        *const c_char,
        *mut c_float,
    ) -> c_long;

type VBVMRSetParameterString =
    unsafe extern "C" fn(
        *const c_char,
        *const c_char,
    ) -> c_long;

type VBVMRGetParameterString =
    unsafe extern "C" fn(
        *const c_char,
        *mut c_char,
    ) -> c_long;
    
type VBVMRIsParametersDirty = unsafe extern "C" fn() -> c_long;

pub struct VoicemeeterSession {
    vm: Voicemeeter,
}

impl VoicemeeterSession {
    pub fn new(vm: Voicemeeter) -> Result<Self, String> {
        let res = unsafe { (vm.login_fn)() };

        if res < 0 {
            return Err(format!("login failed: {}", res));
        }

        Ok(Self { vm })
    }

    pub fn logout(&self) -> Result<(), String> {
        let result = unsafe { (self.vm.logout_fn)() };

        if result < 0 {
            return Err(format!("VBVMR_Logout failed: {}", result));
        }

        Ok(())
    }

    pub fn set_parameter_float(&self, param: &str, value: f32) -> Result<(), String> {
        let param = CString::new(param).map_err(|e| e.to_string())?;

        let res = unsafe {
            (self.vm.set_parameter_float_fn)(param.as_ptr(), value)
        };

        if res < 0 {
            return Err(format!("set failed: {}", res));
        }

        self.wait_sync(); 

        Ok(())
    }

    pub fn set_parameter_string(
        &self,
        param: &str,
        value: &str,
    ) -> Result<(), String> {
        let param = CString::new(param)
            .map_err(|e| e.to_string())?;

        let value = CString::new(value)
            .map_err(|e| e.to_string())?;

        let res = unsafe {
            (self.vm.set_parameter_string_fn)(
                param.as_ptr(),
                value.as_ptr(),
            )
        };

        if res < 0 {
            return Err(format!("set failed: {}", res));
        }

        self.wait_sync();

        Ok(())
    }

    pub fn get_parameter_float(&self, param: &str) -> Result<f32, String> {
  
        let param = CString::new(param).map_err(|e| e.to_string())?;

        let mut value: f32 = 0.0;

        let res = unsafe {
            (self.vm.get_parameter_float_fn)(param.as_ptr(), &mut value)
        };

        if res < 0 {
            return Err(format!("get failed: {}", res));
        }

        Ok(value)
    }

    pub fn get_parameter_string(
        &self,
        param: &str,
    ) -> Result<String, String> {
        let param = CString::new(param)
            .map_err(|e| e.to_string())?;

        let mut buffer = vec![0 as c_char; 512];

        let res = unsafe {
            (self.vm.get_parameter_string_fn)(
                param.as_ptr(),
                buffer.as_mut_ptr(),
            )
        };

        if res < 0 {
            return Err(format!("get failed: {}", res));
        }

        let value = unsafe {
            CStr::from_ptr(buffer.as_ptr())
        };

        Ok(value.to_string_lossy().into_owned())
    }

    fn wait_sync(&self) {
        loop {
            let dirty = unsafe { (self.vm.is_dirty_fn)() };

            if dirty == 0 {
                break;
            }

            std::thread::sleep(std::time::Duration::from_millis(2));
        }
    }
}

pub struct Voicemeeter {
    _lib: Library,
    login_fn: VBVMRLogin,
    logout_fn: VBVMRLogout,
    set_parameter_float_fn: VBVMRSetParameterFloat,
    get_parameter_float_fn: VBVMRGetParameterFloat,
    set_parameter_string_fn: VBVMRSetParameterString,
    get_parameter_string_fn: VBVMRGetParameterString,
    is_dirty_fn: VBVMRIsParametersDirty,
}

impl Voicemeeter {
    pub fn new() -> Result<Self, String> {
        let dll_path =
            r"C:\Program Files (x86)\VB\Voicemeeter\VoicemeeterRemote64.dll";

        let lib = unsafe {
            Library::new(dll_path)
                .map_err(|e| e.to_string())?
        };

        let login_fn = unsafe {
            let func: Symbol<VBVMRLogin> =
                lib.get(b"VBVMR_Login\0")
                    .map_err(|e| e.to_string())?;

            *func
        };

        let logout_fn = unsafe {
            let func: Symbol<VBVMRLogout> =
                lib.get(b"VBVMR_Logout\0")
                    .map_err(|e| e.to_string())?;

            *func
        };

        let set_parameter_float_fn = unsafe {
            let func: Symbol<VBVMRSetParameterFloat> =
                lib.get(b"VBVMR_SetParameterFloat\0")
                    .map_err(|e| e.to_string())?;

            *func
        };

        let get_parameter_float_fn = unsafe {
            let func: Symbol<VBVMRGetParameterFloat> =
                lib.get(b"VBVMR_GetParameterFloat\0")
                    .map_err(|e| e.to_string())?;

            *func
        };

        let set_parameter_string_fn = unsafe {
            let func: Symbol<VBVMRSetParameterString> =
                lib.get(b"VBVMR_SetParameterStringA\0")
                    .map_err(|e| e.to_string())?;

            *func
        };

        let get_parameter_string_fn = unsafe {
            let func: Symbol<VBVMRGetParameterString> =
                lib.get(b"VBVMR_GetParameterStringA\0")
                    .map_err(|e| e.to_string())?;

            *func
        };

        let is_dirty_fn = unsafe {
            let func: Symbol<VBVMRIsParametersDirty> =
                lib.get(b"VBVMR_IsParametersDirty\0")
                    .map_err(|e| e.to_string())?;
            *func
        };

        Ok(Self {
            _lib: lib,
            login_fn,
            logout_fn,
            set_parameter_float_fn,
            get_parameter_float_fn,
            set_parameter_string_fn,
            get_parameter_string_fn,
            is_dirty_fn,
        })
    }
}