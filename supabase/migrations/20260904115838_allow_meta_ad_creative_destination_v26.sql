begin;

set local lock_timeout = '5s';

alter table marketing.meta_ad_creative_destinations
  drop constraint meta_ad_creative_destinations_api_version_check;

alter table marketing.meta_ad_creative_destinations
  alter column api_version set default 'v26.0';

alter table marketing.meta_ad_creative_destinations
  add constraint meta_ad_creative_destinations_api_version_check
  check (api_version in ('v25.0', 'v26.0')) not valid;

alter table marketing.meta_ad_creative_destinations
  validate constraint meta_ad_creative_destinations_api_version_check;

comment on table marketing.meta_ad_creative_destinations is
  'Read-only Meta Marketing API creative-destination observations. api_version preserves the provider version used for each observation; observed periods prove configuration visibility, not the exact URL delivered for an impression or click.';

commit;
