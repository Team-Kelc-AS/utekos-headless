import type { CanonicalEventEnvelope } from '../canonicalEventEnvelope'
import { buildMicrosoftUetCapiUserData } from './microsoftUetCapiUserData'

type MicrosoftUetIdentitySource = Pick<
  CanonicalEventEnvelope,
  | 'browser_id'
  | 'click_id'
  | 'client_ip_address'
  | 'event_device_info'
  | 'external_id'
  | 'user_data'
>

export function hasMicrosoftUetCapiIdentifier(
  event: MicrosoftUetIdentitySource
) {
  try {
    buildMicrosoftUetCapiUserData(event)
    return true
  } catch {
    return false
  }
}
