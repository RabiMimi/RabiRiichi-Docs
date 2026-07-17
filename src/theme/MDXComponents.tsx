import MDXComponents from '@theme-original/MDXComponents';
import Tiles from '@site/src/components/Tiles';

// Register <Tiles> globally so every .md/.mdx doc can render mahjong hands
// from RabiRiichi tile notation without an explicit import.
export default {
  ...MDXComponents,
  Tiles,
};
