'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, Loader2 } from 'lucide-react';

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

interface VideoPlayerProps {
    videoId: string;
    onProgress: (seconds: number, total: number) => void;
    onComplete: () => void;
    onStop: (seconds: number, total: number) => void;
    initialStartTime?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoId,
    onProgress,
    onComplete,
    onStop,
    initialStartTime = 0,
}) => {
    const playerRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(initialStartTime);
    const [duration, setDuration] = useState(0);
    const lastTimeRef = useRef(initialStartTime);

    // 時間のフォーマット (例: 1:30)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const initPlayer = () => {
            playerRef.current = new window.YT.Player('youtube-player', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    controls: 0,
                    disablekb: 1,
                    modestbranding: 1,
                    rel: 0,
                    start: initialStartTime,
                    showinfo: 0,
                    fs: 0,
                    iv_load_policy: 3,
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                },
            });
        };

        window.onYouTubeIframeAPIReady = () => initPlayer();
        if (window.YT && window.YT.Player) initPlayer();

        return () => {
            if (playerRef.current) playerRef.current.destroy();
        };
    }, [videoId]);

    const onPlayerReady = (event: any) => {
        setIsReady(true);
        setDuration(playerRef.current.getDuration());
        event.target.setPlaybackRate(1.0);
    };

    const onPlayerStateChange = (event: any) => {
        setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
        if (event.data === window.YT.PlayerState.ENDED) onComplete();
    };

    // 毎秒の状態更新とスキップガード
    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime && isPlaying) {
                const time = playerRef.current.getCurrentTime();
                const dur = playerRef.current.getDuration();
                
                // スキップ防止 (12秒以上のジャンプを戻す)
                if (time > lastTimeRef.current + 12) {
                    playerRef.current.seekTo(lastTimeRef.current, true);
                } else {
                    lastTimeRef.current = time;
                    setCurrentTime(time);
                }
                
                if (dur > 0) setDuration(dur);
                onProgress(Math.floor(time), Math.floor(dur));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [onProgress, isPlaying]);

    // タブ切り替え時に一時停止
    useEffect(() => {
        const handleVis = () => {
            if (document.hidden && playerRef.current) playerRef.current.pauseVideo();
        };
        document.addEventListener('visibilitychange', handleVis);
        return () => document.removeEventListener('visibilitychange', handleVis);
    }, []);

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    const handleStop = () => {
        if (!playerRef.current) return;
        playerRef.current.pauseVideo();
        onStop(Math.floor(currentTime), Math.floor(duration));
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl group">
            <div id="youtube-player" className="w-full h-full" />
            
            {/* シークバー (非操作) */}
            <div className="absolute bottom-16 left-0 right-0 h-1.5 bg-slate-800 z-20">
                <div 
                    className="h-full bg-indigo-500 transition-all duration-300" 
                    style={{ width: `${progressPercent}%` }} 
                />
            </div>

            {/* カスタムコントロールバー */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-900/90 flex items-center px-6 gap-6 z-20">
                <button 
                    onClick={togglePlay}
                    className="p-2 text-white hover:text-indigo-400 transition-colors"
                >
                    {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current" />}
                </button>

                <button 
                    onClick={handleStop}
                    className="p-2 text-white hover:text-red-400 transition-colors"
                    title="停止して戻る"
                >
                    <Square className="w-6 h-6 fill-current" />
                </button>

                <div className="text-white font-mono text-lg font-bold">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                <div className="ml-auto text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-800 px-3 py-1 rounded-full">
                    {isPlaying ? '再生中' : '一時停止中'}
                </div>
            </div>

            {/* クリック防止用不可視レイヤー */}
            <div className="absolute inset-x-0 top-0 bottom-16 z-10" />

            {!isReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white z-30">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                    <span className="font-bold tracking-widest">動画を準備しています...</span>
                </div>
            )}
        </div>
    );
};
