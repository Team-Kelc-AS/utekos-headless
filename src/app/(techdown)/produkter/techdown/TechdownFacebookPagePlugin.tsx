'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './TechdownContent.module.css'

const MIN_PLUGIN_WIDTH = 180
const MAX_PLUGIN_WIDTH = 500
const MOBILE_BREAKPOINT_PX = 768
/** Portrait timeline embed on narrow viewports. */
const MOBILE_PLUGIN_ASPECT_RATIO = 9 / 16
/** Wider timeline embed from md and up. */
const DESKTOP_PLUGIN_ASPECT_RATIO = 5 / 7

function clampPluginWidth(width: number) {
  return Math.min(
    MAX_PLUGIN_WIDTH,
    Math.max(MIN_PLUGIN_WIDTH, Math.round(width))
  )
}

function pluginAspectRatio(viewportWidth: number) {
  return viewportWidth < MOBILE_BREAKPOINT_PX ?
      MOBILE_PLUGIN_ASPECT_RATIO
    : DESKTOP_PLUGIN_ASPECT_RATIO
}

function buildPluginSrc(
  pageUrl: string,
  width: number,
  aspectRatio: number
) {
  const height = Math.round(width / aspectRatio)

  return {
    aspectRatio,
    height,
    src: `https://www.facebook.com/plugins/page.php?${new URLSearchParams(
      {
        href: pageUrl,
        tabs: 'timeline',
        width: String(width),
        height: String(height),
        small_header: 'false',
        adapt_container_width: 'true',
        hide_cover: 'false',
        show_facepile: 'true'
      }
    ).toString()}`,
    width
  }
}

export function TechdownFacebookPagePlugin({
  pageUrl
}: {
  pageUrl: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [plugin, setPlugin] = useState(() =>
    buildPluginSrc(
      pageUrl,
      MAX_PLUGIN_WIDTH,
      DESKTOP_PLUGIN_ASPECT_RATIO
    )
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function syncPlugin() {
      if (!container) return
      const nextWidth = clampPluginWidth(
        container.getBoundingClientRect().width
      )
      const nextAspectRatio = pluginAspectRatio(window.innerWidth)
      setPlugin(current => {
        if (
          current.width === nextWidth &&
          current.aspectRatio === nextAspectRatio
        ) {
          return current
        }
        return buildPluginSrc(pageUrl, nextWidth, nextAspectRatio)
      })
    }

    syncPlugin()

    window.addEventListener('resize', syncPlugin)

    if (typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', syncPlugin)
    }

    const observer = new ResizeObserver(syncPlugin)
    observer.observe(container)
    return () => {
      window.removeEventListener('resize', syncPlugin)
      observer.disconnect()
    }
  }, [pageUrl])

  return (
    <div
      ref={containerRef}
      className={styles.facebookPagePlugin}
      style={{
        aspectRatio: `${plugin.width} / ${plugin.height}`,
        minHeight: plugin.height
      }}
    >
      <iframe
        title='Utekos på Facebook'
        src={plugin.src}
        width={plugin.width}
        height={plugin.height}
        className={styles.facebookPageIframe}
        allow='autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share'
        allowFullScreen
        loading='lazy'
      />
    </div>
  )
}
