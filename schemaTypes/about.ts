import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'about',
  title: 'About Page',
  type: 'document',
  fields: [
    defineField({ name: 'bio', title: 'Bio', type: 'text', validation: (Rule) => Rule.required() }),
    defineField({ name: 'portrait', title: 'Portrait Photo', type: 'image' }),
  ],
})
