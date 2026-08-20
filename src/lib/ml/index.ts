export type {
  FashionDNA,
  FashionCategory,
  ProductEmbeddingRow,
} from "./types";
export {
  STYLE_TWIN_MIN_SCORE,
  STYLE_TWIN_EMBEDDING_MODEL,
  fashionDnaToEmbedText,
  productRowToFashionDna,
  dnaMatchReasons,
} from "./types";
export { cosineSimilarity, similarityToPercent, blendScore } from "./similarity";
export { embedText, isEmbeddingsConfigured } from "./embeddings";
export { extractFashionDnaFromImage, extractFashionDnaFromText } from "./fashion-dna";
export { runStyleTwin, indexProductsFromMetadata } from "./style-twin";
export type { StyleTwinMatch, StyleTwinResult } from "./style-twin";
export { countProductEmbeddings } from "./product-embeddings-db";
