export function getVideoEmbedUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
    const videoId = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v')
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  if (parsed.hostname.includes('vimeo.com')) {
    const videoId = parsed.pathname.split('/').filter(Boolean).pop()
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null
  }

  return null
}
