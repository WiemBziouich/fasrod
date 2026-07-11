export type CollectionChip = {
  label: string;
  tone: string;
};

export type FeedCard = {
  title: string;
  subtitle: string;
  label: string;
  gradient: string;
};

export type FitItem = {
  name: string;
  type: string;
  price: string;
};

export const collections: CollectionChip[] = [
  { label: "New Drop", tone: "bg-surface2 text-text" },
  { label: "Streetwear", tone: "bg-surface2 text-text" },
  { label: "Y2K", tone: "bg-surface2 text-text" },
  { label: "Basketball", tone: "bg-surface2 text-text" },
  { label: "Girls", tone: "bg-surface2 text-text" },
  { label: "Boys", tone: "bg-surface2 text-text" },
];

export const feedCards: FeedCard[] = [
  {
    title: "Oversized tee, clean fit",
    subtitle: "Trending now among the first drop buyers.",
    label: "Video",
    gradient: "bg-surface",
  },
  {
    title: "Y2K jersey energy",
    subtitle: "Styled for warm evenings and city walks.",
    label: "Seen on Instagram",
    gradient: "bg-surface",
  },
  {
    title: "Baggy denim layer",
    subtitle: "Made for stacked silhouettes and loose cuts.",
    label: "New Drop",
    gradient: "bg-surface",
  },
];

export const fitRail: FitItem[] = [
  { name: "Heavy tee", type: "T-shirt", price: "69 DT" },
  { name: "Track hoodie", type: "Hoodie", price: "129 DT" },
  { name: "Cargo shorts", type: "Short", price: "89 DT" },
  { name: "Wide jeans", type: "Jean", price: "149 DT" },
];
