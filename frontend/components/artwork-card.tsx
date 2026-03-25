import Image from 'next/image';
import Link from 'next/link';
import type { CatalogArtwork } from '@/lib/types';

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
}

export function ArtworkCard({ artwork }: { artwork: CatalogArtwork }) {
  const href = `/artworks/${artwork.id}`;
  const cover = artwork.images[0]?.url;
  const category = artwork.categories[0]?.name;

  return (
    <Link href={href} className="group flex flex-col bg-card hover-lift gallery-frame">
      {/* Image container with gallery frame effect */}
      <div className="relative aspect-[4/5] bg-secondary overflow-hidden">
        {cover ? (
          <>
            <Image
              src={cover}
              alt={artwork.images[0]?.altText || artwork.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            {/* Subtle overlay on hover */}
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-500" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}

        {/* Quick view indicator */}
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="inline-block px-4 py-2 bg-background/95 backdrop-blur-sm text-foreground text-xs uppercase tracking-wider font-medium">
            View Details
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {artwork.artist.name}
        </p>
        <h3 className="font-serif text-lg font-medium text-foreground leading-snug line-clamp-2 text-balance group-hover:text-accent transition-colors duration-300">
          {artwork.title}
        </h3>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <p className="text-foreground font-medium">
            {formatPrice(artwork.price, artwork.currency)}
          </p>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{category}</span>
        </div>
      </div>
    </Link>
  );
}
