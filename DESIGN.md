---
version: alpha
name: "File Storage Platform"
description: "A calm workspace for controlling private file storage."
colors:
  ink: "#15253E"
  primary: "#2754C7"
  primary-hover: "#1D429E"
  muted: "#52647C"
  border: "#D8E0EB"
  background: "#F3F6FA"
  surface: "#FFFFFF"
  error: "#A82A42"
typography:
  sans:
    fontFamily: "Geist, Segoe UI, Arial, sans-serif"
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

The visual reference is a quiet file index: aligned paths, compact metadata, and one clear action at a time. The current product serves people setting up private storage. Authentication, project/API key management, and the private file explorer are usable workflows. UI copy is Vietnamese; technical path labels may remain English. The home page carries the file index motif. Forms and dashboard keep conventional controls and restrained density. SVG file and project marks are the shared icon language; avoid font glyphs as structural icons.

## Tokens and layout

`app/globals.css` owns the runtime CSS variables; this file records their intended roles. Ink is primary text and the dark auth panel. Blue identifies the main action and focus. Muted text remains secondary, while errors pair red with an explicit sentence. Use `--surface-soft` for inset controls and `--surface-blue` for selected items. Geist is the main typeface with a local system fallback; Geist Mono is reserved for IDs, paths, and values. The page max is 1280px for the workspace and 1220px for the landing page. The home hero uses two columns above 850px and one below; auth becomes a single column below 850px. Content scrolls naturally on short screens.

## Components and states

Buttons have solid primary and outlined secondary styles, visible focus, hover, pressed, disabled, and busy text states. Hover changes color or shadow without shifting the control. Inputs use visible labels, 50px height on auth screens, associated inline errors, and `aria-invalid`. Submit errors stay in an alert near the action. The dashboard shows a loading status until the cookie session has been checked. Failed logout keeps the session visible and offers retry through the same button. The dashboard uses a compact project rail beside the selected project's detail, stacking them below 850px. The API key list shows scope tags and metadata; a separate panel shows a newly issued secret once with copy and close actions. Revoke uses an inline confirmation, not a modal.

The file explorer sits below usage in the selected project detail. Folder chips, compact filters, upload drop area, and file rows share the same quiet borders and blue selected state. File rows show name, MIME, size, and short visible action labels; accessible names include the file name. Preview opens inline and can be closed without changing projects. Audit and admin tables share the same header, row, and pagination styling, with horizontal scrolling on narrow screens.

## Motion and content

Use short color and shadow transitions on hover; reduced motion disables them. Avoid decorative animation in forms. Use direct action labels such as “Đăng nhập” and “Tạo tài khoản.” Never display raw API errors. Show a new API key only in the temporary secret panel; never show it in the metadata list. Keep private content hidden until authentication finishes. See `UX-CONTRACT.md` for dashboard state and focus behavior.
