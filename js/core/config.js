'use strict';

/* =========================================================
   Grundeinstellungen
   ========================================================= */
const W = 320, H = 180;           // interne Pixelauflösung
const WORLD_H = 400;              // Höhe der Straßen-Welt
const STRIP_W = 640;              // Breite des sich wiederholenden Stadtstreifens
const GROUND = 336;               // Oberkante Gehweg hinten
const CAM_MENU_Y = 70;            // Kamera im Hauptmenü (Himmel + Skyline)
const CAM_DEMO_Y = WORLD_H - H;   // Kamera unten auf der Straße
const PLAYER_SPEED = 32;          // Pixel pro Sekunde bei WASD (zusätzlich zum Zug)
const CROWD_SPEED = 11;           // Pixel pro Sekunde
const CROWD_L = 760;              // Länge der Demo-Schleife
const LANES = [352, 360, 368, 376];
