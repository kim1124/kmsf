update public.manager as manager
set
  role = 'admin',
  level = 3,
  status = 'active',
  updated_at = now()
from auth.users as auth_user
where auth_user.id = manager.id
  and (
    auth_user.raw_app_meta_data->>'role' = 'admin'
    or auth_user.raw_user_meta_data->>'role' = 'admin'
    or auth_user.raw_app_meta_data->>'level' = '3'
    or auth_user.raw_user_meta_data->>'level' = '3'
  );
