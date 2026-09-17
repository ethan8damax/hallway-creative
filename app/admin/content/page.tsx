import { getSiteSettings, getAbout } from '@/lib/supabase/queries'
import { updateSiteSettings, updateAbout } from './actions'

export default async function AdminContentPage() {
  const [settings, about] = await Promise.all([getSiteSettings(), getAbout()])

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="font-display text-2xl">Site content</h2>
        <form
          action={async (formData) => {
            'use server'
            await updateSiteSettings(settings!.id, {
              hero_headline: formData.get('hero_headline') as string,
              hero_subtext: formData.get('hero_subtext') as string,
              contact_email: formData.get('contact_email') as string,
              instagram_url: formData.get('instagram_url') as string,
            })
          }}
          className="mt-4 flex max-w-xl flex-col gap-4"
        >
          <input name="hero_headline" defaultValue={settings?.hero_headline ?? ''} placeholder="Hero headline" className="border-b border-border bg-transparent py-2" />
          <textarea name="hero_subtext" defaultValue={settings?.hero_subtext ?? ''} placeholder="Hero subtext" className="border-b border-border bg-transparent py-2" />
          <input name="contact_email" defaultValue={settings?.contact_email ?? ''} placeholder="Contact email" className="border-b border-border bg-transparent py-2" />
          <input name="instagram_url" defaultValue={settings?.instagram_url ?? ''} placeholder="Instagram URL" className="border-b border-border bg-transparent py-2" />
          <button type="submit" className="w-fit rounded-xs bg-tally px-6 py-3 font-semibold text-on-accent">
            Save
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-display text-2xl">About</h2>
        <form
          action={async (formData) => {
            'use server'
            await updateAbout(about!.id, {
              bio: formData.get('bio') as string,
              portrait_url: about?.portrait_url ?? null,
            })
          }}
          className="mt-4 flex max-w-xl flex-col gap-4"
        >
          <textarea name="bio" defaultValue={about?.bio ?? ''} placeholder="Bio" rows={6} className="border-b border-border bg-transparent py-2" />
          <button type="submit" className="w-fit rounded-xs bg-tally px-6 py-3 font-semibold text-on-accent">
            Save
          </button>
        </form>
      </section>
    </div>
  )
}
