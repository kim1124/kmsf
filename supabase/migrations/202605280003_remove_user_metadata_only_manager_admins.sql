update public.manager as manager
set
  role = 'member',
  level = 1,
  updated_at = now()
from auth.users as auth_user
where auth_user.id = manager.id
  and manager.role = 'admin'
  and manager.level = 3
  and (
    auth_user.raw_user_meta_data->>'role' = 'admin'
    or auth_user.raw_user_meta_data->>'level' = '3'
  )
  and not (
    auth_user.raw_app_meta_data->>'role' = 'admin'
    or auth_user.raw_app_meta_data->>'level' = '3'
  );
