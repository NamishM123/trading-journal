import { youtubeId } from "@/lib/format";

export function YouTubeEmbed({ url }: { url: string | null | undefined }) {
  const id = youtubeId(url);
  if (!id) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="relative aspect-video">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title="Trade recap video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
