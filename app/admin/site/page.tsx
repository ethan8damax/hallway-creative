import { getAbout, getCategories, getServices, getSiteSettings } from '@/lib/supabase/queries'
import { ActionForm } from '@/components/admin/ActionForm'
import { Field, PageHeader, Panel, inputClass } from '@/components/admin/ui'
import { addService, updateBio, updateSiteSettings } from './actions'
import { PortraitEditor, ServiceList } from './SiteEditors'

export default async function AdminSitePage() {
  const [settings, about, services, categories] = await Promise.all([getSiteSettings(), getAbout(), getServices(), getCategories()])
  const categoryOptions = categories.map((c) => ({ id: c.id, title: c.title }))

  return (
    <div className="max-w-3xl">
      <PageHeader title="Site" description="Everything written on the public site. Changes go live as soon as you save." />

      <div className="flex flex-col gap-6">
        {settings && (
          <Panel title="Homepage & contact">
            <ActionForm action={updateSiteSettings.bind(null, settings.id)}>
              <Field label="Headline" hint="The big line over the photo at the top of the homepage.">
                <input name="hero_headline" defaultValue={settings.hero_headline ?? ''} className={inputClass} />
              </Field>
              <Field label="Intro line" hint="Shown under the photo, in large type. One or two sentences.">
                <textarea name="hero_subtext" rows={2} defaultValue={settings.hero_subtext ?? ''} className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Public email" hint="Shown in the footer and on the contact page.">
                  <input name="contact_email" type="email" defaultValue={settings.contact_email ?? ''} className={inputClass} />
                </Field>
                <Field label="Instagram link">
                  <input name="instagram_url" type="url" placeholder="https://instagram.com/…" defaultValue={settings.instagram_url ?? ''} className={inputClass} />
                </Field>
              </div>
            </ActionForm>
          </Panel>
        )}

        {about && (
          <Panel title="About">
            <div className="flex flex-col gap-6">
              <Field label="Portrait">
                <PortraitEditor aboutId={about.id} initialUrl={about.portrait_url} />
              </Field>
              <ActionForm action={updateBio.bind(null, about.id)}>
                <Field label="Bio" hint="Leave a blank line between paragraphs. The first paragraph also appears on the homepage.">
                  <textarea name="bio" rows={8} defaultValue={about.bio ?? ''} className={inputClass} />
                </Field>
              </ActionForm>
            </div>
          </Panel>
        )}

        <Panel title="Services" description="Shown in this order on the services page.">
          <ServiceList key={services.map((s) => s.id).join()} initial={services} categories={categoryOptions} />
          <details className="group mt-6 rounded-md border border-dashed border-border">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink">
              <span className="mr-2 inline-block transition-transform group-open:rotate-45">+</span>
              Add a service
            </summary>
            <div className="border-t border-border p-4">
              <ActionForm action={addService} submitLabel="Add service" resetOnSuccess>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <input name="title" required placeholder="e.g. Portrait Sessions" className={inputClass} />
                  </Field>
                  <Field label="Links to portfolio category">
                    <select name="category_id" defaultValue="" className={inputClass}>
                      <option value="">None</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Description">
                  <textarea name="description" required rows={3} className={inputClass} />
                </Field>
              </ActionForm>
            </div>
          </details>
        </Panel>
      </div>
    </div>
  )
}
