---
version: alpha
name: "File Storage Platform"
description: "A calm workspace for controlling private file storage."
colors:
  ink: "#13223C"
  primary: "#3157CC"
  primary-hover: "#2448B5"
  muted: "#64738B"
  border: "#DCE4EF"
  background: "#F6F8FC"
  surface: "#FFFFFF"
  error: "#B4233D"
typography:
  sans:
    fontFamily: "Arial, Helvetica, sans-serif"
  mono:
    fontFamily: "Geist Mono, monospace"
rounded:
  DEFAULT: "0.5rem"
  sm: "0.5rem"
  md: "0.625rem"
  lg: "1rem"
spacing:
  section-gap: "3rem"
  page-max: "76.25rem"
components:
  button: {}
  card: {}
  input: {}
---

# File Storage Platform Design System

## Overview

The visual reference is a quiet file index: aligned paths, compact metadata, and one clear action at a time. The current product serves people setting up private storage. Authentication is the first usable workflow; project and file management are later phases. UI copy is Vietnamese; technical path labels may remain English. The home page carries the file index motif. Forms and dashboard keep conventional controls and restrained density.

## Tokens and layout

`app/globals.css` owns the runtime CSS variables; this file records their intended roles. Ink is primary text and the dark auth panel. Blue identifies the main action and focus. Muted text remains secondary, while errors pair red with an explicit sentence. The page max is 1220px. The home hero uses two columns above 850px and one below; auth becomes a single column below 850px. Content scrolls naturally on short screens.

## Components and states

Buttons have solid primary and outlined secondary styles, visible focus, hover, pressed, disabled, and busy text states. Inputs use visible labels, 50px height, associated inline errors, and `aria-invalid`. Submit errors stay in an alert near the action. The dashboard shows a loading status until the cookie session has been checked. Failed logout keeps the session visible and offers retry through the same button.

## Motion and content

Only button hover uses a short translation; reduced motion disables it. Avoid decorative animation in forms. Use direct action labels such as “Đăng nhập” and “Tạo tài khoản.” Never display raw API errors or tokens. Keep private content hidden until authentication finishes.
