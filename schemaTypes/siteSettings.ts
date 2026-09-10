import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'heroHeadline', title: 'Hero Headline', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'heroSubtext', title: 'Hero Subtext', type: 'text' }),
    defineField({ name: 'contactEmail', title: 'Contact Email', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'instagramUrl', title: 'Instagram URL', type: 'url' }),
  ],
})
