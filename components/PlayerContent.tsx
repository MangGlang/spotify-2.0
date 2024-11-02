"use client";
import { useEffect, useState } from "react";
import useSound from "use-sound";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";

import { Song } from "@/types";
import usePlayer from "@/hooks/usePlayer";
import LikeButton from "./LikeButton";
import MediaItem from "./MediaItem";
import Slider from "./Slider";
import { useSessionContext } from "@supabase/auth-helpers-react";
const { supabaseClient } = useSessionContext();

interface PlayerContentProps {
  song: Song;
  songUrl: string;
}

const PlayerContent: React.FC<PlayerContentProps> = ({ song, songUrl }) => {
  const player = usePlayer();
  const [volume, setVolume] = useState(0.2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songData, setSongData] = useState(null);

  const Icon = isPlaying ? BsPauseFill : BsPlayFill;
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  const onPlayNext = () => {
    if (player.ids.length === 0) return;
    const currentIndex = player.ids.findIndex((id) => id === player.activeId);
    const nextSong = player.ids[currentIndex + 1];
    player.setId(nextSong || player.ids[0]);
  };

  const onPlayPrevious = () => {
    if (player.ids.length === 0) return;
    const currentIndex = player.ids.findIndex((id) => id === player.activeId);
    const previousSong = player.ids[currentIndex - 1];
    player.setId(previousSong || player.ids[player.ids.length - 1]);
  };

  const [play, { pause, sound }] = useSound(songUrl, {
    volume,
    onplay: () => setIsPlaying(true),
    onend: () => {
      setIsPlaying(false);
      onPlayNext();
    },
    onpause: () => setIsPlaying(false),
    format: ["mp3"],
  });

  const handlePlay = () => {
    if (!isPlaying) play();
    else pause();
  };

  const toggleMute = () => {
    setVolume(volume === 0 ? 1 : 0);
  };

  useEffect(() => {
    const loadSongData = async () => {
      const data = await fetchSongData(song.id);
      if (data) {
        setSongData(data);
        setupMediaSession(data);
      }
    };

    loadSongData();
  }, [song.id]);

  const setupMediaSession = (data) => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: data.title,
        artist: data.artist, // Ensure this field is available in song data
        album: data.album || "Unknown Album", // Optional album field
        artwork: [{ src: data.imageUrl, sizes: "512x512", type: "image/png" }],
      });

      navigator.mediaSession.setActionHandler("play", handlePlay);
      navigator.mediaSession.setActionHandler("pause", handlePlay);
      navigator.mediaSession.setActionHandler("previoustrack", onPlayPrevious);
      navigator.mediaSession.setActionHandler("nexttrack", onPlayNext);
    }
  };

  const fetchSongData = async (songId) => {
    // Fetch song metadata from the "songs" bucket
    const { data: songData, error: songError } = await supabaseClient
      .from("songs")
      .select("*")
      .eq("id", songId)
      .single();

    if (songError || !songData) {
      console.error("Error fetching song metadata:", songError);
      return null;
    }

    // Fetch the image URL from the "images" bucket
    const { data: imageData, error: imageError } = await supabaseClient.storage
      .from("images")
      .download(songData.image_path); // Assuming `image_path` is the key in the "songs" bucket for the image file path

    if (imageError || !imageData) {
      console.error("Error fetching song image:", imageError);
      return null;
    }

    // Generate a public URL for the image file
    const imageUrl = supabaseClient.storage
      .from("images")
      .getPublicUrl(songData.image_path).data.publicUrl;

    // Combine song metadata and image URL
    return {
      ...songData,
      imageUrl,
    };
  };

  useEffect(() => {
    sound?.play();
    return () => sound?.unload();
  }, [sound]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full">
      <div className="flex w-full justify-start">
        <div className="flex items-center gap-x-4">
          <MediaItem data={song} />
          <LikeButton songId={song.id} />
        </div>
      </div>

      <div className="flex md:hidden col-auto w-full justify-end items-center">
        <div
          onClick={handlePlay}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white p-1 cursor-pointer"
        >
          <Icon size={30} className="text-black" />
        </div>
      </div>

      <div className="hidden h-full md:flex justify-center items-center w-full max-w-[722px] gap-x-6">
        <AiFillStepBackward
          onClick={onPlayPrevious}
          size={30}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
        <div
          onClick={handlePlay}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-white p-1 cursor-pointer"
        >
          <Icon size={30} className="text-black" />
        </div>
        <AiFillStepForward
          onClick={onPlayNext}
          size={30}
          className="text-neutral-400 cursor-pointer hover:text-white transition"
        />
      </div>

      <div className="hidden md:flex w-full justify-end pr-2">
        <div className="flex items-center gap-x-2 w-[120px]">
          <VolumeIcon
            onClick={toggleMute}
            className="cursor-pointer"
            size={34}
          />
          <Slider value={volume} onChange={(value) => setVolume(value)} />
        </div>
      </div>
    </div>
  );
};

export default PlayerContent;
