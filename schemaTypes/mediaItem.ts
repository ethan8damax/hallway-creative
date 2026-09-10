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
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      hidden: ({ parent }) => parent?.mediaType !== 'image',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { mediaType?: string } | undefined
          if (parent?.mediaType === 'image' && !value) return 'Image is required when Media Type is Image'
          return true
        }),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL (Vimeo or YouTube)',
      type: 'url',
      hidden: ({ parent }) => parent?.mediaType !== 'video',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { mediaType?: string } | undefined
          if (parent?.mediaType === 'video' && !value) return 'Video URL is required when Media Type is Video'
          return true
        }),
    }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'order', title: 'Display Order', type: 'number', initialValue: 0 }),
  ],
})
