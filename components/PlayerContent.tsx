"use client";
import React, { useEffect, useState, useCallback } from "react";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import { Song } from "@/types";
import usePlayer from "@/hooks/usePlayer";
import LikeButton from "./LikeButton";
import MediaItem from "./MediaItem";
import Slider from "./Slider";
import { createClient } from "@supabase/supabase-js";
import useSound from "use-sound";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PlayerContentProps {
  song: Song; // Currently playing song
  songUrl: string; // URL of the currently playing song
}

const PlayerContent: React.FC<PlayerContentProps> = ({ song, songUrl }) => {
  const player = usePlayer();
  const [volume, setVolume] = useState(0.2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [songDetails, setSongDetails] = useState<any>(null);
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;


  // Function to fetch song details from Supabase
  const fetchSongDetails = async (songId: string) => {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .eq("id", songId)
      .single();

    if (error) {
      console.error("Error fetching song details:", error);
      return null; // Return null if there's an error
    }

    // Extract the relevant details and return them
    const { title, author, image_path } = data;
    const completeImageUrl = `https://ipjjlddfslhqhkzsdxer.supabase.co/storage/v1/object/public/images/${encodeURIComponent(
      image_path
    )}`;

    return {
      title,
      author,
      imageUrl: completeImageUrl,
    };
  };

  const setupMediaSession = useCallback(
    (songDetails) => {
      if ("mediaSession" in navigator && songDetails) {
        const artwork: MediaImage[] = songDetails.imageUrl
          ? [{ src: songDetails.imageUrl, sizes: "512x512", type: "image/png" }]
          : [];

        navigator.mediaSession.metadata = new MediaMetadata({
          title: songDetails.title,
          artist: songDetails.author,
          artwork,
        });

        // Set action handlers
        navigator.mediaSession.setActionHandler("play", handlePlay);
        navigator.mediaSession.setActionHandler(
          "previoustrack",
          onPlayPrevious
        );
        navigator.mediaSession.setActionHandler("nexttrack", onPlayNext);
      }
    },
    [audio]
  );

  const handlePlay = () => {
    if (!isPlaying) play();
    else pause();
  };


  const toggleMute = () => {
    setVolume(volume === 0 ? 1 : 0);
  };

  const onPlayNext = () => {
    if (player.ids.length === 0) return;

    const currentIndex = player.ids.findIndex((id) => id === player.activeId);
    const nextSong = player.ids[currentIndex + 1];

    if (!nextSong) {
      return player.setId(player.ids[0]); // Loop back to the first song
    }
    player.setId(nextSong); // Set to next song
  };

  const onPlayPrevious = () => {
    if (player.ids.length === 0) return;

    const currentIndex = player.ids.findIndex((id) => id === player.activeId);
    const prevSong = player.ids[currentIndex - 1];

    if (!prevSong) {
      return player.setId(player.ids[player.ids.length - 1]); // Loop to last song
    }
    player.setId(prevSong); // Set to previous song
  };

  useEffect(() => {
    const loadSongData = async () => {
      const data = await fetchSongDetails(song.id);
      if (data) {
        setSongDetails(data);
        setupMediaSession(data); // Set up the media session with fetched song data
      } else {
        // If there's no data, set up with hardcoded values for testing
        setupMediaSession({
          title: "Test Song Title",
          author: "Test Artist",
          imageUrl: "https://via.placeholder.com/512", // Example image URL
        });
      }
    };

    loadSongData();
  }, [song.id, setupMediaSession]);

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

  useEffect(() => {
    sound?.play();
    return () => sound?.unload();
  }, [sound]);

  useEffect(() => {
    const audioInstance = new Audio(songUrl);
    audioInstance.volume = volume;

    // Set up audio event listeners
    audioInstance.addEventListener("play", () => setIsPlaying(true));
    audioInstance.addEventListener("pause", () => setIsPlaying(false));

    setAudio(audioInstance);

    return () => {
      audioInstance.pause();
      audioInstance.src = "";
      audioInstance.removeEventListener("play", () => setIsPlaying(true));
      audioInstance.removeEventListener("pause", () => setIsPlaying(false));
    };
  }, [songUrl, volume]);

  useEffect(() => {
    if (audio) {
      // Sync play/pause state with audio element
      audio.onplaying = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
    }
  }, [audio]);

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
          {isPlaying ? (
            <BsPauseFill size={30} className="text-black" />
          ) : (
            <BsPlayFill size={30} className="text-black" />
          )}
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
          {isPlaying ? (
            <BsPauseFill size={30} className="text-black" />
          ) : (
            <BsPlayFill size={30} className="text-black" />
          )}
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
