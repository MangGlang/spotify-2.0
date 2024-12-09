"use client";
import React, { useEffect, useState, useCallback } from "react";
import { BsPauseFill, BsPlayFill } from "react-icons/bs";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { AiFillStepBackward, AiFillStepForward } from "react-icons/ai";
import { Song } from "@/types"; // Assuming Song is defined in your types
import usePlayer from "@/hooks/usePlayer";
import LikeButton from "./LikeButton";
import MediaItem from "./MediaItem"; // Component displaying song information
import Slider from "./Slider"; // Component for volume control
import { createClient } from "@supabase/supabase-js";


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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const VolumeIcon = volume === 0 ? HiSpeakerXMark : HiSpeakerWave;

  // Create audio instance and set up event listeners
  useEffect(() => {
    const audioInstance = new Audio(songUrl);
    audioInstance.volume = volume;

    // Set up audio event listeners
    audioInstance.addEventListener("play", () => setIsPlaying(true));
    audioInstance.addEventListener("pause", () => setIsPlaying(false));
    audioInstance.addEventListener("timeupdate", () =>
      setCurrentTime(audioInstance.currentTime)
    );
    audioInstance.addEventListener("loadedmetadata", () =>
      setDuration(audioInstance.duration)
    );
    audioInstance.addEventListener("ended", onPlayNext); // Add ended event listener

    setAudio(audioInstance);

    // Clean up audio on component unmount
    return () => {
      audioInstance.pause();
      audioInstance.src = "";
      audioInstance.removeEventListener("play", () => setIsPlaying(true));
      audioInstance.removeEventListener("pause", () => setIsPlaying(false));
      audioInstance.removeEventListener("timeupdate", () =>
        setCurrentTime(audioInstance.currentTime)
      );
      audioInstance.removeEventListener("loadedmetadata", () =>
        setDuration(audioInstance.duration)
      );
      audioInstance.removeEventListener("ended", onPlayNext); // Remove ended event listener
    };
  }, [songUrl]);

  // Fetch song details from Supabase
  const fetchSongDetails = async (songId: string) => {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .eq("id", songId)
      .single();

    if (error) {
      console.error("Error fetching song details:", error);
    } else {
      const { title, author, image_path } = data;
      const completeImageUrl = `https://ipjjlddfslhqhkzsdxer.supabase.co/storage/v1/object/public/images/${encodeURIComponent(
        image_path
      )}`;

      setSongDetails({
        title,
        author,
        imageUrl: completeImageUrl,
      });
    }
  };

  const setupMediaSession = useCallback(() => {
    if ("mediaSession" in navigator && songDetails) {
      const artwork: MediaImage[] = songDetails.imageUrl
        ? [{ src: songDetails.imageUrl, sizes: "512x512", type: "image/png" }]
        : [];

      if (artwork.length > 0) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: songDetails.title,
          artist: songDetails.author,
          artwork,
        });
      } else {
        console.warn("No artwork available for media session.");
      }

      // Set action handlers
      navigator.mediaSession.setActionHandler("play", handlePlay);
      navigator.mediaSession.setActionHandler("pause", handlePause);
      navigator.mediaSession.setActionHandler("seekbackward", () => {
        if (audio) {
          audio.currentTime = Math.max(0, audio.currentTime - 10);
        }
      });
      navigator.mediaSession.setActionHandler("seekforward", () => {
        if (audio) {
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
        }
      });
      navigator.mediaSession.setActionHandler("previoustrack", onPlayPrevious);
      navigator.mediaSession.setActionHandler("nexttrack", onPlayNext);
    }
  }, [songDetails, audio]);

  const handlePlay = () => {
    if (audio) {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  };

  const handlePause = () => {
    if (audio) {
      audio.pause();
    }
  };

  const onPlayNext = () => {
    if (player.ids.length === 0) {
      return;
    }

    const currentIndex = player.ids.findIndex((id) => id === player.activeId);
    const nextSong = player.ids[currentIndex + 1];

    if (!nextSong) {
      return player.setId(player.ids[0]);
    }
    player.setId(nextSong);
  };

  const onPlayPrevious = () => {
    if (player.ids.length === 0) {
      return;
    }

    const currentIndex = player.ids.findIndex((id) => id === player.activeId);
    const prevSong = player.ids[currentIndex - 1];

    if (!prevSong) {
      return player.setId(player.ids[player.ids.length - 1]);
    }
    player.setId(prevSong);
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(event.target.value);
    if (audio) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleVolumeChange = (newVolume) => {
    if (audio) {
      audio.volume = newVolume;
    }
    setVolume(newVolume);
  };

  useEffect(() => {
    // Fetch song details when the song prop changes
    // if (song.id) {
    fetchSongDetails(song.id);
    // }
    setupMediaSession();
    console.log(song.id);
  }, [song.id]);

  useEffect(() => {
    if (!audio || !songUrl) {
      console.error("Audio instance or song URL is missing.");
      return;
    }
  
    // Set volume for the audio
    audio.volume = volume;
  
    // Attempt to play the audio when songUrl changes
    const playAudio = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    };
  
    playAudio();
  
    // Sync play/pause state with audio element
    const handlePlaying = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      console.error("Failed to load media resource:", songUrl);
      setIsPlaying(false);
    };
  
    // Add event listeners
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);
  
    // Clean up event listeners when dependencies change or component unmounts
    return () => {
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
  }, [audio, songUrl, volume]);
  

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 h-full">
      <div className="flex w-full justify-start">
        <div className="flex items-center gap-x-4">
          <MediaItem data={song} />
          <LikeButton songId={song.id} />
        </div>
      </div>

      <div className="flex row-auto justify-center items-center flex-col">
        <div className="flex md:hidden col-auto w-full justify-end items-center">
          <div
            onClick={isPlaying ? handlePause : handlePlay}
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
            size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
            onClick={onPlayPrevious}
          />
          <div
            onClick={isPlaying ? handlePause : handlePlay}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-white p-1 cursor-pointer"
          >
            {isPlaying ? (
              <BsPauseFill size={30} className="text-black" />
            ) : (
              <BsPlayFill size={30} className="text-black" />
            )}
          </div>
          <AiFillStepForward
            size={30}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
            onClick={onPlayNext}
          />
        </div>

        <div className="w-full mt-2 flex items-center">
          <span className="text-sm text-white">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="flex-grow mx-4 cursor-pointer slider"
          />
          <span className="text-sm text-white">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="hidden md:flex w-full justify-end pr-2">
        <div className="flex items-center gap-x-2 w-[120px]">
          <VolumeIcon
            onClick={() => setVolume(volume === 0 ? 1 : 0)}
            className="cursor-pointer"
            size={34}
          />
          <Slider
            value={volume}
            onChange={(value) => handleVolumeChange(value)}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerContent;
