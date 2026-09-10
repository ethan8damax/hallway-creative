function matchesHost(hostname: string, host: string): boolean {
  return hostname === host || hostname.endsWith(`.${host}`)
}

export function getVideoEmbedUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (matchesHost(parsed.hostname, 'youtube.com') || matchesHost(parsed.hostname, 'youtu.be')) {
    const videoId = matchesHost(parsed.hostname, 'youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v')
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  if (matchesHost(parsed.hostname, 'vimeo.com')) {
    const videoId = parsed.pathname.split('/').filter(Boolean).pop()
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null
  }

  return null
}
