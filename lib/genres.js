export const GENRES = [
  { label: 'Action', slug: 'action', color: '#E85D3D', color2: '#FF8A5B', icon: 'fa-solid fa-burst', tmdbId: 28, tmdbIdTv: 10759 },
  { label: 'Drama', slug: 'drama', color: '#3D8AE8', color2: '#5BA8FF', icon: 'fa-solid fa-masks-theater', tmdbId: 18, tmdbIdTv: 18 },
  { label: 'Horror', slug: 'horror', color: '#8B3DE8', color2: '#B15BFF', icon: 'fa-solid fa-skull', tmdbId: 27 },
  { label: 'Comedy', slug: 'comedy', color: '#E8C83D', color2: '#FFE45B', icon: 'fa-solid fa-face-laugh', tmdbId: 35, tmdbIdTv: 35 },
  { label: 'Thriller', slug: 'thriller', color: '#3DE8A8', color2: '#5BFFC4', icon: 'fa-solid fa-heart-pulse', tmdbId: 53 },
  { label: 'Romance', slug: 'romance', color: '#E83D8A', color2: '#FF5BA8', icon: 'fa-solid fa-heart', tmdbId: 10749 },
  { label: 'Sci-Fi', slug: 'sci-fi', color: '#3DBBE8', color2: '#5BD4FF', icon: 'fa-solid fa-rocket', tmdbId: 878, tmdbIdTv: 10765 },
  { label: 'Animasi', slug: 'animasi', color: '#E8823D', color2: '#FFA65B', icon: 'fa-solid fa-wand-magic-sparkles', tmdbId: 16, tmdbIdTv: 16 },
  { label: 'Fantasy', slug: 'fantasy', color: '#A03DE8', color2: '#C15BFF', icon: 'fa-solid fa-hat-wizard', tmdbId: 14 },
  { label: 'Crime', slug: 'crime', color: '#C83D3D', color2: '#E85B5B', icon: 'fa-solid fa-handcuffs', tmdbId: 80, tmdbIdTv: 80 },
  { label: 'Adventure', slug: 'adventure', color: '#3DE85D', color2: '#5BFF7A', icon: 'fa-solid fa-map-location-dot', tmdbId: 12 },
  { label: 'Family', slug: 'family', color: '#E8E83D', color2: '#F5FF5B', icon: 'fa-solid fa-people-roof', tmdbId: 10751 },
  { label: 'War', slug: 'war', color: '#8A8A8A', color2: '#ABABAB', icon: 'fa-solid fa-person-military-rifle', tmdbId: 10752 },
  { label: 'Music', slug: 'music', color: '#E83DB8', color2: '#FF5BD4', icon: 'fa-solid fa-music', tmdbId: 10402 },
  { label: 'Documentary', slug: 'documentary', color: '#3DE8D8', color2: '#5BFFF0', icon: 'fa-solid fa-clapperboard', tmdbId: 99, tmdbIdTv: 99 },
  { label: 'Mystery', slug: 'mystery', color: '#5D3DE8', color2: '#7D5BFF', icon: 'fa-solid fa-magnifying-glass', tmdbId: 9648, tmdbIdTv: 9648 },
  { label: 'History', slug: 'history', color: '#B8863D', color2: '#D9A75B', icon: 'fa-solid fa-landmark', tmdbId: 36 },
  { label: 'Western', slug: 'western', color: '#8A6A3D', color2: '#AB8B5B', icon: 'fa-solid fa-hat-cowboy', tmdbId: 37, tmdbIdTv: 37 },
  { label: 'Aksi & Petualangan', slug: 'aksi-petualangan', color: '#E85D6B', color2: '#FF7A8A', icon: 'fa-solid fa-explosion', tmdbIdTv: 10759 },
  { label: 'Anak-Anak', slug: 'anak-anak', color: '#3DD8E8', color2: '#5BF0FF', icon: 'fa-solid fa-child-reaching', tmdbIdTv: 10762 },
  { label: 'Berita', slug: 'berita', color: '#5D6A7A', color2: '#7D8A9A', icon: 'fa-solid fa-newspaper', tmdbIdTv: 10763 },
  { label: 'Reality', slug: 'reality', color: '#E8983D', color2: '#FFB85B', icon: 'fa-solid fa-video', tmdbIdTv: 10764 },
  { label: 'Sci-Fi & Fantasy', slug: 'scifi-fantasy', color: '#6A3DE8', color2: '#8B5BFF', icon: 'fa-solid fa-meteor', tmdbIdTv: 10765 },
  { label: 'Sinetron', slug: 'sinetron', color: '#E83D5D', color2: '#FF5B7A', icon: 'fa-solid fa-tv', tmdbIdTv: 10766 },
  { label: 'Talk Show', slug: 'talk-show', color: '#3DE87D', color2: '#5BFF9A', icon: 'fa-solid fa-microphone-lines', tmdbIdTv: 10767 },
  { label: 'Perang & Politik', slug: 'perang-politik', color: '#7A7A3D', color2: '#9B9B5B', icon: 'fa-solid fa-scale-balanced', tmdbIdTv: 10768 },
];

export function findGenre(slug) {
  return GENRES.find((g) => g.slug === String(slug).toLowerCase());
}

export function genreIdFor(g, type) {
  return type === 'tv' && g.tmdbIdTv != null ? g.tmdbIdTv : g.tmdbId;
}
