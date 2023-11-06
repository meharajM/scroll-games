export interface Game {
  unityLoaderJsPath: string;
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  id: string;
  
  // Add other properties as needed
}
export type Message = {
  controller: string,
  method: string,
  value?: string | number;
}