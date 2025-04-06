export interface TurnImage {
  mimeType: string;
  data: string;
}

export interface Turn {
  text: string;
  image?: TurnImage;
}
