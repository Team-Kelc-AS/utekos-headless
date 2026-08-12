// Path: src/api/constants/monitoring.ts

export const MARKETING_CONFIG = {
  utm_params: [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term'
  ],
  fbclid_param: 'fbclid',
  fbc_param: 'fbc',
  email_param: 'email',
  additional_params: [
    'gclid',
    'msclkid',
    'gbraid',
    'wbraid',
    'dclid'
  ],
  cookie_max_age: 30 * 24 * 60 * 60,
  cookie_path: '/',
  cookie_domain: process.env.COOKIE_DOMAIN,
  json_cookie_name: 'marketing_params',
  email_hash_cookie_name: 'email_hash',
  fbc_cookie_name: '_fbc'
}

export const GA_MEASUREMENT_ID = 'G-FCES3L0M9M'
