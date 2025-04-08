declare module 'react-draft-wysiwyg' {
    import { Component } from 'react';
    import { EditorState } from 'draft-js';
    
    export interface EditorProps {
      editorState: EditorState;
      onEditorStateChange: (editorState: EditorState) => void;
      toolbar?: any;
      editorClassName?: string;
      wrapperClassName?: string;
      toolbarClassName?: string;
      placeholder?: string;
      [key: string]: any;
    }
    
    export class Editor extends Component<EditorProps> {}
  }