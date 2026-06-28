// Module-level token storage — lives outside React so fetchInterceptor can read it
// without needing React context. AuthContext sets/clears it on login/logout.
let _token = null;

export const tokenStore = {
  get:   ()  => _token,
  set:   (t) => { _token = t; },
  clear: ()  => { _token = null; },
};
