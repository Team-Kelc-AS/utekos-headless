'use client'

import { FacebookLoginChoices } from '@/components/facebook-login/FacebookLoginChoices'

export function IdentityLoginPreview() {
  return (
    <FacebookLoginChoices
      buttonWidth={400}
      buttonContainerRef={{ current: null }}
      buttonRendered={false}
      loginUnavailable={false}
      onContinueWithoutFacebook={() => undefined}
      pending={false}
      sdkReady={false}
      visualPreview
    />
  )
}
