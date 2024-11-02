"use client";

import Image from "next/image";

import useLoadImage from "@/hooks/useLoadImage";
import { Song } from "@/types";

import PlayButton from "./PlayButton";

interface SongItemProps {
  data: Song;
  onClick: (id: string) => void;
}

const SongItem: React.FC<SongItemProps> = ({ data, onClick }) => {
  const imagePath = useLoadImage(data);

  return (
    <div
      onClick={() => onClick(data.id)}
      className="
        relative 
        group 
        flex 
        flex-col 
        items-center 
        justify-center 
        rounded-md 
        overflow-hidden 
        gap-x-4 
        bg-neutral-400/5 
        cursor-pointer 
        hover:bg-neutral-400/10 
        transition 
        p-3
      "
    >
      <div
        className="
          relative 
          aspect-square 
          w-full
          h-full 
          rounded-md 
          overflow-hidden
        "
      >
        <Image
          className="object-cover"
          src={imagePath || "/images/music-placeholder.png"}
          fill
          alt="Image"
        />
      </div>
      <div className="flex flex-col items-start w-full pt-4 gap-y-1">
        <div className="w-full overflow-hidden">
          <p
            className={`font-semibold ${
              data.title.length > 15 ? "scroll-text" : ""
            }`}
            style={{ width: "100%" }}
          >
            {data.title}
          </p>
        </div>
        <div className="w-full overflow-hidden">
          <p
            className={`text-neutral-400 text-sm pb-4 ${
              data.author.length > 15 ? "scroll-text" : ""
            }`}
            style={{ width: "100%" }}
          >
            By {data.author}
          </p>
        </div>
      </div>

      <div
        className="
          absolute 
          bottom-24 
          right-5
        "
      >
        <PlayButton />
      </div>
    </div>
  );
};

export default SongItem;
