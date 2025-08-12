declare module '@tiptap/extension-youtube' {
  import { Node } from '@tiptap/core'
  const Youtube: Node<any, any>
  export default Youtube
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      setYoutubeVideo: (options: { src: string }) => ReturnType
    }
  }
}
