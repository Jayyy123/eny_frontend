declare module 'react-syntax-highlighter' {
  import { ComponentType } from 'react';
  
  export const Prism: ComponentType<any>;
  export const Light: ComponentType<any>;
  export default ComponentType<any>;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const oneDark: any;
  export const oneLight: any;
  export const tomorrow: any;
  export const twilight: any;
  export const prism: any;
}
