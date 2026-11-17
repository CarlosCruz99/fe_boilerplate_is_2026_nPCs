"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function FootballScene() {
  const pathname = usePathname();
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const action = /calendario|partidos|arbitro/.test(pathname);
  const team = /equipos|ficha|registro/.test(pathname);
  const referee = pathname.startsWith("/arbitro");
  const publicPage = pathname === "/login" || pathname === "/registro";
  const ambient = publicPage || pathname === "/";
  const showVideo = videoEnabled && ambient && !reduced && !videoError;
  const name = action ? "Día de partido" : team ? "El equipo primero" : "Bajo los reflectores";

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(media.matches);
      let preference = false;
      try { preference = window.localStorage.getItem("npc-motion") === "paused"; } catch { /* La escena funciona también sin almacenamiento local. */ }
      setPaused(media.matches || preference);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    const sync = () => {
      if (paused || document.visibilityState === "hidden") player.pause();
      else void player.play().catch(() => setVideoError(true));
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => { document.removeEventListener("visibilitychange", sync); player.pause(); };
  }, [showVideo, paused]);

  return <>
    <div className={`football-scene ${ambient ? "scene-ambient" : "scene-static"} ${paused ? "is-paused" : ""}`} aria-hidden="true">
      <div className={`scene-frame ${referee ? "scene-referee" : action ? "scene-action" : team ? "scene-team" : "scene-stadium"}`} />
      {showVideo && <video ref={video} className="scene-video" src="/media/training-real.mp4" poster="/media/training-real.webp" muted loop playsInline preload="none" onError={() => setVideoError(true)} />}
      <div className="scene-shade" />
    </div>
    <div className="scene-controls">
      <span><i aria-hidden="true" /> {name}</span>
      <div className="scene-options">
        <details className="media-credits">
          <summary>Créditos visuales</summary>
          <div>
            <p><a href="https://commons.wikimedia.org/wiki/File:Lionel_Messi_20180626.jpg" target="_blank" rel="noreferrer">Lionel Messi</a> · Kirill Venediktov / soccer.ru · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</p>
            <p><a href="https://commons.wikimedia.org/wiki/File:Cristiano_Ronaldo_Real_Madrid.jpg" target="_blank" rel="noreferrer">Cristiano Ronaldo</a> · Anton Zaytsev / soccer.ru · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</p>
            <p><a href="https://commons.wikimedia.org/wiki/File:Messi_Neymar_Mbapp%C3%A9_PSG_2022.jpg" target="_blank" rel="noreferrer">Messi, Neymar y Mbappé</a> · Liondartois · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>.</p>
            <p>Fotos convertidas a WebP; encuadre y oscurecimiento en la interfaz.</p>
            <p><a href="https://www.pexels.com/video/football-players-training-on-the-field-6078275/" target="_blank" rel="noreferrer">Entrenamiento real</a> · Tima Miroshnichenko / Pexels · <a href="https://www.pexels.com/license/" target="_blank" rel="noreferrer">Licencia Pexels</a>. Extracto de 8 segundos, sin audio.</p>
          </div>
        </details>
        {ambient && <button type="button" aria-pressed={videoEnabled} disabled={reduced} onClick={() => { setVideoEnabled(!videoEnabled); setVideoError(false); }}>{videoEnabled ? "Ocultar video" : "Ver entrenamiento"}</button>}
        {ambient && <button type="button" aria-pressed={paused} onClick={() => {
          setPaused(!paused);
          try { window.localStorage.setItem("npc-motion", paused ? "playing" : "paused"); } catch { /* Preferencia opcional. */ }
        }}>{paused ? "Activar movimiento" : "Pausar movimiento"}<span aria-hidden="true">{paused ? " ▷" : " Ⅱ"}</span></button>}
        {videoError && <span role="status">Video no disponible. Se mantiene la fotografía.</span>}
      </div>
    </div>
  </>;
}
