create or replace function marketing.meta_state_from_norwegian_location(
  postal_code text,
  city text
)
returns text
language sql
immutable
set search_path = ''
as $function$
  select case
    when postal_code ~ '^[0-9]{4}$' then
      case
        when postal_code::integer between 0 and 1299 then 'oslo'
        when postal_code::integer between 1300 and 1499 then 'akershus'
        when postal_code::integer between 1500 and 1899 then 'østfold'
        when postal_code::integer between 1900 and 2199 then 'akershus'
        when postal_code::integer between 2200 and 2999 then 'innlandet'
        when postal_code::integer between 3000 and 3069 then 'buskerud'
        when postal_code::integer between 3070 and 3299 then 'vestfold'
        when postal_code::integer between 3300 and 3429 then 'buskerud'
        when postal_code::integer between 3430 and 3499 then 'akershus'
        when postal_code::integer between 3500 and 3669 then 'buskerud'
        when postal_code::integer between 3670 and 3999 then 'telemark'
        when postal_code::integer between 4000 and 4499 then 'rogaland'
        when postal_code::integer between 4500 and 4999 then 'agder'
        when postal_code::integer between 5000 and 5499 then 'vestland'
        when postal_code::integer between 5500 and 5599 then 'rogaland'
        when postal_code::integer between 5600 and 5999 then 'vestland'
        when postal_code::integer between 6000 and 6699 then 'møreogromsdal'
        when postal_code::integer between 6700 and 6999 then 'vestland'
        when postal_code::integer between 7000 and 7999 then 'trøndelag'
        when postal_code::integer between 8000 and 8999 then 'nordland'
        when postal_code::integer between 9000 and 9499 then 'troms'
        when postal_code::integer between 9500 and 9999 then 'finnmark'
      end
    when city = 'oslo' then 'oslo'
  end;
$function$;;
