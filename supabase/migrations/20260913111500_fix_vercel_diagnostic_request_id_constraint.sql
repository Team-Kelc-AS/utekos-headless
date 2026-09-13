set lock_timeout = '5s';

alter table ops.vercel_runtime_diagnostics
  drop constraint vercel_runtime_diagnostics_request_id_check,
  add constraint vercel_runtime_diagnostics_request_id_check
    check (length(request_id) between 1 and 256 and request_id ~ '^[a-zA-Z0-9_:-]+$');
