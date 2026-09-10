import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'mediaItem',
  title: 'Media Item',
  type: 'document',
  fields: [
    defineField({ name: 'category', title: 'Category', type: 'reference', to: [{ type: 'category' }], validation: (Rule) => Rule.required() }),
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: { list: [{ title: 'Image', value: 'image' }, { title: 'Video', value: 'video' }] },
      initialValue: 'image',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'image', title: 'Image', type: 'image', hidden: ({ parent }) => parent?.mediaType !== 'image' }),
    defineField({ name: 'videoUrl', title: 'Video URL (Vimeo or YouTube)', type: 'url', hidden: ({ parent }) => parent?.mediaType !== 'video' }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 0 }),
  ],
})
