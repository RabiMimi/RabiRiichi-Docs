import React, {type ReactNode} from 'react';
import styles from './styles.module.css';

/**
 * Base URL of the tile-rendering service. It turns RabiRiichi tile notation
 * (e.g. `123m456p789s11z`, `r5p`, `-234p`, `x11xs`) into an image, so docs can
 * show real hands without shipping any tile art.
 */
const TILE_SERVICE = 'https://mj.ero.fyi';

export interface TilesProps {
  /**
   * RabiRiichi tile notation. Segments are separated by `+` and map to
   * hand / called melds / winning tile, e.g. `11222333s22456m+4s`.
   * See the "Tile notation" doc for the full grammar.
   */
  notation: string;
  /** Optional alt text; defaults to the notation itself. */
  alt?: string;
  /** Optional caption rendered under the tiles. */
  caption?: ReactNode;
  /** Render inline (baseline-aligned) instead of as a block. */
  inline?: boolean;
}

/**
 * Renders a mahjong hand from RabiRiichi tile notation via the shared tile
 * image service. Use it in MDX like:
 *
 * ```mdx
 * <Tiles notation="123m456p789s11z" />
 * <Tiles notation="11222333s22456m+4s" caption="Iipeikou, winning on 4s" />
 * ```
 */
export default function Tiles({
  notation,
  alt,
  caption,
  inline = false,
}: TilesProps): ReactNode {
  const src = `${TILE_SERVICE}/${encodeURI(notation)}`;
  const img = (
    <img
      className={styles.tiles}
      src={src}
      alt={alt ?? notation}
      loading="lazy"
    />
  );

  if (inline) {
    return img;
  }

  return (
    <figure className={styles.figure}>
      {img}
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
