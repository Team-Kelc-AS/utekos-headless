alter table marketing.meta_ad_creative_destinations
  drop constraint if exists meta_ad_creative_destinations_api_version_check;

alter table marketing.meta_ad_creative_destinations
  alter column api_version set default 'v26.0';

alter table marketing.meta_ad_creative_destinations
  add constraint meta_ad_creative_destinations_api_version_check
  check (api_version ~ '^v[0-9]+\.[0-9]+$');
