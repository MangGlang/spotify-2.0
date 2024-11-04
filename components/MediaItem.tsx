"use client";

import Image from "next/image";
import useLoadImage from "@/hooks/useLoadImage";
import { Song } from "@/types";
import usePlayer from "@/hooks/usePlayer";

interface MediaItemProps {
  data: Song;
  isCurrent: boolean; // New prop to indicate if this is the current song
  onClick?: (id: string) => void;
}

// Utility function to truncate strings to a maximum of 26 characters
const truncateString = (str: string, maxLength: number) => {
  return str.length > maxLength ? `${str.slice(0, maxLength - 3)}...` : str;
};

const MediaItem: React.FC<MediaItemProps> = ({ data, isCurrent, onClick }) => {
  const player = usePlayer();
  const imageUrl = useLoadImage(data);

  const handleClick = () => {
    if (onClick) {
      return onClick(data.id);
    }

    return player.setId(data.id);
  };

  // Truncate title and author to a maximum of 26 characters
  const truncatedTitle = truncateString(data.title, 26);
  const truncatedAuthor = truncateString(`By ${data.author}`, 26);

  return (
    <div
      onClick={handleClick}
      className="
        flex 
        items-center 
        gap-x-3 
        cursor-pointer 
        hover:bg-neutral-800/50 
        w-full 
        p-2 
        rounded-md
      "
    >
      <div
        className="
          relative 
          rounded-md 
          min-h-[48px] 
          min-w-[48px] 
          overflow-hidden
        "
      >
        <Image
          fill
          src={imageUrl || "/images/music-placeholder.png"}
          alt="MediaItem"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-y-1 overflow-hidden">
        <div className="scroll-container">
          <p className={`text-white ${isCurrent ? 'scroll-text' : ''}`}>
            {truncatedTitle}
          </p>
        </div>
        <div className="scroll-container">
          <p className={`text-neutral-400 text-sm ${isCurrent ? 'scroll-text' : ''}`}>
            {truncatedAuthor}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MediaItem;
